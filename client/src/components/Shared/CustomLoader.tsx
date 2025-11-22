import { appColors } from '@/theme';
import type { LoaderProps } from '@mantine/core';
import { Loader } from '@mantine/core';
import type { FC } from 'react';

const CustomLoader: FC<LoaderProps> = () => {
  return <Loader type="dots" color={appColors.tertiary} size={20} />;
};

export default CustomLoader;
