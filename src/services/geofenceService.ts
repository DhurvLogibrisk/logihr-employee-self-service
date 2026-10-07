import { GeofenceSite } from '../types';

export const GEOFENCE_SITES: GeofenceSite[] = [
  {
    id: 'site-surat-hq',
    name: 'LogiBrisk HQ (Surat)',
    address: '401-404 Titanium Square, Ring Road, Surat, Gujarat 395002',
    latitude: 21.170240,
    longitude: 72.831061,
    radiusMeters: 250,
    city: 'Surat',
  },
  {
    id: 'site-ahmedabad-hub',
    name: 'Ahmedabad Tech Hub',
    address: '6th Floor, Pinnacle Business Park, SG Highway, Ahmedabad 380054',
    latitude: 23.022505,
    longitude: 72.571362,
    radiusMeters: 200,
    city: 'Ahmedabad',
  },
  {
    id: 'site-mumbai-client',
    name: 'BKC Client Office (Mumbai)',
    address: 'One BKC, G Block, Bandra Kurla Complex, Mumbai 400051',
    latitude: 19.065714,
    longitude: 72.868725,
    radiusMeters: 150,
    city: 'Mumbai',
  },
];

/**
 * Calculates great-circle distance between two points in meters using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface GeofenceEvaluation {
  nearestSite: GeofenceSite;
  distanceMeters: number;
  isWithinGeofence: boolean;
  accuracy: number;
  mockLocationDetected: boolean;
}

export function evaluateGeofence(
  latitude: number,
  longitude: number,
  accuracy = 12
): GeofenceEvaluation {
  let nearestSite = GEOFENCE_SITES[0];
  let minDistance = calculateHaversineDistance(
    latitude,
    longitude,
    nearestSite.latitude,
    nearestSite.longitude
  );

  for (const site of GEOFENCE_SITES) {
    const dist = calculateHaversineDistance(
      latitude,
      longitude,
      site.latitude,
      site.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestSite = site;
    }
  }

  // Detect simulated coordinates or extreme inaccuracy
  const mockLocationDetected = accuracy > 100 || (latitude === 0 && longitude === 0);

  return {
    nearestSite,
    distanceMeters: minDistance,
    isWithinGeofence: minDistance <= nearestSite.radiusMeters,
    accuracy,
    mockLocationDetected,
  };
}
