export enum ErrorCategory {
  Network = 'network',
  GraphQL = 'graphql',
  Validation = 'validation',
  Geolocation = 'geolocation',
  Unknown = 'unknown',
}

export enum ErrorSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export interface ParsedError {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  originalError?: unknown;
}

// type interface for apollo errors
export interface ApolloErrorLike {
  networkError?: unknown;
  graphQLErrors?: Array<{ message?: string }>;
  message: string;
}

// type interface for geolocation errors
export interface GeolocationErrorLike {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}
