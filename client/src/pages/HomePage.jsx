import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import RouteOptimizer from '../components/RouteOptimizer.jsx';

function HomePage() {
  const [stats, setStats] = useState({ total: 0, inTransit: 0, delivered: 0 });

  useEffect(() => {
    api.getCargo().then((data) => {
      const items = data.items || [];
      setStats({
        total: items.length,
        inTransit: items.filter((c) => c.status === 'in_transit').length,
        delivered: items.filter((c) => c.status === 'delivered').length,
      });
    });
  }, []);

  const onRouteCalculate = (result) => {
    console.log('Маршрут рассчитан:', result);
  };

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">FreightLog — грузоперевозки по Беларуси</h1>
          <p className="hero__subtitle">
            Организуем перевозку любых грузов: от документов до негабарита. Контроль маршрута,
            сроков доставки и состояния груза в режиме реального времени.
          </p>
          <div className="hero__actions">
            <Link to="/catalog" className="btn btn--primary btn--lg">
              Каталог грузов
            </Link>
            <Link to="/dashboard" className="btn btn--outline btn--lg">
              Панель управления
            </Link>
          </div>
        </div>
        <div className="hero__stats">
          <div className="stat-card">
            <span className="stat-card__value">{stats.total}</span>
            <span className="stat-card__label">Всего грузов</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.inTransit}</span>
            <span className="stat-card__label">В пути</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.delivered}</span>
            <span className="stat-card__label">Доставлено</span>
          </div>
        </div>
      </section>

      <section className="container section">
        <RouteOptimizer onRouteCalculate={onRouteCalculate} />
      </section>

      <section className="container section features">
        <h2>Возможности системы</h2>
        <div className="features__grid">
          <article className="feature-card">
            <h3>Оптимизация маршрутов</h3>
            <p>Расчёт кратчайшего пути с учётом промежуточных точек и отображение на карте.</p>
          </article>
          <article className="feature-card">
            <h3>Отслеживание груза</h3>
            <p>Контроль текущего положения транспорта и прогресса доставки по маршруту.</p>
          </article>
          <article className="feature-card">
            <h3>Работа с накладными</h3>
            <p>Проверка и анализ сопроводительных документов перед отправкой.</p>
          </article>
          <article className="feature-card">
            <h3>Управление автопарком</h3>
            <p>Назначение водителей, учёт заправок и плановое техобслуживание.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
