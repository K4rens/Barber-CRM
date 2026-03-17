import { Navigate } from "react-router-dom";
import { tokenStorage } from "../api/client";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const token = tokenStorage.get();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
