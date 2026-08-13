import { useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { parseWaypoints, validateRouteForm } from '../utils/validation.js';
import MapView from './MapView.jsx';

function RouteOptimizer({ defaultOrigin = 'Минск', defaultDestination = 'Гомель', onRouteCalculate }) {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [waypoints, setWaypoints] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const parsedWaypoints = useMemo(() => parseWaypoints(waypoints), [waypoints]);

  const mapPoints = useMemo(() => {
    if (!result?.polyline?.length) return [];
    return result.polyline;
  }, [result]);

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const errors = validateRouteForm(origin, destination, parsedWaypoints);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setError('Проверьте названия городов. Допустимы только буквы, пробелы и дефис.');
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const data = await api.optimizeRoute({
        origin: origin.trim(),
        destination: destination.trim(),
        waypoints: parsedWaypoints,
      });
      setResult(data);
      onRouteCalculate?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card route-optimizer">
      <h3 className="card__title">Оптимизация маршрута</h3>
      <p className="route-hint">
        Укажите города Беларуси: Минск, Гомель, Бобруйск, Витебск, Брест, Гродно, Могилёв и др.
      </p>
      <form className="form-grid" onSubmit={handleCalculate} noValidate>
        <label className="form-field">
          Откуда
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Минск"
            required
          />
          {fieldErrors.origin && <span className="field-error">{fieldErrors.origin}</span>}
        </label>
        <label className="form-field">
          Куда
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Гомель"
            required
          />
          {fieldErrors.destination && <span className="field-error">{fieldErrors.destination}</span>}
        </label>
        <label className="form-field form-field--full">
          Промежуточные точки (через запятую)
          <input
            value={waypoints}
            onChange={(e) => setWaypoints(e.target.value)}
            placeholder="Бобруйск, Могилёв"
          />
        </label>
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Расчёт...' : 'Рассчитать маршрут'}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {result && (
        <div className="route-result animate-fade-in">
          <div className="stats-grid">
            <div className="stat">
              <span className="stat__label">Расстояние</span>
              <span className="stat__value">{result.distanceKm} км</span>
            </div>
            <div className="stat">
              <span className="stat__label">Время в пути</span>
              <span className="stat__value">{result.durationMinutes} мин</span>
            </div>
            <div className="stat">
              <span className="stat__label">Экономия</span>
              <span className="stat__value">{result.savingsPercent ?? 0}%</span>
            </div>
            <div className="stat">
              <span className="stat__label">Маршрут</span>
              <span className="stat__value stat__value--route">
                {[result.origin, ...(result.waypoints || []), result.destination].join(' → ')}
              </span>
            </div>
          </div>
          <MapView points={mapPoints} height={280} />
        </div>
      )}
    </section>
  );
}

export default RouteOptimizer;
