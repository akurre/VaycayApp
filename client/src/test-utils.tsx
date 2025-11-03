/* eslint-disable react-refresh/only-export-components */
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { theme } from './theme';

// custom render function that includes all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything from testing library
export { screen, waitFor, within, fireEvent } from '@testing-library/react';
export { customRender as render };
