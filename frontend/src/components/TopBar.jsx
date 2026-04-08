import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/overview" className="text-sm font-semibold tracking-wide text-slate-100">
          Digital Process Intelligence Movie Booking System
        </Link>
        <div className="flex items-center gap-3">
          {user?.email ? (
            <div className="text-sm text-slate-300">
              Logged in as: <span className="font-medium text-slate-100">{user.email}</span>
            </div>
          ) : null}
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

