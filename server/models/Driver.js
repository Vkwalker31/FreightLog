import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Имя обязательно'],
      trim: true,
      minlength: 2,
    },
    lastName: {
      type: String,
      required: [true, 'Фамилия обязательна'],
      trim: true,
      minlength: 2,
    },
    licenseNumber: {
      type: String,
      required: [true, 'Номер удостоверения обязателен'],
      unique: true,
      trim: true,
    },
    licenseCategory: {
      type: String,
      enum: ['B', 'C', 'CE', 'D'],
      required: true,
    },
    phone: {
      type: String,
      required: [true, 'Телефон обязателен'],
      match: [/^\+?[0-9\s()-]{7,20}$/, 'Некорректный телефон'],
    },
    experienceYears: {
      type: Number,
      min: [0, 'Опыт не может быть отрицательным'],
      max: [50, 'Максимум 50 лет'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'on_leave', 'inactive'],
      default: 'available',
    },
    assignedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    rating: { type: Number, min: 0, max: 5, default: 5 },
  },
  { timestamps: true }
);

driverSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model('Driver', driverSchema);
