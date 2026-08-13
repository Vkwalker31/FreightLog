const CITY_NAME_REGEX = /^[а-яёА-ЯЁa-zA-Z\s\-]{2,50}$/;

export function validateCityName(name) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2 || trimmed.length > 50) {
    return 'Название города: от 2 до 50 символов';
  }
  if (!CITY_NAME_REGEX.test(trimmed)) {
    return 'Город может содержать только буквы, пробелы и дефис';
  }
  return null;
}

export function parseWaypoints(value) {
  return value
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);
}

export function validateRouteForm(origin, destination, waypoints = []) {
  const errors = {};
  const originError = validateCityName(origin);
  const destError = validateCityName(destination);
  if (originError) errors.origin = originError;
  if (destError) errors.destination = destError;

  waypoints.forEach((wp, index) => {
    const wpError = validateCityName(wp);
    if (wpError) errors[`waypoint_${index}`] = `Точка «${wp}»: ${wpError}`;
  });

  if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
    errors.destination = 'Город назначения должен отличаться от города отправления';
  }

  return errors;
}
