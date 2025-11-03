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
