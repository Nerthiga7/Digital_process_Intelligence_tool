import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./lib/auth";
import { BookingProvider } from "./lib/booking";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BookingProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  </StrictMode>,
)
