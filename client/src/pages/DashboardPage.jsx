import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import SortableTable from '../components/SortableTable.jsx';
import CargoForm from '../components/CargoForm.jsx';
import RouteOptimizer from '../components/RouteOptimizer.jsx';
import CargoTracker from '../components/CargoTracker.jsx';
import DriverManager from '../components/DriverManager.jsx';
import DashboardGuide from '../components/DashboardGuide.jsx';
import { addNotification } from '../components/NotificationBar.jsx';

const STATUS_LABELS = {
  pending: 'Ожидает',
  in_transit: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

function DashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadItems = () => {
    api.getCargo({ sort: 'createdAt', order: 'desc' }).then((data) => setItems(data.items || []));
  };

  useEffect(() => {
    if (isAuthenticated) loadItems();
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const selectedCargoData = items.find((c) => c._id === selectedCargo);
  const canTrack = selectedCargoData && ['in_transit', 'delivered'].includes(selectedCargoData.status);

  const handleCreate = async (payload) => {
    await api.createCargo(payload);
    setShowForm(false);
    loadItems();
    addNotification('Груз добавлен', 'success');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить запись?')) return;
    await api.deleteCargo(id);
    if (selectedCargo === id) setSelectedCargo('');
    loadItems();
    addNotification('Груз удалён', 'info');
  };

  const handleProcessOrder = async () => {
    if (!selectedCargo) return;
    setProcessing(true);
    try {
      const result = await api.processOrder({ cargoId: selectedCargo });
      addNotification(result.message, 'success', 7000);
      loadItems();
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const onRouteCalculate = (data) =>
    addNotification(`Маршрут: ${data.distanceKm} км, ~${data.durationMinutes} мин`, 'info');
  const onDriverAssign = () => {
    addNotification('Водитель назначен на груз', 'success');
    loadItems();
  };
  const onFuelLog = (data) => addNotification(`Заправка: ${data.liters} л записана`, 'info');
  const onVehicleMaintenance = (data) => addNotification(`ТО: ${data.type} записано`, 'info');

  return (
    <div className="page dashboard-page container">
      <header className="page-header">
        <h1>Панель управления</h1>
        <p>Добро пожаловать, {user.name}. Здесь вы управляете грузами, маршрутами и водителями.</p>
      </header>

      <DashboardGuide />

      <section className="dashboard-block">
        <div className="dashboard-block__header">
          <h2>Каталог грузов</h2>
          <button type="button" className="btn btn--primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Скрыть форму' : '+ Добавить груз'}
          </button>
        </div>

        {showForm && (
          <div className="dashboard-block__form card">
            <h3 className="card__title">Новый груз</h3>
            <CargoForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} submitLabel="Создать" />
          </div>
        )}

        <div className="dashboard-block__table">
          <SortableTable
            items={items}
            sortField="createdAt"
            sortOrder="desc"
            onSort={() => {}}
            showActions
            onDelete={handleDelete}
            timezone={user.timezone}
          />
        </div>
      </section>

      <section className="dashboard-block">
        <h2 className="dashboard-block__title">Диспетчерская</h2>

        <div className="dashboard-panels">
          <div className="dashboard-panel dashboard-panel--main">
            <RouteOptimizer onRouteCalculate={onRouteCalculate} />
          </div>

          <div className="dashboard-panel dashboard-panel--side">
            <section className="card dashboard-order-card">
              <h3 className="card__title">Обработка заказа</h3>
              <p className="dashboard-order-card__desc">
                Автоматическая цепочка: расчёт маршрута → проверка накладной → назначение водителя
              </p>

              <label className="form-field">
                Выберите груз
                <select
                  value={selectedCargo}
                  onChange={(e) => setSelectedCargo(e.target.value)}
                  className="filter-select dashboard-select"
                >
                  <option value="">— не выбран —</option>
                  {items.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} ({STATUS_LABELS[c.status] || c.status})
                    </option>
                  ))}
                </select>
              </label>

              {selectedCargoData && (
                <div className="dashboard-order-card__info">
                  <span>
                    {selectedCargoData.origin?.city} → {selectedCargoData.destination?.city}
                  </span>
                  <span className={`badge badge--${selectedCargoData.status}`}>
                    {STATUS_LABELS[selectedCargoData.status]}
                  </span>
                </div>
              )}

              <button
                type="button"
                className="btn btn--primary btn--full"
                disabled={!selectedCargo || processing || selectedCargoData?.status !== 'pending'}
                onClick={handleProcessOrder}
              >
                {processing ? 'Обработка...' : 'Запустить цепочку'}
              </button>

              {selectedCargoData?.status !== 'pending' && selectedCargo && (
                <p className="dashboard-hint">
                  Цепочка доступна только для грузов со статусом «Ожидает»
                </p>
              )}
            </section>

            <DriverManager
              cargoId={selectedCargo || null}
              onDriverAssign={onDriverAssign}
              onFuelLog={onFuelLog}
              onVehicleMaintenance={onVehicleMaintenance}
            />
          </div>
        </div>
      </section>

      {selectedCargo && (
        <section className="dashboard-block dashboard-block--tracking">
          <h2 className="dashboard-block__title">Отслеживание груза</h2>
          {canTrack ? (
            <div className="dashboard-panel dashboard-panel--full">
              <CargoTracker
                key={selectedCargo}
                cargoId={selectedCargo}
                plannedDelivery={selectedCargoData?.plannedDelivery}
              />
            </div>
          ) : (
            <div className="card dashboard-track-placeholder">
              <p>
                Груз «{selectedCargoData?.title}» ещё не отправлен (статус:{' '}
                {STATUS_LABELS[selectedCargoData?.status]}).
              </p>
              <p className="dashboard-hint">
                Запустите цепочку обработки или назначьте водителя — после смены статуса на «В пути»
                здесь появится карта с GPS-отслеживанием.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default DashboardPage;
