import { useState } from 'react';
import { api } from '../services/api.js';

function CargoForm({ initial = {}, onSubmit, onCancel, submitLabel = 'Сохранить' }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    weightKg: '',
    volumeM3: '',
    price: '',
    clientName: '',
    clientPhone: '',
    documentText: '',
    status: 'pending',
    origin: { city: '', address: '', ...initial.origin },
    destination: { city: '', address: '', ...initial.destination },
    ...initial,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.title || form.title.length < 3) e.title = 'Минимум 3 символа';
    if (!form.weightKg || form.weightKg < 1) e.weightKg = 'Укажите вес';
    if (!form.price || form.price < 0) e.price = 'Укажите цену';
    if (!form.origin.city) e.originCity = 'Город отправления обязателен';
    if (!form.destination.city) e.destinationCity = 'Город назначения обязателен';
    if (form.clientPhone && !/^\+?[0-9\s()-]{7,20}$/.test(form.clientPhone)) {
      e.clientPhone = 'Некорректный телефон';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('origin.')) {
      setForm((f) => ({ ...f, origin: { ...f.origin, [name.split('.')[1]]: value } }));
    } else if (name.startsWith('destination.')) {
      setForm((f) => ({ ...f, destination: { ...f.destination, [name.split('.')[1]]: value } }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError('');
    try {
      const payload = {
        ...form,
        weightKg: Number(form.weightKg),
        volumeM3: form.volumeM3 ? Number(form.volumeM3) : undefined,
        price: Number(form.price),
      };
      await onSubmit(payload);
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <form className="cargo-form form-grid" onSubmit={handleSubmit}>
      <label className="form-field">
        Название груза *
        <input name="title" value={form.title} onChange={handleChange} />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </label>

      <label className="form-field">
        Категория
        <select name="category" value={form.category} onChange={handleChange}>
          <option value="general">Общий</option>
          <option value="refrigerated">Рефрижератор</option>
          <option value="fragile">Хрупкий</option>
          <option value="oversized">Негабарит</option>
          <option value="hazardous">Опасный</option>
          <option value="documents">Документы</option>
        </select>
      </label>

      <label className="form-field">
        Вес (кг) *
        <input name="weightKg" type="number" value={form.weightKg} onChange={handleChange} min="1" />
        {errors.weightKg && <span className="field-error">{errors.weightKg}</span>}
      </label>

      <label className="form-field">
        Объём (м³)
        <input name="volumeM3" type="number" value={form.volumeM3} onChange={handleChange} step="0.1" />
      </label>

      <label className="form-field">
        Цена (BYN) *
        <input name="price" type="number" value={form.price} onChange={handleChange} min="0" />
        {errors.price && <span className="field-error">{errors.price}</span>}
      </label>

      <label className="form-field">
        Статус
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="pending">Ожидает</option>
          <option value="in_transit">В пути</option>
          <option value="delivered">Доставлен</option>
          <option value="cancelled">Отменён</option>
        </select>
      </label>

      <label className="form-field">
        Город отправления *
        <input name="origin.city" value={form.origin.city} onChange={handleChange} />
        {errors.originCity && <span className="field-error">{errors.originCity}</span>}
      </label>

      <label className="form-field">
        Город назначения *
        <input name="destination.city" value={form.destination.city} onChange={handleChange} />
        {errors.destinationCity && <span className="field-error">{errors.destinationCity}</span>}
      </label>

      <label className="form-field">
        Клиент
        <input name="clientName" value={form.clientName} onChange={handleChange} />
      </label>

      <label className="form-field">
        Телефон клиента
        <input name="clientPhone" value={form.clientPhone} onChange={handleChange} />
        {errors.clientPhone && <span className="field-error">{errors.clientPhone}</span>}
      </label>

      <label className="form-field form-field--full">
        Текст накладной
        <textarea name="documentText" value={form.documentText} onChange={handleChange} rows={3} />
      </label>

      {serverError && <p className="form-error form-field--full">{serverError}</p>}

      <div className="form-actions form-field--full">
        <button type="submit" className="btn btn--primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--outline" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

export default CargoForm;
