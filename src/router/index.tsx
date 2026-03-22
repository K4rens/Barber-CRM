// src/router/index.tsx

import { createBrowserRouter, Navigate } from "react-router-dom";

import BarberSelectPage from "../pages/BarberSelectPage";
import ClientBookingPage from "../pages/ClientBookingPage";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import StaffLayout from "../staff/layout/StaffLayout";

// Страницы кабинета — добавляем по мере готовности
import BookingsPage from "../staff/pages/BookingsPage";
// import SchedulePage  from "../staff/pages/SchedulePage";
// import ServicesPage  from "../staff/pages/ServicesPage";
// import ClientsPage   from "../staff/pages/ClientsPage";
// import AnalyticsPage from "../staff/pages/AnalyticsPage";

const router = createBrowserRouter([
  // ── Клиентская часть (публичная) ──────────────────────────
  {
    path: "/",
    element: <BarberSelectPage />,
  },
  {
    path: "/client",
    element: <ClientBookingPage />,
  },

  // ── Авторизация ───────────────────────────────────────────
  {
    path: "/login",
    element: <LoginPage />,
  },

  // ── Кабинет барбера (защищённый) ─────────────────────────
  {
    path: "/staff",
    element: (
      <ProtectedRoute>
        <StaffLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/staff/bookings" replace />,
      },
      {
        path: "bookings",
        element: <BookingsPage />,
      },
      // Раскомментируем по мере переноса:
      // { path: "schedule",  element: <SchedulePage />  },
      // { path: "services",  element: <ServicesPage />  },
      // { path: "clients",   element: <ClientsPage />   },
      // { path: "analytics", element: <AnalyticsPage /> },
    ],
  },
]);

export default router;
