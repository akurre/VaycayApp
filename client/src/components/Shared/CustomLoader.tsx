import { appColors } from '@/theme';
import { Loader, LoaderProps } from '@mantine/core';
import { FC } from 'react';

const CustomLoader: FC<LoaderProps> = () => {
  return <Loader type="dots" color={appColors.tertiary} size={20} />;
};

export default CustomLoader;
