import { describe, it, expect } from 'vitest';
import { projectCityToScreen } from '@/utils/map/projectCityToScreen';

const WIDTH = 800;
const HEIGHT = 600;

describe('projectCityToScreen', () => {
  it('projects the center of the view to the center of the container', () => {
    const result = projectCityToScreen({
      lat: 40,
      long: -100,
      viewState: { latitude: 40, longitude: -100, zoom: 3 },
      width: WIDTH,
      height: HEIGHT,
    });

    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(WIDTH / 2, 0);
    expect(result!.y).toBeCloseTo(HEIGHT / 2, 0);
  });

  it('moves the projected x to the right when the view pans west of the city', () => {
    const centered = projectCityToScreen({
      lat: 40,
      long: -100,
      viewState: { latitude: 40, longitude: -100, zoom: 3 },
      width: WIDTH,
      height: HEIGHT,
    })!;

    const pannedWest = projectCityToScreen({
      lat: 40,
      long: -100,
      viewState: { latitude: 40, longitude: -110, zoom: 3 },
      width: WIDTH,
      height: HEIGHT,
    })!;

    expect(pannedWest.x).toBeGreaterThan(centered.x);
  });

  it('returns null when the city is panned off the right edge of the container', () => {
    const result = projectCityToScreen({
      lat: 40,
      long: 100,
      viewState: { latitude: 40, longitude: -100, zoom: 5 },
      width: WIDTH,
      height: HEIGHT,
    });

    expect(result).toBeNull();
  });

  it('returns null when the city is panned off the top of the container', () => {
    const result = projectCityToScreen({
      lat: 80,
      long: -100,
      viewState: { latitude: 0, longitude: -100, zoom: 5 },
      width: WIDTH,
      height: HEIGHT,
    });

    expect(result).toBeNull();
  });
});
