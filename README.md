# Digital Process Intelligence Movie Booking System

Full stack app with **React (Vite) + Tailwind + Axios + Recharts** and **Node/Express + MongoDB (Mongoose)**.

## Prerequisites

- Node.js (LTS recommended)
- MongoDB running locally, or a MongoDB connection string

## Backend (API)

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

API runs on `http://localhost:5000`.

## Frontend (UI)

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`.

## Default login

- **Email**: `nerthiga@gmail.com` (pre-filled/readonly on login page)
- **Password**: `Nerthiga@123` (changeable via `SEED_PASSWORD` in `backend/.env`)

## Dashboard sample data (optional)

The post-login dashboard (`/overview`) reads from `GET /overview` and needs **today’s bookings** to plot realistic trends.

- To regenerate **today’s** sample bookings on seed, set in `backend/.env`:

`SEED_RESET_TODAY_BOOKINGS=true`

Then run `npm run seed` again.

