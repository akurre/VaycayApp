/**
 * returns the appropriate icon size based on the mantine control size
 */
function getIconSizeFromControlSize(size?: string): number {
  switch (size) {
    case 'xs':
      return 12;
    case 'sm':
      return 14;
    case 'md':
      return 16;
    case 'lg':
      return 20;
    case 'xl':
      return 24;
    default:
      return 16;
  }
}

export default getIconSizeFromControlSize;
