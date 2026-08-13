import { useState } from 'react';

function ContactsPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Укажите имя';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Некорректный email';
    if (form.message.length < 10) e.message = 'Минимум 10 символов';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSent(true);
    setTimeout(() => setSent(false), 5000);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="page contacts-page container">
      <header className="page-header">
        <h1>Контакты</h1>
      </header>

      <div className="contacts-grid">
        <section className="card">
          <h2>Связаться с нами</h2>
          <address className="contacts-info">
            <p>📍 г. Минск, ул. Логистическая, 15</p>
            <p>📞 +375 (17) 200-00-00</p>
            <p>✉️ info@freightlog.by</p>
            <p>🕐 Пн–Пт: 8:00–20:00</p>
          </address>
        </section>

        <section className="card">
          <h2>Форма обратной связи</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="form-field">
              Имя
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </label>
            <label className="form-field">
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>
            <label className="form-field">
              Сообщение
              <textarea
                name="message"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={4}
              />
              {errors.message && <span className="field-error">{errors.message}</span>}
            </label>
            <button type="submit" className="btn btn--primary">Отправить</button>
            {sent && <p className="form-success">Сообщение отправлено!</p>}
          </form>
        </section>
      </div>
    </div>
  );
}

export default ContactsPage;
