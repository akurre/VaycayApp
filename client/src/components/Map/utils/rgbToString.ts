const rgbToString = (
  rgb: readonly [number, number, number] | [number, number, number]
) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

export default rgbToString;
