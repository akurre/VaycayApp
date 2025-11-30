import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { theme } from './theme';
import MapPage from './pages/map';
import { PerformanceDashboard } from './components/PerformanceDashboard/PerformanceDashboard';
import { WelcomeModal } from './components/Shared/WelcomeModal';

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" zIndex={1000} />
      <WelcomeModal />
      <PerformanceDashboard />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<MapPage />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
