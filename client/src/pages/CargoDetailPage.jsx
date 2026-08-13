import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, formatDateTime } from '../services/api.js';
import CargoTracker from '../components/CargoTracker.jsx';
import MapView from '../components/MapView.jsx';
import { addNotification } from '../components/NotificationBar.jsx';

function CargoDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [cargo, setCargo] = useState(null);
  const [docText, setDocText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCargoById(id)
      .then((data) => {
        setCargo(data);
        setDocText(data.documentText || '');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onDocumentScan = async () => {
    if (!isAuthenticated) {
      addNotification('Анализ накладной доступен после авторизации', 'warning');
      return;
    }
    try {
      const result = await api.analyzeDocument({ text: docText });
      setAnalysis(result);
      addNotification('Накладная проанализирована', 'success');
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  const onDeliveryConfirm = async () => {
    if (!isAuthenticated) {
      addNotification('Подтверждение доставки доступно после авторизации', 'warning');
      return;
    }
    try {
      const updated = await api.updateCargo(id, {
        status: 'delivered',
        actualDelivery: new Date().toISOString(),
      });
      setCargo(updated);
      addNotification('Доставка подтверждена!', 'success', 6000);
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  const onCargoTrack = (cargoId) => {
    console.log('Tracking cargo:', cargoId);
  };

  if (loading) return <div className="container page"><p>Загрузка...</p></div>;
  if (!cargo) return <div className="container page"><p>Груз не найден</p></div>;

  const created = formatDateTime(cargo.createdAt);
  const updated = formatDateTime(cargo.updatedAt);
  const mapPoints = [
    cargo.origin?.lat && {
      lat: cargo.origin.lat,
      lng: cargo.origin.lng,
      label: `Отправление: ${cargo.origin.city}`,
    },
    cargo.trackingLat && {
      lat: cargo.trackingLat,
      lng: cargo.trackingLng,
      label: 'Текущая позиция',
    },
    cargo.destination?.lat && {
      lat: cargo.destination.lat,
      lng: cargo.destination.lng,
      label: `Назначение: ${cargo.destination.city}`,
    },
  ].filter(Boolean);

  return (
    <div className="page detail-page container">
      <Link to="/catalog" className="back-link">← Назад к каталогу</Link>

      <header className="detail-header">
        <h1>{cargo.title}</h1>
        <span className={`badge badge--${cargo.status}`}>{cargo.status}</span>
      </header>

      <div className="detail-grid">
        <section className="card detail-info">
          <h2>Информация о грузе</h2>
          <dl className="detail-list">
            <dt>Категория</dt>
            <dd>{cargo.category}</dd>
            <dt>Вес</dt>
            <dd>{cargo.weightKg} кг</dd>
            <dt>Объём</dt>
            <dd>{cargo.volumeM3 ? `${cargo.volumeM3} м³` : '—'}</dd>
            <dt>Цена</dt>
            <dd>{cargo.price} BYN</dd>
            <dt>Маршрут</dt>
            <dd>
              {cargo.origin?.city} → {cargo.destination?.city}
            </dd>
            <dt>Клиент</dt>
            <dd>{cargo.clientName || '—'}</dd>
            <dt>Телефон</dt>
            <dd>{cargo.clientPhone || '—'}</dd>
            <dt>Добавлено ({created.userTz})</dt>
            <dd>
              {created.local}
              <small>UTC: {created.utc}</small>
            </dd>
            <dt>Изменено ({updated.userTz})</dt>
            <dd>
              {updated.local}
              <small>UTC: {updated.utc}</small>
            </dd>
          </dl>

          {isAuthenticated && cargo.status !== 'delivered' && (
            <button type="button" className="btn btn--primary" onClick={onDeliveryConfirm}>
              Подтвердить доставку
            </button>
          )}
        </section>

        <section className="card">
          <h2>Карта маршрута</h2>
          <MapView points={mapPoints} height={280} />
        </section>

        <CargoTracker
          cargoId={id}
          plannedDelivery={cargo.plannedDelivery}
          onCargoTrack={onCargoTrack}
        />

        <section className="card">
          <h2>Анализ накладной</h2>
          <textarea
            className="doc-textarea"
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
            rows={4}
            placeholder="Вставьте текст накладной..."
          />
          <button type="button" className="btn btn--outline" onClick={onDocumentScan}>
            Проверить документ
          </button>
          {analysis && (
            <div className="analysis-result animate-fade-in">
              <p>{analysis.analysis?.summary || 'Анализ завершён'}</p>
              {analysis.analysis?.keywords?.length > 0 && (
                <ul>
                  {analysis.analysis.keywords.map((k, i) => (
                    <li key={i}>
                      {k.text} ({Math.round((k.relevance || 0) * 100)}%)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default CargoDetailPage;
