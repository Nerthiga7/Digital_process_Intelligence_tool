import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { useAuth } from "./lib/auth";
import SelectTheatrePage from "./pages/booking/SelectTheatrePage";
import SelectMoviePage from "./pages/booking/SelectMoviePage";
import SelectTimingPage from "./pages/booking/SelectTimingPage";
import SelectSeatsPage from "./pages/booking/SelectSeatsPage";
import PricePage from "./pages/booking/PricePage";
import PinPage from "./pages/booking/PinPage";

export default function App() {
  const { isAuthed } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthed ? <Navigate to="/overview" replace /> : <LoginPage />} />
      <Route
        path="/overview"
        element={
          <RequireAuth>
            <OverviewPage />
          </RequireAuth>
        }
      />
      <Route
        path="/booking/theatre"
        element={
          <RequireAuth>
            <SelectTheatrePage />
          </RequireAuth>
        }
      />
      <Route
        path="/booking/movie"
        element={
          <RequireAuth>
            <SelectMoviePage />
          </RequireAuth>
        }
      />
      <Route
        path="/booking/timing"
        element={
          <RequireAuth>
            <SelectTimingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/booking/seats"
        element={
          <RequireAuth>
            <SelectSeatsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/booking/price"
        element={
          <RequireAuth>
            <PricePage />
          </RequireAuth>
        }
      />
      <Route
        path="/booking/pin"
        element={
          <RequireAuth>
            <PinPage />
          </RequireAuth>
        }
      />
      <Route
        path="/analytics/:bookingId"
        element={
          <RequireAuth>
            <AnalyticsPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
