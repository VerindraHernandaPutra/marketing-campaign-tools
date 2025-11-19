import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ReactElement } from 'react';

export const renderWithProviders = (ui: ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};
