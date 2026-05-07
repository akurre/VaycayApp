import { SUNSHINE_THRESHOLDS } from '@/const';

// Maps a sunshine percent (0-100, actual hours / theoretical max for that
// lat+month) to an RGB color via the SUNSHINE_THRESHOLDS gradient. Returns
// gray for null. Caller is expected to have already lat-corrected the input —
// passing raw monthly hours here will misrepresent high-latitude cities.
const getSunshineMarkerColor = (
  sunshinePercent: number | null
): [number, number, number] => {
  if (sunshinePercent === null) {
    return [150, 150, 150];
  }

  if (sunshinePercent < SUNSHINE_THRESHOLDS[0].percent) {
    return [...SUNSHINE_THRESHOLDS[0].color];
  }

  if (
    sunshinePercent >=
    SUNSHINE_THRESHOLDS[SUNSHINE_THRESHOLDS.length - 1].percent
  ) {
    return [...SUNSHINE_THRESHOLDS[SUNSHINE_THRESHOLDS.length - 1].color];
  }

  for (let i = 1; i < SUNSHINE_THRESHOLDS.length; i++) {
    const prevThreshold = SUNSHINE_THRESHOLDS[i - 1];
    const currThreshold = SUNSHINE_THRESHOLDS[i];

    if (
      sunshinePercent >= prevThreshold.percent &&
      sunshinePercent < currThreshold.percent
    ) {
      const range = currThreshold.percent - prevThreshold.percent;
      const factor =
        range > 0 ? (sunshinePercent - prevThreshold.percent) / range : 0;

      return [
        Math.round(
          prevThreshold.color[0] +
            factor * (currThreshold.color[0] - prevThreshold.color[0])
        ),
        Math.round(
          prevThreshold.color[1] +
            factor * (currThreshold.color[1] - prevThreshold.color[1])
        ),
        Math.round(
          prevThreshold.color[2] +
            factor * (currThreshold.color[2] - prevThreshold.color[2])
        ),
      ];
    }
  }

  const middleIndex = Math.floor(SUNSHINE_THRESHOLDS.length / 2);
  return [...SUNSHINE_THRESHOLDS[middleIndex].color];
};

export default getSunshineMarkerColor;
