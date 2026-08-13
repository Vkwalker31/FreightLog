import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Cargo from '../models/Cargo.js';
import Route from '../models/Route.js';

const vehicles = [
  { plateNumber: 'AB1234-7', brand: 'MAN', model: 'TGX', type: 'тягач', capacityKg: 20000, status: 'available' },
  { plateNumber: 'BC5678-1', brand: 'Volvo', model: 'FH16', type: 'рефрижератор', capacityKg: 18000, status: 'available' },
  { plateNumber: 'CD9012-5', brand: 'Mercedes', model: 'Actros', type: 'контейнеровоз', capacityKg: 24000, status: 'in_transit' },
  { plateNumber: 'DE3456-3', brand: 'Scania', model: 'R450', type: 'фургон', capacityKg: 12000, status: 'available' },
  { plateNumber: 'EF7890-2', brand: 'DAF', model: 'XF', type: 'самосвал', capacityKg: 25000, status: 'maintenance' },
];

const drivers = [
  { firstName: 'Иван', lastName: 'Петров', licenseNumber: 'BY1234567', licenseCategory: 'CE', phone: '+375291234567', experienceYears: 12, status: 'available' },
  { firstName: 'Алексей', lastName: 'Сидоров', licenseNumber: 'BY2345678', licenseCategory: 'C', phone: '+375292345678', experienceYears: 8, status: 'assigned' },
  { firstName: 'Дмитрий', lastName: 'Козлов', licenseNumber: 'BY3456789', licenseCategory: 'CE', phone: '+375293456789', experienceYears: 15, status: 'available' },
  { firstName: 'Сергей', lastName: 'Новиков', licenseNumber: 'BY4567890', licenseCategory: 'C', phone: '+375294567890', experienceYears: 5, status: 'available' },
  { firstName: 'Андрей', lastName: 'Морозов', licenseNumber: 'BY5678901', licenseCategory: 'CE', phone: '+375295678901', experienceYears: 20, status: 'on_leave' },
];

