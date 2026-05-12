import React from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          La página que busca no existe o ha sido movida.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
        >
          <Home className="w-5 h-5" />
          Ir al Panel de Control
        </button>
      </div>
    </div>
  );
};