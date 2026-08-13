import { useEffect, useState } from 'react';

const Footer = () => {
  const [now, setNow] = useState(new Date());
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const localTime = now.toLocaleString('ru-RU', { timeZone: timezone });
  const utcTime = now.toLocaleString('ru-RU', { timeZone: 'UTC' });

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__section">
          <strong>FreightLog</strong>
          <p>Надёжные грузоперевозки по Беларуси и СНГ</p>
          <p className="footer__muted">г. Минск, ул. Логистическая, 15</p>
        </div>
        <div className="footer__section footer__time">
          <p>
            <span className="footer__label">Ваш часовой пояс ({timezone}):</span>
            <strong>{localTime}</strong>
          </p>
          <p>
            <span className="footer__label">UTC:</span>
            <strong>{utcTime}</strong>
          </p>
        </div>
        <div className="footer__section">
          <p>📞 +375 (17) 200-00-00</p>
          <p className="footer__muted">info@freightlog.by · Пн–Пт 8:00–20:00</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
