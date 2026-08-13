import express from 'express';
import { body } from 'express-validator';
import Route from '../models/Route.js';
import Cargo from '../models/Cargo.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/', protect, async (_req, res) => {
  try {
    const routes = await Route.find()
      .populate('cargo', 'title origin destination status')
      .populate('driver', 'firstName lastName')
      .populate('vehicle', 'plateNumber brand');
    res.json({ items: routes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  '/fuel-log',
  protect,
  [
    body('routeId').notEmpty(),
    body('liters').isFloat({ min: 0 }),
    body('cost').isFloat({ min: 0 }),
    body('station').optional().isString(),
  ],
  validate,
  async (req, res) => {
    try {
      const route = await Route.findById(req.body.routeId);
      if (!route) return res.status(404).json({ message: 'Маршрут не найден' });
      route.fuelLog.push({
        liters: req.body.liters,
        cost: req.body.cost,
        station: req.body.station || '',
      });
      await route.save();
      res.json(route);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.post(
  '/maintenance',
  protect,
  [
    body('routeId').notEmpty(),
    body('note').trim().notEmpty(),
    body('type').isIn(['inspection', 'repair', 'tire', 'oil']),
  ],
  validate,
  async (req, res) => {
    try {
      const route = await Route.findById(req.body.routeId);
      if (!route) return res.status(404).json({ message: 'Маршрут не найден' });
      route.maintenanceNotes.push({ note: req.body.note, type: req.body.type });
      await route.save();
      if (route.vehicle) {
        await Vehicle.findByIdAndUpdate(route.vehicle, { status: 'maintenance' });
      }
      res.json(route);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.post(
  '/process-order',
  protect,
  [body('cargoId').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { cargoId } = req.body;

      const calculateRoute = async () => {
        const cargo = await Cargo.findById(cargoId);
        if (!cargo) throw new Error('Груз не найден');
        const distanceKm = Math.round(Math.random() * 800 + 100);
        const durationMinutes = Math.round(distanceKm / 60 * 60);
        return { cargo, distanceKm, durationMinutes };
      };

      const verifyDocument = async (cargo) => {
        await new Promise((r) => setTimeout(r, 300));
        if (!cargo.documentText && cargo.category === 'hazardous') {
          throw new Error('Для опасного груза требуется накладная');
        }
        return { verified: true, cargoId: cargo._id };
      };

      const assignDriver = async (cargo, routeInfo) => {
        const driver = await Driver.findOne({ status: 'available' });
        const vehicle = await Vehicle.findOne({ status: 'available' });
        if (!driver || !vehicle) throw new Error('Нет свободных водителей или транспорта');

        cargo.status = 'in_transit';
        cargo.assignedDriver = driver._id;
        cargo.assignedVehicle = vehicle._id;
        await cargo.save();

        driver.status = 'assigned';
        driver.assignedVehicle = vehicle._id;
        await driver.save();

        vehicle.status = 'in_transit';
        await vehicle.save();

        const route = await Route.create({
          name: `${cargo.origin.city} → ${cargo.destination.city}`,
          cargo: cargo._id,
          driver: driver._id,
          vehicle: vehicle._id,
          distanceKm: routeInfo.distanceKm,
          durationMinutes: routeInfo.durationMinutes,
          status: 'active',
        });

        return { cargo, driver, vehicle, route };
      };

      const routeInfo = await calculateRoute();
      const verification = await verifyDocument(routeInfo.cargo);
      const result = await assignDriver(routeInfo.cargo, routeInfo);

      res.json({
        message: 'Заказ обработан: маршрут → документ → водитель',
        steps: ['route_calculated', 'document_verified', 'driver_assigned'],
        verification,
        result,
      });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

export default router;
