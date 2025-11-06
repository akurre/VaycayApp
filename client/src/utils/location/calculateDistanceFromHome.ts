// calculates distance from user's home location to a given city
import { useAppStore } from '@/stores/useAppStore';
import { calculateDistance } from './calculateDistance';

export function calculateDistanceFromHome(lat: number, long: number): number | null {
  const homeLocation = useAppStore.getState().homeLocation;

  if (!homeLocation) {
    return null;
  }

  return calculateDistance(homeLocation.coordinates.lat, homeLocation.coordinates.long, lat, long);
}

export default calculateDistanceFromHome;
