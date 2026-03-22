// src/router/index.tsx

import { createBrowserRouter, Navigate } from "react-router-dom";

import BarberSelectPage from "../pages/BarberSelectPage";
import ClientBookingPage from "../pages/ClientBookingPage";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import StaffLayout from "../staff/layout/StaffLayout";

// Страницы кабинета — добавляем по мере готовности
import BookingsPage from "../staff/pages/BookingsPage";
import SchedulePage  from "../staff/pages/SchedulePage";
import ServicesPage from "../staff/pages/ServicesPage";
import ClientsPage   from "../staff/pages/ClientsPage";
// import AnalyticsPage from "../staff/pages/AnalyticsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <BarberSelectPage />,
  },
  {
    path: "/client",
    element: <ClientBookingPage />,
  },

  {
    path: "/login",
    element: <LoginPage />,
  },


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

      { path: "schedule",  element: <SchedulePage />  },
      { path: "services",  element: <ServicesPage />  },
      { path: "clients",   element: <ClientsPage />   },
      // { path: "analytics", element: <AnalyticsPage /> },
    ],
  },
]);

export default router;
