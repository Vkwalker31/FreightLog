import mongoose from 'mongoose';

const cargoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Название груза обязательно'],
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: ['general', 'refrigerated', 'fragile', 'oversized', 'hazardous', 'documents'],
      default: 'general',
    },
    weightKg: {
      type: Number,
      required: [true, 'Вес обязателен'],
      min: [1, 'Минимум 1 кг'],
      max: [40000, 'Максимум 40000 кг'],
    },
    volumeM3: {
      type: Number,
      min: [0.1, 'Минимум 0.1 м³'],
      max: [120, 'Максимум 120 м³'],
    },
    origin: {
      city: { type: String, required: true, trim: true },
      address: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    destination: {
      city: { type: String, required: true, trim: true },
      address: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    price: {
      type: Number,
      required: [true, 'Стоимость обязательна'],
      min: [0, 'Цена не может быть отрицательной'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    clientName: { type: String, trim: true },
    clientPhone: {
      type: String,
      match: [/^\+?[0-9\s()-]{7,20}$/, 'Некорректный телефон'],
    },
    plannedDelivery: { type: Date },
    actualDelivery: { type: Date },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    trackingLat: { type: Number },
    trackingLng: { type: Number },
    trackingProgress: { type: Number, min: 0, max: 100, default: 0 },
    documentText: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Cargo', cargoSchema);
