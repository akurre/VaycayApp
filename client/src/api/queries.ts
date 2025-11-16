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

// // These are unused as of now
// export const GET_WEATHER_BY_CITY = gql`
//   query GetWeatherByCity($city: String!) {
//     weatherByCity(city: $city) {
//       city
//       country
//       state
//       suburb
//       date
//       lat
//       long
//       population
//       precipitation
//       snowDepth
//       avgTemperature
//       maxTemperature
//       minTemperature
//       stationName
//       submitterId
//     }
//   }
// `;

// export const GET_ALL_CITIES = gql`
//   query GetAllCities {
//     cities
//   }
// `;

// export const GET_ALL_COUNTRIES = gql`
//   query GetAllCountries {
//     countries
//   }
// `;
