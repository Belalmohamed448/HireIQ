"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
    id: number;
    message: string;
    type: ToastType;
};

type ToastContextValue = {
    showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = nextId++;
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    function dismiss(id: number) {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }

    function typeStyles(type: ToastType) {
        if (type === "success") return "bg-green-600";
        if (type === "error") return "bg-red-600";
        return "bg-gray-900";
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        onClick={() => dismiss(t.id)}
                        className={`${typeStyles(
                            t.type
                        )} text-white text-sm px-4 py-3 rounded-lg shadow-lg max-w-sm cursor-pointer animate-[fadeIn_0.2s_ease-out]`}
                    >
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return ctx;
}