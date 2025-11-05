import { appColors } from '@/theme';
import { Loader, LoaderProps } from '@mantine/core';
import { FC } from 'react';

interface CustomLoaderProps extends LoaderProps {}

const CustomLoader: FC<CustomLoaderProps> = () => {
  return <Loader type="dots" color={appColors.tertiary} size={20} />;
};

export default CustomLoader;
