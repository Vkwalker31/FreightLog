import express from 'express';
import { body, query } from 'express-validator';
import Cargo from '../models/Cargo.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  geocodeCity,
  interpolatePosition,
} from '../utils/geocoding.js';

const router = express.Router();

const cargoValidation = [
  body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Название: 3–120 символов'),
  body('weightKg').isFloat({ min: 1, max: 40000 }).withMessage('Вес: 1–40000 кг'),
  body('price').isFloat({ min: 0 }).withMessage('Цена не может быть отрицательной'),
  body('origin.city').trim().notEmpty().withMessage('Город отправления обязателен'),
  body('destination.city').trim().notEmpty().withMessage('Город назначения обязателен'),
  body('category')
    .optional()
    .isIn(['general', 'refrigerated', 'fragile', 'oversized', 'hazardous', 'documents']),
  body('status').optional().isIn(['pending', 'in_transit', 'delivered', 'cancelled']),
  body('clientPhone')
    .optional({ values: 'falsy' })
    .matches(/^\+?[0-9\s()-]{7,20}$/)
    .withMessage('Некорректный телефон'),
];

router.get(
  '/',
  optionalAuth,
  [
    query('search').optional().isString(),
    query('sort').optional().isIn(['title', 'price', 'weightKg', 'createdAt', 'status']),
    query('order').optional().isIn(['asc', 'desc']),
    query('status').optional().isString(),
    query('category').optional().isString(),
  ],
  validate,
  async (req, res) => {
    try {
      const { search, sort = 'createdAt', order = 'desc', status, category } = req.query;
      const filter = {};
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { 'origin.city': { $regex: search, $options: 'i' } },
          { 'destination.city': { $regex: search, $options: 'i' } },
          { clientName: { $regex: search, $options: 'i' } },
        ];
      }
      if (status) filter.status = status;
      if (category) filter.category = category;

      const sortObj = { [sort]: order === 'asc' ? 1 : -1 };
      const cargo = await Cargo.find(filter)
        .sort(sortObj)
        .populate('assignedDriver', 'firstName lastName phone')
        .populate('assignedVehicle', 'plateNumber brand model');

      res.json({ items: cargo, total: cargo.length });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const cargo = await Cargo.findById(req.params.id)
      .populate('assignedDriver')
      .populate('assignedVehicle')
      .populate('createdBy', 'name email');
    if (!cargo) return res.status(404).json({ message: 'Груз не найден' });
    res.json(cargo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function resolveLocationCoords(location) {
  if (!location?.city?.trim()) return null;

  if (location.lat != null && location.lng != null) {
    return { lat: location.lat, lng: location.lng, city: location.city };
  }

  const geocoded = geocodeCity(location.city);
  if (!geocoded) return null;

  return { lat: geocoded.lat, lng: geocoded.lng, city: geocoded.city };
}

router.get('/:id/track', async (req, res) => {
  try {
    const cargo = await Cargo.findById(req.params.id);
    if (!cargo) return res.status(404).json({ message: 'Груз не найден' });

    const originCoords = resolveLocationCoords(cargo.origin);
    const destCoords = resolveLocationCoords(cargo.destination);

    if (!originCoords || !destCoords) {
      const missing = [];
      if (!originCoords) missing.push(`отправления «${cargo.origin?.city || '—'}»`);
      if (!destCoords) missing.push(`назначения «${cargo.destination?.city || '—'}»`);
      return res.status(400).json({
        message: `Не удалось определить координаты города ${missing.join(' и ')}. Используйте города из справочника (Минск, Гомель, Брест и др.).`,
      });
    }

    cargo.origin.lat = originCoords.lat;
    cargo.origin.lng = originCoords.lng;
    cargo.destination.lat = destCoords.lat;
    cargo.destination.lng = destCoords.lng;

    let progress = cargo.trackingProgress ?? 0;

    if (cargo.status === 'pending' || cargo.status === 'cancelled') {
      progress = 0;
    } else if (cargo.status === 'delivered') {
      progress = 100;
    } else if (cargo.status === 'in_transit') {
      progress = Math.min(95, progress + 4 + Math.random() * 4);
    }

    const position = interpolatePosition(originCoords, destCoords, progress);
    cargo.trackingProgress = Math.round(progress);
    cargo.trackingLat = position.lat;
    cargo.trackingLng = position.lng;
    await cargo.save();

    res.json({
      id: cargo._id,
      status: cargo.status,
      lat: position.lat,
      lng: position.lng,
      progress: Math.round(progress),
      origin: {
        city: cargo.origin.city,
        lat: originCoords.lat,
        lng: originCoords.lng,
      },
      destination: {
        city: cargo.destination.city,
        lat: destCoords.lat,
        lng: destCoords.lng,
      },
      plannedDelivery: cargo.plannedDelivery,
      updatedAt: cargo.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, cargoValidation, validate, async (req, res) => {
  try {
    const cargo = await Cargo.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(cargo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, cargoValidation, validate, async (req, res) => {
  try {
    const cargo = await Cargo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!cargo) return res.status(404).json({ message: 'Груз не найден' });
    res.json(cargo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const cargo = await Cargo.findByIdAndDelete(req.params.id);
    if (!cargo) return res.status(404).json({ message: 'Груз не найден' });
    res.json({ message: 'Груз удалён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
