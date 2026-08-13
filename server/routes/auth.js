import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Имя: 2–80 символов'),
    body('email').isEmail().withMessage('Некорректный email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
    body('timezone').optional().isString(),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password, timezone } = req.body;
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: 'Email уже зарегистрирован' });
      }
      const user = await User.create({ name, email, password, timezone });
      const token = signToken(user);
      res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, timezone: user.timezone },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Некорректный email'),
    body('password').notEmpty().withMessage('Пароль обязателен'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Неверный email или пароль' });
      }
      const token = signToken(user);
      res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, timezone: user.timezone },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }
  try {
    const jwt = (await import('jsonwebtoken')).default;
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'dev_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json({ user });
  } catch {
    res.status(401).json({ message: 'Недействительный токен' });
  }
});

export default router;
