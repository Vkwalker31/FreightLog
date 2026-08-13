import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: {
      type: String,
      required: [true, 'Госномер обязателен'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9\s-]{4,12}$/, 'Некорректный госномер'],
    },
    brand: {
      type: String,
      required: [true, 'Марка обязательна'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Модель обязательна'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['фургон', 'тягач', 'рефрижератор', 'контейнеровоз', 'самосвал'],
      required: true,
    },
    capacityKg: {
      type: Number,
      required: [true, 'Грузоподъёмность обязательна'],
      min: [100, 'Минимум 100 кг'],
      max: [50000, 'Максимум 50000 кг'],
    },
    status: {
      type: String,
      enum: ['available', 'in_transit', 'maintenance', 'offline'],
      default: 'available',
    },
    fuelLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    lastMaintenance: { type: Date },
    nextMaintenance: { type: Date },
    mileage: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Vehicle', vehicleSchema);
