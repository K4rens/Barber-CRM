import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute.tsx";

const router = createBrowserRouter([
  {

    path: "/",
    element: <App />,
  },
  {

    path: "/login",
    element: <LoginPage />,
  },

]);

export default router;
