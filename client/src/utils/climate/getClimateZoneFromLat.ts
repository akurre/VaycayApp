import { ClimateZone, type ClimateZoneLabel } from '@/types/cityPopupTypes';

const TROPICAL_BOUND = 23.5;
const SUBTROPICAL_BOUND = 35;
const TEMPERATE_BOUND = 55;
const CONTINENTAL_BOUND = 66.5;

export const getClimateZoneFromLat = (lat: number): ClimateZoneLabel => {
  const rounded = Math.round(Math.abs(lat));
  const latLabel =
    rounded === 0 ? '0°' : `${rounded}°${lat >= 0 ? 'N' : 'S'}`;

  const abs = Math.abs(lat);
  let zone: ClimateZone;
  if (abs === 0) zone = ClimateZone.Equatorial;
  else if (abs < TROPICAL_BOUND) zone = ClimateZone.Tropical;
  else if (abs < SUBTROPICAL_BOUND) zone = ClimateZone.Subtropical;
  else if (abs < TEMPERATE_BOUND) zone = ClimateZone.Temperate;
  else if (abs < CONTINENTAL_BOUND) zone = ClimateZone.Continental;
  else zone = ClimateZone.Polar;

  return { zone, latLabel };
};
