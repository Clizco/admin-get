interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl p-6 w-full max-w-lg">
        {title && <h2 className="text-lg font-bold mb-3">{title}</h2>}

        <div className="max-h-[70vh] overflow-y-auto pr-2">{children}</div>

        <button
          className="mt-5 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
