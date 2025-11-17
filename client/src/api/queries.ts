import { gql } from '@apollo/client';

export const GET_WEATHER_BY_DATE = gql`
  query GetWeatherByDate($monthDay: String!) {
    weatherByDate(monthDay: $monthDay) {
      city
      country
      state
      suburb
      date
      lat
      long
      population
      precipitation
      snowDepth
      avgTemperature
      maxTemperature
      minTemperature
      stationName
    }
  }
`;

export const GET_WEATHER_BY_DATE_AND_BOUNDS = gql`
  query GetWeatherByDateAndBounds(
    $monthDay: String!
    $minLat: Int!
    $maxLat: Int!
    $minLong: Int!
    $maxLong: Int!
  ) {
    weatherByDateAndBounds(
      monthDay: $monthDay
      minLat: $minLat
      maxLat: $maxLat
      minLong: $minLong
      maxLong: $maxLong
    ) {
      city
      country
      state
      suburb
      date
      lat
      long
      population
      precipitation
      snowDepth
      avgTemperature
      maxTemperature
      minTemperature
      stationName
    }
  }
`;

export const GET_SUNSHINE_BY_MONTH_AND_BOUNDS = gql`
  query GetSunshineByMonthAndBounds(
    $month: Int!
    $minLat: Int!
    $maxLat: Int!
    $minLong: Int!
    $maxLong: Int!
  ) {
    sunshineByMonthAndBounds(
      month: $month
      minLat: $minLat
      maxLat: $maxLat
      minLong: $minLong
      maxLong: $maxLong
    ) {
      city
      country
      state
      suburb
      lat
      long
      population
      jan
      feb
      mar
      apr
      may
      jun
      jul
      aug
      sep
      oct
      nov
      dec
      stationName
    }
  }
`;

export const GET_NEAREST_CITY = gql`
  query GetNearestCity($lat: Float!, $long: Float!) {
    nearestCity(lat: $lat, long: $long) {
      id
      name
      country
      state
      lat
      long
      population
      distance
    }
  }
`;

export const SEARCH_CITIES = gql`
  query SearchCities($searchTerm: String!, $limit: Int) {
    searchCities(searchTerm: $searchTerm, limit: $limit) {
      id
      name
      country
      state
      lat
      long
      population
    }
  }
`;

// Query to get weather data for a specific city
export const GET_WEATHER_BY_CITY_NAME = gql`
  query GetWeatherByCity($city: String!) {
    weatherByCity(city: $city) {
      city
      country
      state
      suburb
      date
      lat
      long
      population
      precipitation
      snowDepth
      avgTemperature
      maxTemperature
      minTemperature
      stationName
    }
  }
`;

// Optimized query for CityPopup weather data
export const GET_WEATHER_FOR_POPUP = gql`
  query GetWeatherForPopup($city: String!) {
    weatherByCity(city: $city) {
      city
      country
      state
      suburb
      date
      lat
      long
      population
      precipitation
      snowDepth
      avgTemperature
      maxTemperature
      minTemperature
      stationName
    }
  }
`;

// Query to get sunshine data for a specific city
// We'll use the sunshineByMonth query and filter by city name on the client side
export const GET_SUNSHINE_BY_MONTH = gql`
  query GetSunshineByMonth($month: Int!) {
    sunshineByMonth(month: $month) {
      city
      country
      state
      suburb
      lat
      long
      population
      jan
      feb
      mar
      apr
      may
      jun
      jul
      aug
      sep
      oct
      nov
      dec
      stationName
    }
  }
`;

// Optimized query for CityPopup sunshine data
export const GET_SUNSHINE_FOR_POPUP = gql`
  query GetSunshineForPopup($month: Int!) {
    sunshineByMonth(month: $month) {
      city
      country
      state
      suburb
      lat
      long
      population
      jan
      feb
      mar
      apr
      may
      jun
      jul
      aug
      sep
      oct
      nov
      dec
      stationName
    }
  }
`;
