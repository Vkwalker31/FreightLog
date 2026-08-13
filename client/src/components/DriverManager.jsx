import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

const DriverManager = ({
  cargoId = null,
  onDriverAssign = () => {},
  onFuelLog = () => {},
  onVehicleMaintenance = () => {},
}) => {
  const [drivers, setDrivers] = useState([]);
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [maintenanceNote, setMaintenanceNote] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('inspection');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [loading, setLoading] = useState(false);

  const loadDrivers = () => {
    api.getDrivers({ sort: 'rating', order: 'desc' }).then((data) => {
      setDrivers(data.items || []);
    });
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
  };

  const handleAssign = async (driverId) => {
    if (!cargoId) {
      showMessage('Сначала выберите груз в блоке «Обработка заказа»', 'error');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await api.updateCargo(cargoId, { assignedDriver: driverId, status: 'in_transit' });
      await api.patchDriver(driverId, { status: 'assigned' });
      onDriverAssign(driverId, cargoId);
      showMessage('Водитель успешно назначен на груз', 'success');
      loadDrivers();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    onFuelLog({ liters: fuelLiters, cost: fuelCost });
    showMessage(`Заправка: ${fuelLiters} л, ${fuelCost} BYN`, 'success');
    setFuelLiters('');
    setFuelCost('');
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    onVehicleMaintenance({ type: maintenanceType, note: maintenanceNote });
    showMessage(`ТО (${maintenanceType}): ${maintenanceNote}`, 'success');
    setMaintenanceNote('');
  };

  const availableDrivers = drivers.filter((d) => d.status === 'available');

  return (
    <section className="card driver-manager">
      <h3 className="card__title">Управление водителями</h3>

      {!cargoId && (
        <p className="dashboard-hint">Выберите груз выше, чтобы назначить водителя</p>
      )}

      <div className="driver-list">
        {availableDrivers.length === 0 && (
          <p className="dashboard-hint">Нет свободных водителей</p>
        )}
        {availableDrivers.map((driver) => (
          <div key={driver._id} className="driver-card">
            <div>
              <strong>
                {driver.firstName} {driver.lastName}
              </strong>
              <span className="driver-card__meta">
                Кат. {driver.licenseCategory} · {driver.experienceYears} лет · ★ {driver.rating}
              </span>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={loading || !cargoId}
              onClick={() => handleAssign(driver._id)}
            >
              Назначить
            </button>
          </div>
        ))}
      </div>

      <form className="driver-manager__form" onSubmit={handleFuelSubmit}>
        <h4>Журнал заправок</h4>
        <div className="driver-manager__fields">
          <input
            type="number"
            placeholder="Литры"
            value={fuelLiters}
            onChange={(e) => setFuelLiters(e.target.value)}
            min="0"
            step="0.1"
            required
          />
          <input
            type="number"
            placeholder="Стоимость BYN"
            value={fuelCost}
            onChange={(e) => setFuelCost(e.target.value)}
            min="0"
            required
          />
          <button type="submit" className="btn btn--outline btn--sm">
            Записать
          </button>
        </div>
      </form>

      <form className="driver-manager__form" onSubmit={handleMaintenanceSubmit}>
        <h4>Техобслуживание</h4>
        <div className="driver-manager__fields">
          <select value={maintenanceType} onChange={(e) => setMaintenanceType(e.target.value)}>
            <option value="inspection">Осмотр</option>
            <option value="repair">Ремонт</option>
            <option value="tire">Шины</option>
            <option value="oil">Масло</option>
          </select>
          <input
            type="text"
            placeholder="Примечание"
            value={maintenanceNote}
            onChange={(e) => setMaintenanceNote(e.target.value)}
            required
          />
          <button type="submit" className="btn btn--outline btn--sm">
            Записать
          </button>
        </div>
      </form>

      {message && (
        <p className={messageType === 'error' ? 'form-error' : 'form-success'}>{message}</p>
      )}
    </section>
  );
};

export default DriverManager;
