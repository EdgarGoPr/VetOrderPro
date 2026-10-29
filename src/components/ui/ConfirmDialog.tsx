import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmLabel?: string;
  isTwoStep?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Eliminar',
  isTwoStep = true,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState<boolean>(false);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleConfirm = async () => {
    if (isTwoStep && step === 1) {
      setStep(2);
      return;
    }

    try {
      setLoading(true);
      await onConfirm();
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            step === 1 ? 'bg-rose-50 text-rose-600' : 'bg-red-100 text-red-700 animate-pulse'
          }`}
        >
          {step === 1 ? (
            <AlertTriangle className="w-6 h-6" />
          ) : (
            <Trash2 className="w-6 h-6" />
          )}
        </div>

        <p className="text-sm text-stone-600 mb-2">{message}</p>

        {isTwoStep && (
          <div className="w-full bg-stone-50 rounded-lg p-2.5 my-3 border border-stone-200 text-xs text-stone-600">
            {step === 1 ? (
              <span>
                Paso 1 de 2: Para continuar, presione <strong>"{confirmLabel}"</strong> y confirme en el siguiente paso.
              </span>
            ) : (
              <span className="text-red-700 font-semibold">
                Paso 2 de 2: Esta acción es irreversible y eliminará el registro permanentemente.
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 w-full mt-3">
          <Button variant="outline" onClick={handleClose} disabled={loading} className="w-1/2">
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            loading={loading}
            className="w-1/2"
          >
            {step === 1 ? confirmLabel : 'Sí, confirmar eliminación'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
