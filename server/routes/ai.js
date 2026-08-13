import express from 'express';
import { body } from 'express-validator';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { buildRoute, validateCityName } from '../utils/geocoding.js';

const router = express.Router();

async function computeRoutesGoogle(origin, destination, apiKey) {
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.legs.polyline',
    },
    body: JSON.stringify({
      origin: { address: `${origin}, Беларусь` },
      destination: { address: `${destination}, Беларусь` },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Routes API: ${err}`);
  }
  return response.json();
}

router.post(
  '/optimize',
  optionalAuth,
  [
    body('origin').trim().notEmpty().withMessage('Точка отправления обязательна'),
    body('destination').trim().notEmpty().withMessage('Точка назначения обязательна'),
    body('waypoints').optional().isArray(),
  ],
  validate,
  async (req, res) => {
    try {
      const { origin, destination, waypoints = [] } = req.body;

      const originError = validateCityName(origin);
      const destError = validateCityName(destination);
      if (originError) return res.status(400).json({ message: `Откуда: ${originError}` });
      if (destError) return res.status(400).json({ message: `Куда: ${destError}` });

      for (const wp of waypoints) {
        const wpError = validateCityName(wp);
        if (wpError) {
          return res.status(400).json({ message: `Промежуточная точка «${wp}»: ${wpError}` });
        }
      }

      const localRoute = buildRoute(origin, destination, waypoints);
      const apiKey = process.env.GOOGLE_ROUTES_API_KEY;

      if (apiKey) {
        try {
          const data = await computeRoutesGoogle(origin, destination, apiKey);
          const route = data.routes?.[0];
          if (route?.distanceMeters) {
            return res.json({
              ...localRoute,
              distanceKm: Math.round(route.distanceMeters / 1000),
              durationMinutes: Math.round(
                parseInt(String(route.duration || '0').replace('s', ''), 10) / 60
              ),
              source: 'google',
            });
          }
        } catch {
          /* fallback to local route */
        }
      }

      res.json({ ...localRoute, source: 'local' });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.post(
  '/analyze-document',
  optionalAuth,
  [body('text').trim().isLength({ min: 10 }).withMessage('Минимум 10 символов текста накладной')],
  validate,
  async (req, res) => {
    try {
      const { text } = req.body;
      const apiKey = process.env.IBM_NLU_API_KEY;
      const serviceUrl = process.env.IBM_NLU_URL;

      if (apiKey && serviceUrl) {
        const response = await fetch(`${serviceUrl}/v1/analyze?version=2022-04-07`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`apikey:${apiKey}`).toString('base64')}`,
          },
          body: JSON.stringify({
            text,
            features: { keywords: {}, entities: {}, categories: {} },
            language: 'ru',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return res.json({ source: 'ai', analysis: data });
        }
      }

      const keywords = ['груз', 'накладная', 'отправитель', 'получатель', 'вес', 'маршрут'].filter((k) =>
        text.toLowerCase().includes(k)
      );
      res.json({
        source: 'local',
        analysis: {
          keywords: keywords.map((k) => ({ text: k, relevance: 0.8 })),
          entities: [],
          summary: keywords.length
            ? 'Накладная содержит ключевые поля грузоперевозки'
            : 'Требуется дополнительная проверка накладной',
        },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
