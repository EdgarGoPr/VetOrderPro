import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center mx-auto mb-4 border border-stone-200">
        <FileQuestion className="w-8 h-8" />
      </div>
      <div className="inline-block px-2.5 py-0.5 bg-stone-200/80 rounded font-mono text-xs text-stone-700 mb-2">
        Error 404
      </div>
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Página no encontrada</h1>
      <p className="text-xs text-stone-500 max-w-sm mb-6">
        La ruta a la que intenta acceder no existe o fue movida.
      </p>
      <Button onClick={() => navigate('/')} icon={<ArrowLeft className="w-4 h-4" />}>
        Volver a Órdenes de Compra
      </Button>
    </div>
  );
};
