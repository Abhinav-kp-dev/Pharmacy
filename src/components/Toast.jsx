import { createContext, useContext, useState, useCallback } from "react";

const ToastCtx = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const add = useCallback((msg, type = "success", duration = 3500) => {
        const id = ++toastId;
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
    }, []);

    const colors = {
        success: { bg: "#0D9488", icon: "" },
        error: { bg: "#EF4444", icon: "" },
        warning: { bg: "#F59E0B", icon: "" },
        info: { bg: "#3B82F6", icon: "ℹ️" },
    };

    return (
        <ToastCtx.Provider value={add}>
            {children}
            <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </ToastCtx.Provider>
    );
}

export function useToast() { return useContext(ToastCtx); }
