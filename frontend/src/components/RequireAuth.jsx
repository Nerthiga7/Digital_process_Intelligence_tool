import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/" replace />;
  return children;
}

