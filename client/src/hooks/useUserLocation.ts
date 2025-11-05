import { useState, useCallback } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { GET_NEAREST_CITY } from '@/api/queries';
import { HomeLocation, NearestCityResult, LocationSource } from '@/types/userLocationType';
import { useAppStore } from '@/stores/useAppStore';

interface UseUserLocationReturn {
  requestLocation: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useUserLocation(): UseUserLocationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setHomeLocation = useAppStore((state) => state.setHomeLocation);

  const [getNearestCity] = useLazyQuery<{ nearestCity: NearestCityResult }>(GET_NEAREST_CITY);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      // query nearest city
      const { data, error: queryError } = await getNearestCity({
        variables: {
          lat: latitude,
          long: longitude,
        },
      });

      if (queryError) {
        throw new Error(`failed to find nearest city: ${queryError.message}`);
      }

      if (!data?.nearestCity) {
        throw new Error('no nearby cities found');
      }

      const nearestCity = data.nearestCity;

      // create home location object
      const homeLocation: HomeLocation = {
        cityId: nearestCity.id,
        cityName: nearestCity.name,
        country: nearestCity.country,
        state: nearestCity.state,
        coordinates: {
          lat: nearestCity.lat,
          long: nearestCity.long,
        },
        source: LocationSource.Geolocation,
      };

      setHomeLocation(homeLocation);
      setIsLoading(false);
    } catch (err) {
      const errorMessage =
        err instanceof GeolocationPositionError
          ? getGeolocationErrorMessage(err)
          : err instanceof Error
            ? err.message
            : 'failed to get location';

      setError(errorMessage);
      setIsLoading(false);
    }
  }, [getNearestCity, setHomeLocation]);

  return {
    requestLocation,
    isLoading,
    error,
  };
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'location permission denied';
    case error.POSITION_UNAVAILABLE:
      return 'location information unavailable';
    case error.TIMEOUT:
      return 'location request timed out';
    default:
      return 'failed to get location';
  }
}
