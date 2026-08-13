import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Название маршрута обязательно'],
      trim: true,
    },
    cargo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cargo',
      required: true,
    },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    waypoints: [
      {
        city: String,
        lat: Number,
        lng: Number,
        order: Number,
      },
    ],
    distanceKm: { type: Number, min: 0 },
    durationMinutes: { type: Number, min: 0 },
    optimized: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['planned', 'active', 'completed', 'cancelled'],
      default: 'planned',
    },
    fuelLog: [
      {
        liters: { type: Number, min: 0 },
        cost: { type: Number, min: 0 },
        station: String,
        loggedAt: { type: Date, default: Date.now },
      },
    ],
    maintenanceNotes: [
      {
        note: String,
        type: { type: String, enum: ['inspection', 'repair', 'tire', 'oil'] },
        loggedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Route', routeSchema);
