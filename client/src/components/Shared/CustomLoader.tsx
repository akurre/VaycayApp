import { appColors } from "@/theme";
import { Loader, LoaderProps } from "@mantine/core";
import { FC } from "react";

interface CustomLoaderProps extends LoaderProps {
}

const CustomLoader: FC<CustomLoaderProps> = () => {
  return (
    <Loader type="dots" color={appColors.secondary} size={20} />
  )
}

export default CustomLoader;