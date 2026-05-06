import { describe, it, expect } from 'vitest';
import { getClimateZoneFromLat } from '@/utils/climate/getClimateZoneFromLat';
import { ClimateZone } from '@/types/cityPopupTypes';

describe('getClimateZoneFromLat', () => {
  describe('latLabel formatting', () => {
    it('returns 0° on the equator with no hemisphere suffix', () => {
      expect(getClimateZoneFromLat(0).latLabel).toBe('0°');
    });

    it('appends N for positive (northern) latitudes', () => {
      expect(getClimateZoneFromLat(52).latLabel).toBe('52°N');
      expect(getClimateZoneFromLat(40.7).latLabel).toBe('41°N');
    });

    it('appends S for negative (southern) latitudes', () => {
      expect(getClimateZoneFromLat(-33).latLabel).toBe('33°S');
      expect(getClimateZoneFromLat(-12.4).latLabel).toBe('12°S');
    });

    it('rounds the magnitude to the nearest integer', () => {
      expect(getClimateZoneFromLat(52.49).latLabel).toBe('52°N');
      expect(getClimateZoneFromLat(52.5).latLabel).toBe('53°N');
      expect(getClimateZoneFromLat(-23.5).latLabel).toBe('24°S');
    });

    it('handles the poles', () => {
      expect(getClimateZoneFromLat(90).latLabel).toBe('90°N');
      expect(getClimateZoneFromLat(-90).latLabel).toBe('90°S');
    });
  });

  describe('zone classification', () => {
    it('classifies the equator as Equatorial', () => {
      expect(getClimateZoneFromLat(0).zone).toBe(ClimateZone.Equatorial);
    });

    it('classifies tropics (within ±23.5°) as Tropical', () => {
      expect(getClimateZoneFromLat(15).zone).toBe(ClimateZone.Tropical);
      expect(getClimateZoneFromLat(-20).zone).toBe(ClimateZone.Tropical);
    });

    it('classifies subtropics (~23.5°–35°) as Subtropical', () => {
      expect(getClimateZoneFromLat(30).zone).toBe(ClimateZone.Subtropical);
      expect(getClimateZoneFromLat(-30).zone).toBe(ClimateZone.Subtropical);
    });

    it('classifies temperate band (~35°–55°) as Temperate', () => {
      expect(getClimateZoneFromLat(45).zone).toBe(ClimateZone.Temperate);
      expect(getClimateZoneFromLat(-50).zone).toBe(ClimateZone.Temperate);
    });

    it('classifies continental band (~55°–66°) as Continental', () => {
      expect(getClimateZoneFromLat(60).zone).toBe(ClimateZone.Continental);
      expect(getClimateZoneFromLat(-60).zone).toBe(ClimateZone.Continental);
    });

    it('classifies polar (>66°) as Polar', () => {
      expect(getClimateZoneFromLat(75).zone).toBe(ClimateZone.Polar);
      expect(getClimateZoneFromLat(-80).zone).toBe(ClimateZone.Polar);
    });
  });
});
