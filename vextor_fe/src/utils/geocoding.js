// In-memory cache for reverse-geocoded addresses to avoid duplicate requests
const addressCache = new Map();

/**
 * Checks whether a string represents a coordinate pair "lat, lng"
 * @param {string} str
 * @returns {boolean}
 */
export const isCoordinateString = (str) => {
  if (!str || typeof str !== 'string') return false;
  const parts = str.split(',');
  if (parts.length !== 2) return false;
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  return !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

/**
 * Asynchronously resolves a location string (coordinate or text) into a friendly address name
 * @param {string} locationStr
 * @returns {Promise<string>}
 */
export const reverseGeocodeAddress = async (locationStr) => {
  if (!locationStr || typeof locationStr !== 'string') return locationStr || '';

  const cleanStr = locationStr.trim();
  if (!isCoordinateString(cleanStr)) {
    return cleanStr;
  }

  if (addressCache.has(cleanStr)) {
    return addressCache.get(cleanStr);
  }

  const [latStr, lngStr] = cleanStr.split(',');
  const lat = parseFloat(latStr.trim());
  const lng = parseFloat(lngStr.trim());

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`,
      {
        headers: {
          'User-Agent': 'VextorFleetApp/1.0 (contact: info@vextor.com)',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        addressCache.set(cleanStr, data.display_name);
        return data.display_name;
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding error for:', cleanStr, err);
  }

  // Fall back to cleanStr if request fails
  return cleanStr;
};

/**
 * Resolves multiple coordinate/location strings in batch and returns a map of { [coordStr]: resolvedAddress }
 * @param {string[]} locationStrings
 * @returns {Promise<Record<string, string>>}
 */
export const batchReverseGeocode = async (locationStrings) => {
  const uniqueCoords = [...new Set((locationStrings || []).filter(s => isCoordinateString(s)))];
  const resultMap = {};

  await Promise.all(
    uniqueCoords.map(async (coordStr) => {
      const resolved = await reverseGeocodeAddress(coordStr);
      resultMap[coordStr] = resolved;
    })
  );

  return resultMap;
};
