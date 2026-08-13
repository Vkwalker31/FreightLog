import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (form.name.length < 2) e.name = 'Минимум 2 символа';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Некорректный email';
    if (form.password.length < 6) e.password = 'Минимум 6 символов';
    if (form.password !== form.confirm) e.confirm = 'Пароли не совпадают';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/dashboard');
    } catch {
      /* error in context */
    }
  };

  return (
    <div className="page auth-page container">
      <div className="auth-card card">
        <h1>Регистрация</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-field">
            Имя
            <input name="name" value={form.name} onChange={handleChange} required />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label className="form-field">
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label className="form-field">
            Пароль
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>
          <label className="form-field">
            Подтверждение
            <input type="password" name="confirm" value={form.confirm} onChange={handleChange} required />
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </label>
          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
