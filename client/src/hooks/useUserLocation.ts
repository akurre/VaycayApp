import { useState, useCallback } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { GET_NEAREST_CITY } from '@/api/queries';
import { LocationSource } from '@/types/userLocationType';
import type { HomeLocation, NearestCityResult } from '@/types/userLocationType';
import { useAppStore } from '@/stores/useAppStore';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';

interface UseUserLocationReturn {
  requestLocation: () => Promise<void>;
  isLoading: boolean;
}

export function useUserLocation(): UseUserLocationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const setHomeLocation = useAppStore((state) => state.setHomeLocation);

  const [getNearestCity] = useLazyQuery<{ nearestCity: NearestCityResult }>(GET_NEAREST_CITY);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);

    if (!navigator.geolocation) {
      parseErrorAndNotify(
        new Error('geolocation is not supported by your browser'),
        'geolocation unavailable'
      );
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
        throw queryError;
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
      parseErrorAndNotify(err);
      setIsLoading(false);
    }
  }, [getNearestCity, setHomeLocation]);

  return {
    requestLocation,
    isLoading,
  };
}
