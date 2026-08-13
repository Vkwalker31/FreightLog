import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function LoginPage() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!form.email || !form.password) {
      setLocalError('Заполните все поля');
      return;
    }
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="page auth-page container">
      <div className="auth-card card">
        <h1>Вход</h1>
        <p className="auth-hint">Демо: admin@freight.by / admin123</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-field">
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>
          <label className="form-field">
            Пароль
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </label>
          {(localError || error) && <p className="form-error">{localError || error}</p>}
          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="auth-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
