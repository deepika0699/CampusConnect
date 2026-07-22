/**
 * CampusConnect Helper Utilities
 */

/**
 * Extracts latitude and longitude from a Google Maps URL.
 * Supports standard formats:
 * - https://maps.google.com/?q=17.822145,83.342812
 * - https://www.google.com/maps?q=17.822145,83.342812
 * - https://www.google.com/maps/place/.../@17.822145,83.342812,17z
 * - https://maps.google.com/?q=lat,lng
 */
export function extractCoordinates(url: string): { lat: number; lng: number } | null {
  try {
    if (!url) return null;
    
    // Format: @lat,lng
    const atRegex = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;
    const atMatch = url.match(atRegex);
    if (atMatch && atMatch[1] && atMatch[2]) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }

    // Format: ?q=lat,lng or &q=lat,lng
    const qRegex = /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;
    const qMatch = url.match(qRegex);
    if (qMatch && qMatch[1] && qMatch[2]) {
      const lat = parseFloat(qMatch[1]);
      const lng = parseFloat(qMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }

    // Format: /place/foo/lat,lng
    const pathRegex = /\/place\/[^/]+\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;
    const pathMatch = url.match(pathRegex);
    if (pathMatch && pathMatch[1] && pathMatch[2]) {
      const lat = parseFloat(pathMatch[1]);
      const lng = parseFloat(pathMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  } catch (error) {
    console.error("Error parsing Google Maps URL:", error);
  }
  return null;
}
