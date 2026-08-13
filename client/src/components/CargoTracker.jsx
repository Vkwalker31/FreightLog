import React, { Component } from 'react';
import { trackCargoXHR } from '../services/api.js';
import MapView from './MapView.jsx';
import { addNotification } from './NotificationBar.jsx';

class CargoTracker extends Component {
  static defaultProps = {
    cargoId: null,
    pollInterval: 8000,
    plannedDelivery: null,
    origin: null,
    destination: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      position: null,
      origin: null,
      destination: null,
      progress: 0,
      status: 'idle',
      requestProgress: 0,
      delayNotified: false,
      error: null,
    };
    this.xhr = null;
    this.pollTimer = null;
    this.delayTimer = null;
  }

  componentDidMount() {
    if (this.props.cargoId) {
      this.startTracking(this.props.cargoId);
    }
    this.setupDelayCheck();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.cargoId !== this.props.cargoId && this.props.cargoId) {
      this.stopTracking();
      this.setState({
        position: null,
        origin: null,
        destination: null,
        progress: 0,
        status: 'idle',
        error: null,
      });
      this.startTracking(this.props.cargoId);
    }
    if (prevProps.plannedDelivery !== this.props.plannedDelivery) {
      this.setupDelayCheck();
    }
  }

  componentWillUnmount() {
    this.stopTracking();
    if (this.delayTimer) clearTimeout(this.delayTimer);
  }

  setupDelayCheck = () => {
    if (this.delayTimer) clearTimeout(this.delayTimer);
    const { plannedDelivery } = this.props;
    if (!plannedDelivery) return;

    const planned = new Date(plannedDelivery).getTime();
    const now = Date.now();
    const delay = planned - now;

    if (delay < 0 && !this.state.delayNotified) {
      this.notifyDelay();
      return;
    }

    if (delay > 0) {
      this.delayTimer = setTimeout(() => {
        this.notifyDelay();
      }, delay);
    }
  };

  notifyDelay = () => {
    if (this.state.delayNotified) return;
    this.setState({ delayNotified: true });
    const msg = 'Превышено плановое время доставки!';
    addNotification(msg, 'warning', 8000);
    this.props.onDelay?.(msg);

    const stored = JSON.parse(localStorage.getItem('delay_timers') || '{}');
    stored[this.props.cargoId] = { notifiedAt: Date.now(), message: msg };
    localStorage.setItem('delay_timers', JSON.stringify(stored));
  };

  onCargoTrack = (cargoId) => {
    if (this.xhr) {
      this.xhr.abort();
    }

    this.setState({ status: 'tracking', error: null, requestProgress: 0 });
    this.props.onCargoTrack?.(cargoId);

    this.xhr = trackCargoXHR(
      cargoId,
      (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          this.setState({ requestProgress: pct });
        }
      },
      (data) => {
        const origin = data.origin
          ? { lat: data.origin.lat, lng: data.origin.lng, label: `Отправление: ${data.origin.city}` }
          : null;
        const destination = data.destination
          ? {
              lat: data.destination.lat,
              lng: data.destination.lng,
              label: `Назначение: ${data.destination.city}`,
            }
          : null;

        this.setState({
          position: { lat: data.lat, lng: data.lng },
          origin,
          destination,
          progress: data.progress ?? 0,
          status: data.status,
          requestProgress: 100,
        });
        this.props.onTrackUpdate?.(data);
      },
      (err) => {
        if (err.message !== 'Запрос отменён') {
          this.setState({ error: err.message, status: 'error' });
        }
      }
    );
  };

  startTracking = (cargoId) => {
    this.onCargoTrack(cargoId);
    this.pollTimer = setInterval(() => this.onCargoTrack(cargoId), this.props.pollInterval);
  };

  stopTracking = () => {
    if (this.xhr) {
      this.xhr.abort();
      this.xhr = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  };

  handleManualRefresh = () => {
    if (this.props.cargoId) {
      this.onCargoTrack(this.props.cargoId);
    }
  };

  buildMapPoints() {
    const { origin, destination, position } = this.state;

    if (!origin || !destination) {
      return position
        ? [{ lat: position.lat, lng: position.lng, label: 'Груз' }]
        : [{ lat: 53.9, lng: 27.5667, label: 'Ожидание данных' }];
    }

    const points = [
      origin,
      { lat: position.lat, lng: position.lng, label: `Груз (${this.state.progress}%)` },
      destination,
    ];

    return points;
  }

  render() {
    const { position, progress, status, requestProgress, error, origin, destination } = this.state;
    const mapPoints = this.buildMapPoints();
    const truckIndex = origin && destination ? 1 : 0;

    const statusLabels = {
      idle: 'Ожидание',
      tracking: 'Обновление',
      pending: 'Ожидает отправки',
      in_transit: 'В пути',
      delivered: 'Доставлен',
      cancelled: 'Отменён',
      error: 'Ошибка',
    };

    return (
      <section className="card cargo-tracker">
        <div className="card__header">
          <h3 className="card__title">Отслеживание груза</h3>
          <button type="button" className="btn btn--outline btn--sm" onClick={this.handleManualRefresh}>
            Обновить
          </button>
        </div>

        <div className="tracker-status">
          <span className={`badge badge--${status === 'tracking' ? 'in_transit' : status}`}>
            {statusLabels[status] || status}
          </span>
          {origin && destination && (
            <span className="tracker-route">
              {origin.label?.replace('Отправление: ', '')} → {destination.label?.replace('Назначение: ', '')}
            </span>
          )}
          {requestProgress > 0 && requestProgress < 100 && (
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${requestProgress}%` }} />
            </div>
          )}
        </div>

        {progress > 0 && (
          <p className="tracker-progress">Пройдено маршрута: {progress}%</p>
        )}

        {error && <p className="form-error">{error}</p>}

        <MapView points={mapPoints} height={260} highlightIndex={truckIndex} />

        {position && (
          <p className="tracker-coords">
            Текущие координаты: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
          </p>
        )}
      </section>
    );
  }
}

export default CargoTracker;
