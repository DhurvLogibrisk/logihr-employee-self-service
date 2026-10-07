import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  source: 'capacitor' | 'browser';
  timestamp: number;
}

/**
 * Retrieves the current GPS position using Capacitor Geolocation on mobile devices,
 * with graceful fallback to browser Geolocation API in web browsers.
 *
 * NOTE ON MOCK LOCATION:
 * Standard @capacitor/geolocation does NOT expose Android's native `location.isMock()` flag.
 * All geofence verification and accuracy filtering is authoritatively enforced on the backend server.
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          throw new Error('Location permission denied on device.');
        }
      }

      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy),
        source: 'capacitor',
        timestamp: position.timestamp,
      };
    } catch (err: any) {
      console.warn('Capacitor Geolocation error, falling back to browser API:', err);
    }
  }

  // Browser Web Geolocation fallback
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          source: 'browser',
          timestamp: pos.timestamp,
        });
      },
      (err) => reject(new Error(err.message || 'Failed to obtain GPS position.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  });
}
