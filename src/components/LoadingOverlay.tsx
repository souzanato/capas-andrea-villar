"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface LoadingContextType {
  showLoading: () => void;
  hideLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = useCallback(() => setIsLoading(true), []);
  const hideLoading = useCallback(() => setIsLoading(false), []);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      try {
        return await fn();
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, withLoading, isLoading }}>
      <div className="relative">
        {children}
        {isLoading && (
          <div
            className="fixed inset-0 z-[9999]"
            style={{
              backgroundColor: "rgba(250, 245, 242, 0.5)",
              pointerEvents: "all",
            }}
          />
        )}
      </div>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading deve ser usado dentro de LoadingProvider");
  return ctx;
}
