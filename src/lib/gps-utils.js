/**
 * Calcola la distanza tra due coordinate usando la formula di Haversine
 * @param {number} lat1 - Latitudine punto 1
 * @param {number} lon1 - Longitudine punto 1
 * @param {number} lat2 - Latitudine punto 2
 * @param {number} lon2 - Longitudine punto 2
 * @returns {number} Distanza in metri
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Raggio della Terra in metri
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Richiede accesso al GPS del dispositivo
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export const requestGPSLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS non disponibile su questo dispositivo'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        const messages = {
          1: 'Permesso GPS negato. Abilita il GPS nelle impostazioni.',
          2: 'Posizione non disponibile. Assicurati di essere in una zona con segnale.',
          3: 'Timeout della richiesta GPS. Riprova.'
        };
        reject(new Error(messages[error.code] || 'Errore GPS sconosciuto'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Valida se una posizione è dentro il raggio consentito
 * @param {number} userLat - Latitudine utente
 * @param {number} userLon - Longitudine utente
 * @param {number} locLat - Latitudine sede
 * @param {number} locLon - Longitudine sede
 * @param {number} radiusMeters - Raggio consentito in metri
 * @returns {{isValid: boolean, distance: number, message: string}}
 */
export const validateLocation = (userLat, userLon, locLat, locLon, radiusMeters = 100) => {
  const distance = calculateDistance(userLat, userLon, locLat, locLon);
  const isValid = distance <= radiusMeters;

  return {
    isValid,
    distance: Math.round(distance),
    message: isValid 
      ? `✅ Posizione valida (${Math.round(distance)}m dalla sede)`
      : `❌ Troppo lontano dalla sede (${Math.round(distance)}m, consentiti ${radiusMeters}m)`
  };
};