import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../services/api.js';

const STATUS_LABELS = {
  pending: 'Ожидает',
  in_transit: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const CATEGORY_LABELS = {
  general: 'Общий',
  refrigerated: 'Рефрижератор',
  fragile: 'Хрупкий',
  oversized: 'Негабарит',
  hazardous: 'Опасный',
  documents: 'Документы',
};

const SortableTable = ({
  items = [],
  sortField = 'createdAt',
  sortOrder = 'desc',
  onSort = () => {},
  showActions = false,
  onDelete = () => {},
  timezone,
}) => {
  const [hoveredId, setHoveredId] = useState(null);

  const handleSort = (field) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(field, order);
  };

  const sortIndicator = (field) => {
    if (sortField !== field) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>
              <button type="button" className="sort-btn" onClick={() => handleSort('title')}>
                Груз{sortIndicator('title')}
              </button>
            </th>
            <th>Маршрут</th>
            <th>
              <button type="button" className="sort-btn" onClick={() => handleSort('weightKg')}>
                Вес{sortIndicator('weightKg')}
              </button>
            </th>
            <th>
              <button type="button" className="sort-btn" onClick={() => handleSort('price')}>
                Цена{sortIndicator('price')}
              </button>
            </th>
            <th>Статус</th>
            <th>
              <button type="button" className="sort-btn" onClick={() => handleSort('createdAt')}>
                Добавлено{sortIndicator('createdAt')}
              </button>
            </th>
            {showActions && <th>Действия</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const dates = formatDateTime(item.createdAt, timezone);
            return (
              <tr
                key={item._id}
                className={hoveredId === item._id ? 'data-table__row--hover' : ''}
                onMouseEnter={() => setHoveredId(item._id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <td>
                  <Link to={`/catalog/${item._id}`} className="table-link">
                    {item.title}
                  </Link>
                  <small className="table-meta">{CATEGORY_LABELS[item.category] || item.category}</small>
                </td>
                <td>
                  {item.origin?.city} → {item.destination?.city}
                </td>
                <td>{item.weightKg} кг</td>
                <td>{item.price} BYN</td>
                <td>
                  <span className={`badge badge--${item.status}`}>{STATUS_LABELS[item.status]}</span>
                </td>
                <td className="date-cell">
                  <span title={`UTC: ${dates.utc}`}>{dates.local}</span>
                </td>
                {showActions && (
                  <td>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => onDelete(item._id)}
                    >
                      Удалить
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SortableTable;
