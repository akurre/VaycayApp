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

// Query to get weather data for a specific city on a specific date
export const GET_WEATHER_BY_CITY_AND_DATE = gql`
  query GetWeatherByCityAndDate($city: String!, $lat: Float, $long: Float, $monthDay: String!) {
    weatherByCityAndDate(city: $city, lat: $lat, long: $long, monthDay: $monthDay) {
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
export const GET_SUNSHINE_BY_CITY = gql`
  query GetSunshineByCity($city: String!, $lat: Float, $long: Float) {
    sunshineByCity(city: $city, lat: $lat, long: $long) {
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

// Query to get sunshine data for all cities in a specific month (for map view)
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


