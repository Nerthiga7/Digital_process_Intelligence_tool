import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const primaryEmail = "nerthiga@gmail.com";

  const [registerMode, setRegisterMode] = useState(false);
  const [email, setEmail] = useState(primaryEmail);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const effectiveEmail = useMemo(() => (registerMode ? email : primaryEmail), [registerMode, email]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const endpoint = registerMode ? "/register" : "/login";
      const res = await api.post(endpoint, {
        email: effectiveEmail,
        password,
        login_time: new Date().toISOString(),
      });
      login({ token: res.data.token, user: res.data.user });
      navigate("/overview");
    } catch (e2) {
      setErr(e2?.response?.data?.message || (registerMode ? "Registration failed" : "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
        <div className="w-full">
          <div className="mb-8">
            <div className="text-xs font-semibold tracking-widest text-indigo-300/80">
              DIGITAL PROCESS INTELLIGENCE
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-100">Welcome, Nerthiga</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Sign in to continue your movie booking and see end-to-end bottleneck analytics.
            </p>
          </div>

          <div className="max-w-xl">
            <form onSubmit={onSubmit} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Email</label>
                  <input
                    value={registerMode ? email : primaryEmail}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!registerMode}
                    placeholder={registerMode ? "Enter email" : primaryEmail}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
                  />
                  {!registerMode ? (
                    <div className="mt-1 text-xs text-slate-500">Pre-filled (readonly)</div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Password</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
                    placeholder="Enter password"
                  />
                </div>

                {err ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {err}
                  </div>
                ) : null}

                <button
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                  type="submit"
                >
                  {loading ? (registerMode ? "Registering..." : "Logging in...") : registerMode ? "Register" : "Login"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !registerMode;
                    setRegisterMode(nextMode);
                    setErr("");
                    setPassword("");
                    setEmail(nextMode ? "" : primaryEmail);
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
                >
                  {registerMode ? "Use Primary Account" : "Add Another Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

