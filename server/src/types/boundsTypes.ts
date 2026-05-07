// Geographic bounding box used by bounds-aware GraphQL queries and the
// quantization helper. Lives here (not in a utils file) so all consumers —
// resolvers, query builders, and the cache-key quantizer — share one shape.
export interface Bounds {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
}
