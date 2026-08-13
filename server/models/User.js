import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Имя обязательно'],
      trim: true,
      minlength: [2, 'Минимум 2 символа'],
      maxlength: [80, 'Максимум 80 символов'],
    },
    email: {
      type: String,
      required: [true, 'Email обязателен'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Некорректный email'],
    },
    password: {
      type: String,
      minlength: [6, 'Пароль минимум 6 символов'],
    },
    role: {
      type: String,
      enum: ['client', 'dispatcher', 'admin'],
      default: 'client',
    },
    googleId: { type: String, sparse: true },
    timezone: { type: String, default: 'Europe/Minsk' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
