import type { MapViewState } from '@deck.gl/core';
import { WebMercatorViewport } from '@deck.gl/core';

interface ProjectCityToScreenArgs {
  lat: number;
  long: number;
  viewState: Pick<MapViewState, 'latitude' | 'longitude' | 'zoom'>;
  width: number;
  height: number;
}

export const projectCityToScreen = ({
  lat,
  long,
  viewState,
  width,
  height,
}: ProjectCityToScreenArgs): { x: number; y: number } | null => {
  if (width <= 0 || height <= 0) return null;

  const viewport = new WebMercatorViewport({
    width,
    height,
    latitude: viewState.latitude,
    longitude: viewState.longitude,
    zoom: viewState.zoom,
  });

  const [x, y] = viewport.project([long, lat]);

  if (x < 0 || x > width || y < 0 || y > height) return null;

  return { x, y };
};
