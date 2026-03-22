import { createBrowserRouter } from "react-router-dom";
import BarberSelectPage from "../pages/BarberSelectPage";
import ClientBookingPage from "../pages/ClientBookingPage";
import LoginPage from "../pages/LoginPage";

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
]);

export default router;
