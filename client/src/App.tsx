import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { theme } from './theme';
import MapPage from './pages/map';

function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" zIndex={1000} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MapPage />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
