import express from 'express';
import { body, query } from 'express-validator';
import Vehicle from '../models/Vehicle.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const vehicleValidation = [
  body('plateNumber').trim().notEmpty().withMessage('Госномер обязателен'),
  body('brand').trim().notEmpty().withMessage('Марка обязательна'),
  body('model').trim().notEmpty().withMessage('Модель обязательна'),
  body('type').isIn(['фургон', 'тягач', 'рефрижератор', 'контейнеровоз', 'самосвал']),
  body('capacityKg').isFloat({ min: 100, max: 50000 }),
  body('status').optional().isIn(['available', 'in_transit', 'maintenance', 'offline']),
  body('fuelLevel').optional().isFloat({ min: 0, max: 100 }),
];

router.get(
  '/',
  optionalAuth,
  [
    query('search').optional().isString(),
    query('sort').optional().isIn(['plateNumber', 'brand', 'capacityKg', 'status', 'createdAt']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  validate,
  async (req, res) => {
    try {
      const { search, sort = 'plateNumber', order = 'asc' } = req.query;
      const filter = {};
      if (search) {
        filter.$or = [
          { plateNumber: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } },
        ];
      }
      const vehicles = await Vehicle.find(filter).sort({ [sort]: order === 'asc' ? 1 : -1 });
      res.json({ items: vehicles, total: vehicles.length });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Транспорт не найден' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, vehicleValidation, validate, async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, vehicleValidation, validate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vehicle) return res.status(404).json({ message: 'Транспорт не найден' });
    res.json(vehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Транспорт не найден' });
    res.json({ message: 'Транспорт удалён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
