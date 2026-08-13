const BY_CITIES = {
  минск: { lat: 53.9045, lng: 27.5615, name: 'Минск' },
  гомель: { lat: 52.4345, lng: 30.9754, name: 'Гомель' },
  бобруйск: { lat: 53.1384, lng: 29.2214, name: 'Бобруйск' },
  могилёв: { lat: 53.8945, lng: 30.3307, name: 'Могилёв' },
  могилев: { lat: 53.8945, lng: 30.3307, name: 'Могилёв' },
  витебск: { lat: 55.1904, lng: 30.2049, name: 'Витебск' },
  гродно: { lat: 53.6693, lng: 23.8131, name: 'Гродно' },
  брест: { lat: 52.0976, lng: 23.7341, name: 'Брест' },
  пинск: { lat: 52.1229, lng: 26.0951, name: 'Пинск' },
  орша: { lat: 54.5153, lng: 30.4244, name: 'Орша' },
  барановичи: { lat: 53.1327, lng: 26.0139, name: 'Барановичи' },
  борисов: { lat: 54.2279, lng: 28.505, name: 'Борисов' },
  солигорск: { lat: 52.7869, lng: 27.5333, name: 'Солигорск' },
  новополоцк: { lat: 55.5318, lng: 28.6455, name: 'Новополоцк' },
  лида: { lat: 53.8833, lng: 25.3, name: 'Лида' },
  мозырь: { lat: 52.0439, lng: 29.2561, name: 'Мозырь' },
  полоцк: { lat: 55.4855, lng: 28.7683, name: 'Полоцк' },
  жлобин: { lat: 52.8917, lng: 30.0375, name: 'Жлобин' },
  речица: { lat: 52.3667, lng: 30.4, name: 'Речица' },
  славгород: { lat: 53.4431, lng: 31.0039, name: 'Славгород' },
  кобрин: { lat: 52.2139, lng: 24.3564, name: 'Кобрин' },
  москва: { lat: 55.7558, lng: 37.6173, name: 'Москва' },
  киев: { lat: 50.4501, lng: 30.5234, name: 'Киев' },
  вильнюс: { lat: 54.6872, lng: 25.2797, name: 'Вильнюс' },
  варшава: { lat: 52.2297, lng: 21.0122, name: 'Варшава' },
};

const CITY_NAME_REGEX = /^[а-яёА-ЯЁa-zA-Z\s\-]{2,50}$/;

export function normalizeCity(name) {
  return name.trim().toLowerCase().replace(/ё/g, 'е');
}

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

export function geocodeCity(cityName) {
  const key = normalizeCity(cityName);
  const found = BY_CITIES[key];
  if (!found) return null;
  return {
    city: found.name,
    lat: found.lat,
    lng: found.lng,
    input: cityName.trim(),
  };
}

export function geocodeCityOrThrow(cityName) {
  const error = validateCityName(cityName);
  if (error) throw new Error(error);

  const result = geocodeCity(cityName);
  if (!result) {
    throw new Error(
      `Город «${cityName.trim()}» не найден. Доступны: ${Object.values(BY_CITIES)
        .map((c) => c.name)
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 12)
        .join(', ')} и другие города Беларуси`
    );
  }
  return result;
}

export function getAvailableCities() {
  const seen = new Set();
  return Object.values(BY_CITIES)
    .filter((c) => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    })
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b, 'ru'));
}

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function routeDistanceKm(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineKm(points[i - 1], points[i]);
  }
  return total;
}

export function optimizeWaypointOrder(origin, destination, waypoints) {
  if (!waypoints.length) {
    return [origin, destination];
  }

  const remaining = [...waypoints];
  const ordered = [origin];
  let current = origin;

  while (remaining.length) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const dist = haversineKm(current, remaining[i]);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    current = remaining.splice(nearestIdx, 1)[0];
    ordered.push(current);
  }

  ordered.push(destination);
  return ordered;
}

export function interpolatePosition(origin, destination, progressPercent) {
  const t = Math.min(100, Math.max(0, progressPercent)) / 100;
  return {
    lat: origin.lat + (destination.lat - origin.lat) * t,
    lng: origin.lng + (destination.lng - origin.lng) * t,
  };
}

export function buildRoute(originCity, destinationCity, waypointCities = []) {
  const origin = geocodeCityOrThrow(originCity);
  const destination = geocodeCityOrThrow(destinationCity);
  const waypoints = waypointCities.map((city) => geocodeCityOrThrow(city));

  const userOrder = [origin, ...waypoints, destination];
  const optimized = optimizeWaypointOrder(origin, destination, waypoints);

  const userDistance = routeDistanceKm(userOrder);
  const optimizedDistance = routeDistanceKm(optimized);
  const savingsPercent =
    userDistance > 0 ? Math.round(((userDistance - optimizedDistance) / userDistance) * 100) : 0;

  const avgSpeedKmh = 55;
  const durationMinutes = Math.round((optimizedDistance / avgSpeedKmh) * 60);

  return {
    origin: origin.city,
    destination: destination.city,
    waypoints: waypoints.map((w) => w.city),
    distanceKm: Math.round(optimizedDistance),
    durationMinutes,
    savingsPercent: Math.max(0, savingsPercent),
    polyline: optimized.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      label: p.city,
    })),
    points: optimized,
  };
}
