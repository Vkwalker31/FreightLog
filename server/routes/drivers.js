import express from 'express';
import { body, query } from 'express-validator';
import Driver from '../models/Driver.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const driverValidation = [
  body('firstName').trim().isLength({ min: 2 }).withMessage('Имя обязательно'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Фамилия обязательна'),
  body('licenseNumber').trim().notEmpty().withMessage('Номер удостоверения обязателен'),
  body('licenseCategory').isIn(['B', 'C', 'CE', 'D']).withMessage('Некорректная категория'),
  body('phone').matches(/^\+?[0-9\s()-]{7,20}$/).withMessage('Некорректный телефон'),
  body('experienceYears').optional().isInt({ min: 0, max: 50 }),
  body('status').optional().isIn(['available', 'assigned', 'on_leave', 'inactive']),
];

router.get(
  '/',
  optionalAuth,
  [
    query('search').optional().isString(),
    query('sort').optional().isIn(['firstName', 'lastName', 'experienceYears', 'rating', 'createdAt']),
    query('order').optional().isIn(['asc', 'desc']),
    query('status').optional().isString(),
  ],
  validate,
  async (req, res) => {
    try {
      const { search, sort = 'lastName', order = 'asc', status } = req.query;
      const filter = {};
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { licenseNumber: { $regex: search, $options: 'i' } },
        ];
      }
      if (status) filter.status = status;

      const drivers = await Driver.find(filter)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .populate('assignedVehicle', 'plateNumber brand model');

      res.json({ items: drivers, total: drivers.length });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('assignedVehicle');
    if (!driver) return res.status(404).json({ message: 'Водитель не найден' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, driverValidation, validate, async (req, res) => {
  try {
    const driver = await Driver.create(req.body);
    res.status(201).json(driver);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, driverValidation, validate, async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!driver) return res.status(404).json({ message: 'Водитель не найден' });
    res.json(driver);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch(
  '/:id',
  protect,
  [
    body('status').optional().isIn(['available', 'assigned', 'on_leave', 'inactive']),
    body('assignedVehicle').optional(),
    body('rating').optional().isFloat({ min: 0, max: 5 }),
  ],
  validate,
  async (req, res) => {
    try {
      const driver = await Driver.findById(req.params.id);
      if (!driver) return res.status(404).json({ message: 'Водитель не найден' });

      Object.assign(driver, req.body);
      await driver.save();
      res.json(driver);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.delete('/:id', protect, async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Водитель не найден' });
    res.json({ message: 'Водитель удалён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
