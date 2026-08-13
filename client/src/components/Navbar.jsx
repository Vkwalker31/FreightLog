import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🚛</span>
          FreightLog
        </Link>

        <nav className="navbar__nav">
          <NavLink to="/" end className="navbar__link">
            Главная
          </NavLink>
          <NavLink to="/catalog" className="navbar__link">
            Каталог грузов
          </NavLink>
          <NavLink to="/about" className="navbar__link">
            О компании
          </NavLink>
          <NavLink to="/contacts" className="navbar__link">
            Контакты
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className="navbar__link">
              Панель управления
            </NavLink>
          )}
        </nav>

        <div className="navbar__auth">
          {isAuthenticated ? (
            <>
              <span className="navbar__user">{user.name}</span>
              <button type="button" className="btn btn--outline btn--sm" onClick={handleLogout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--outline btn--sm">
                Вход
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
