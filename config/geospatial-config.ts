export interface GeospatialConfig {
  distance: number;
  index: string;
  hashPrecision: number;
  fetchLimitMultiplier: number;
}

export const GEOSPATIAL_QUERIES: GeospatialConfig[] = [
  { distance: 2000000, index: 'primary', hashPrecision: 1, fetchLimitMultiplier: 0.5 },
  { distance: 500000, index: 'primary', hashPrecision: 2, fetchLimitMultiplier: 0.4 },
  { distance: 100000, index: 'primary', hashPrecision: 3, fetchLimitMultiplier: 0.3 },
  { distance: 10000, index: 'GSI1', hashPrecision: 4, fetchLimitMultiplier: 0.2 },
  { distance: 0, index: 'GSI1', hashPrecision: 5, fetchLimitMultiplier: 0.1 },
];
