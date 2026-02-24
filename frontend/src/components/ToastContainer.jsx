import { useToast } from "../context/ToastContext";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => removeToast(toast.id)}>
            <span aria-hidden="true">x</span>
          </button>
        </div>
      ))}
    </div>
  );
}
