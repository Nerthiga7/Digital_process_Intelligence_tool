import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import { useBooking } from "../../lib/booking";

const TICKET_PRICE = 130;

export default function PricePage() {
  const navigate = useNavigate();
  const { state } = useBooking();

  useEffect(() => {
    if (!state.seats.length) navigate("/booking/seats", { replace: true });
  }, [state.seats.length, navigate]);

  const totalPrice = state.seats.length * TICKET_PRICE;

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-slate-100">Step 5: Price Calculation</h1>
        <p className="mt-1 text-sm text-slate-400">Ticket price is fixed at Rs.130.</p>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="grid gap-2 text-sm text-slate-300">
            <div>
              Ticket price: <span className="font-semibold text-slate-100">Rs.{TICKET_PRICE}</span>
            </div>
            <div>
              Number of tickets: <span className="font-semibold text-slate-100">{state.seats.length}</span>
            </div>
            <div className="pt-2 text-lg">
              Total price: <span className="font-semibold text-slate-100">Rs.{totalPrice}</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/booking/seats")}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => navigate("/booking/pin")}
              className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