const cargoItems = [
  { title: 'Промышленное оборудование', category: 'oversized', weightKg: 8500, volumeM3: 45, origin: { city: 'Минск', address: 'ул. Промышленная 12', lat: 53.9, lng: 27.5667 }, destination: { city: 'Гомель', address: 'пр. Ленина 45', lat: 52.4345, lng: 30.9754 }, price: 1200, status: 'pending', clientName: 'ОАО «БелТех»', clientPhone: '+375171111111', documentText: 'Накладная №101. Груз: промышленное оборудование. Вес 8500 кг.' },
  { title: 'Продукты питания (заморозка)', category: 'refrigerated', weightKg: 3200, volumeM3: 18, origin: { city: 'Минск', lat: 53.9, lng: 27.5667 }, destination: { city: 'Витебск', lat: 55.1904, lng: 30.2049 }, price: 680, status: 'in_transit', clientName: 'ООО «СеверПродукт»', clientPhone: '+375172222222', plannedDelivery: new Date(Date.now() + 86400000) },
  { title: 'Строительные материалы', category: 'general', weightKg: 15000, volumeM3: 60, origin: { city: 'Брест', lat: 52.0976, lng: 23.7341 }, destination: { city: 'Минск', lat: 53.9, lng: 27.5667 }, price: 950, status: 'delivered', clientName: 'СтройКомплект', clientPhone: '+375173333333' },
  { title: 'Медицинское оборудование', category: 'fragile', weightKg: 450, volumeM3: 3, origin: { city: 'Минск' }, destination: { city: 'Могилёв', lat: 53.8945, lng: 30.3307 }, price: 420, status: 'pending', clientName: 'МедТех', clientPhone: '+375174444444', documentText: 'Хрупкий груз. Требуется аккуратная погрузка.' },
  { title: 'Химические реактивы', category: 'hazardous', weightKg: 800, volumeM3: 2, origin: { city: 'Гродно', lat: 53.6693, lng: 23.8131 }, destination: { city: 'Минск' }, price: 1100, status: 'pending', clientName: 'ХимПром', clientPhone: '+375175555555', documentText: 'Опасный груз класса 3. Накладная №205. Отправитель: ХимПром.' },
  { title: 'Офисная мебель', category: 'general', weightKg: 2200, volumeM3: 25, origin: { city: 'Минск' }, destination: { city: 'Брест' }, price: 550, status: 'in_transit', clientName: 'ОфисСтиль', clientPhone: '+375176666666', plannedDelivery: new Date(Date.now() - 3600000) },
  { title: 'Электроника (партия)', category: 'fragile', weightKg: 680, volumeM3: 5, origin: { city: 'Минск' }, destination: { city: 'Гродно' }, price: 380, status: 'pending', clientName: 'TechStore', clientPhone: '+375177777777' },
  { title: 'Сельхозпродукция', category: 'general', weightKg: 12000, volumeM3: 55, origin: { city: 'Могилёв' }, destination: { city: 'Минск' }, price: 720, status: 'delivered', clientName: 'АгроБел', clientPhone: '+375178888888' },
  { title: 'Контейнер 40ft', category: 'oversized', weightKg: 22000, volumeM3: 67, origin: { city: 'Минск' }, destination: { city: 'Москва', lat: 55.7558, lng: 37.6173 }, price: 2800, status: 'pending', clientName: 'TransLog', clientPhone: '+375179999999', documentText: 'Международная накладная CMR. Контейнер 40ft.' },
  { title: 'Документы и ценности', category: 'documents', weightKg: 15, volumeM3: 0.1, origin: { city: 'Минск' }, destination: { city: 'Витебск' }, price: 150, status: 'in_transit', clientName: 'Банк Бел', clientPhone: '+375170000000', plannedDelivery: new Date(Date.now() + 43200000) },
  { title: 'Автозапчасти', category: 'general', weightKg: 3400, volumeM3: 12, origin: { city: 'Гомель' }, destination: { city: 'Минск' }, price: 490, status: 'pending', clientName: 'AutoParts BY', clientPhone: '+375171010101' },
  { title: 'Текстильная продукция', category: 'general', weightKg: 1800, volumeM3: 20, origin: { city: 'Минск' }, destination: { city: 'Пинск', lat: 52.1229, lng: 26.0951 }, price: 310, status: 'cancelled', clientName: 'TextilePro', clientPhone: '+375172020202' },
];

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    Driver.deleteMany({}),
    Cargo.deleteMany({}),
    Route.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Администратор',
    email: 'admin@freight.by',
    password: 'admin123',
    role: 'admin',
    timezone: 'Europe/Minsk',
  });

  await User.create({
    name: 'Диспетчер',
    email: 'dispatcher@freight.by',
    password: 'disp123',
    role: 'dispatcher',
    timezone: 'Europe/Minsk',
  });

  const createdVehicles = await Vehicle.insertMany(vehicles);
  const createdDrivers = await Driver.insertMany(
    drivers.map((d, i) => ({
      ...d,
      assignedVehicle: i === 1 ? createdVehicles[2]._id : undefined,
    }))
  );

  const createdCargo = await Cargo.insertMany(
    cargoItems.map((c, i) => ({
      ...c,
      createdBy: admin._id,
      assignedDriver: i === 1 ? createdDrivers[1]._id : undefined,
      assignedVehicle: i === 1 ? createdVehicles[2]._id : undefined,
      trackingProgress: i === 1 ? 35 : i === 5 ? 60 : 0,
    }))
  );

  await Route.create({
    name: 'Минск → Витебск',
    cargo: createdCargo[1]._id,
    driver: createdDrivers[1]._id,
    vehicle: createdVehicles[2]._id,
    distanceKm: 280,
    durationMinutes: 210,
    status: 'active',
    optimized: true,
  });

  console.log('Seed completed:');
  console.log(`  Users: 2 (admin@freight.by / admin123, dispatcher@freight.by / disp123)`);
  console.log(`  Vehicles: ${createdVehicles.length}`);
  console.log(`  Drivers: ${createdDrivers.length}`);
  console.log(`  Cargo: ${createdCargo.length}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
