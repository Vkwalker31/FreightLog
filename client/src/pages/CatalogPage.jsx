import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import SortableTable from '../components/SortableTable.jsx';

function CatalogPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    api
      .getCargo({ search, status, sort: sortField, order: sortOrder })
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [search, status, sortField, sortOrder]);

  const handleSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
  };

  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleStatusChange = (e) => setStatus(e.target.value);

  return (
    <div className="page catalog-page container">
      <header className="page-header">
        <h1>Каталог грузов</h1>
        <p>Просмотр, поиск и сортировка перевозок</p>
      </header>

      <div className="filters-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Поиск по названию, городу, клиенту..."
          value={search}
          onChange={handleSearchChange}
        />
        <select value={status} onChange={handleStatusChange} className="filter-select">
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="in_transit">В пути</option>
          <option value="delivered">Доставлен</option>
          <option value="cancelled">Отменён</option>
        </select>
      </div>

      {loading ? (
        <p className="loading-text">Загрузка...</p>
      ) : (
        <SortableTable
          items={items}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          timezone={user?.timezone}
        />
      )}

      <p className="catalog-count">Найдено записей: {items.length}</p>
    </div>
  );
}

export default CatalogPage;
