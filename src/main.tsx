// ─────────────────────────────────────────────────────────────
// main.tsx — точка входа, настройка React Query
// ─────────────────────────────────────────────────────────────

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import "./index.css";

// ── Настройка QueryClient ─────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Повторяем запрос только для сетевых ошибок, не для 4xx
      retry: (failureCount, error) => {
        if (error instanceof Error && "status" in error) {
          const status = (error as { status: number }).status;
          // Не ретраим клиентские ошибки (400, 401, 404, 409, 422)
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// ── Рендеринг ─────────────────────────────────────────────────

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
