import { useEffect, useState } from 'react';

const STORAGE_KEY = 'freight_notifications';

function loadNotifications() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveNotifications(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function NotificationBar() {
  const [notifications, setNotifications] = useState(loadNotifications);

  useEffect(() => {
    const handler = () => setNotifications(loadNotifications());
    window.addEventListener('freight-notification', handler);
    return () => window.removeEventListener('freight-notification', handler);
  }, []);

  useEffect(() => {
    const timers = notifications.map((n) => {
      if (n.expiresAt <= Date.now()) return null;
      return setTimeout(() => {
        setNotifications((prev) => {
          const next = prev.filter((item) => item.id !== n.id);
          saveNotifications(next);
          return next;
        });
      }, n.expiresAt - Date.now());
    });
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [notifications]);

  const dismiss = (id) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveNotifications(next);
      return next;
    });
  };

  if (!notifications.length) return null;

  return (
    <div className="notification-bar">
      {notifications.map((n) => (
        <div key={n.id} className={`notification notification--${n.type}`}>
          <span>{n.message}</span>
          <button type="button" className="notification__close" onClick={() => dismiss(n.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function addNotification(message, type = 'info', durationMs = 5000) {
  const items = loadNotifications();
  const item = { id: Date.now(), message, type, expiresAt: Date.now() + durationMs };
  items.push(item);
  saveNotifications(items);
  window.dispatchEvent(new CustomEvent('freight-notification'));
  return item;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState(loadNotifications);

  useEffect(() => {
    const handler = () => setNotifications(loadNotifications());
    window.addEventListener('freight-notification', handler);
    return () => window.removeEventListener('freight-notification', handler);
  }, []);

  return notifications;
}

export default NotificationBar;
