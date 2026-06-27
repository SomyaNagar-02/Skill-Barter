# SkillBarter

Full-stack demo project built with React, Vite, Tailwind CSS, Node.js, Express, MongoDB, and JWT authentication.

## Structure

- `frontend/` - React + Vite app
- `backend/` - Express API with MongoDB and auth

## Setup

1. Install backend dependencies:

```powershell
cd backend
npm install
```

2. Install frontend dependencies:

```powershell
cd ../frontend
npm install
```
```

3. Create environment files from `.env.example` in both folders.

4. Start backend and frontend in separate terminals:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

## Notes

- Frontend uses `VITE_API_URL` to connect to the API.
- Backend uses `MONGODB_URI` and `JWT_SECRET`.
- Protected pages require a valid JWT stored in `localStorage`.
