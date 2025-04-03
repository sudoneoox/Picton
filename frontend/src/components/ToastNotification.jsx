import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";

// NOTE: popup notifcation system that shows up after submitting forms
// similiar to shadcn's website

const ToastContext = React.createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success", header = "") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, header }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => {
      const newToasts = prev.filter((toast) => toast.id !== id);
      return newToasts;
    });
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              // notif types
              className={`toast-container__notification ${
                {
                  success: "toast-container__notification--success",
                  warning: "toast-container__notification--warning",
                  info: "toast-container__notification--info",
                  error: "toast-container__notification--error",
                }[toast.type] || "toast-container__notification--default"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle className="toast-container__icon" />
              ) : (
                <XCircle className="toast-container__icon" />
              )}
              {/* OPTIONAL HEADER */}
              <div className="toast-container__content">
                {toast.header && (
                  <h4
                    className={`toast-container__header toast-container__header--${toast.type}`}
                  >
                    {toast.header}
                  </h4>
                )}
                <pre className="toast-container__text">
                  {toast.message === "string"
                    ? toast.message
                    : JSON.stringify(toast.message, null, 2)}
                </pre>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="toast-container__close"
                type="button"
              >
                <X className="toast-container__close-icon" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return { showToast: context.addToast };
};
