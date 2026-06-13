'use client';

import { useToastStore, Toast } from '../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
  };

  const bgStyles = {
    success: 'bg-white dark:bg-zinc-900 border-l-4 border-emerald-500 shadow-md',
    error: 'bg-white dark:bg-zinc-900 border-l-4 border-rose-500 shadow-md',
    info: 'bg-white dark:bg-zinc-900 border-l-4 border-blue-500 shadow-md',
    warning: 'bg-white dark:bg-zinc-900 border-l-4 border-amber-500 shadow-md'
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-r-lg border border-zinc-100 dark:border-zinc-800 transition-all transform duration-350 ${bgStyles[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {toast.message}
      </div>
      <button
        onClick={onClose}
        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
