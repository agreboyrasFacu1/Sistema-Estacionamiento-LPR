import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ParkingProvider } from './contexts/ParkingContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <ParkingProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </ParkingProvider>
    </AuthProvider>
  );
}