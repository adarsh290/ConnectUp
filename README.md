# ConnectUp 🎓

A campus connection app — swipe to find like-minded people at your college, match, and chat in real time.

## Project Structure

```
ConnectUp/
├── frontend/        ← React 19 client (CRA)
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── public/
├── backend/         ← Node.js / Express API
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── config/
│   └── uploads/     ← Profile images (gitignored)
├── .gitignore
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, Socket.IO Client, Axios |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) |
| File Uploads | Multer |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
cp env.example .env        # fill in your MONGODB_URI, JWT_SECRET, PORT, CLIENT_URL
npm install
npm run dev                # starts with nodemon on port 5000
```

### Frontend Setup

```bash
cd frontend
cp env.example .env        # set REACT_APP_API_URL and REACT_APP_SOCKET_URL
npm install
npm start                  # starts on port 3000
```

## Environment Variables

### Backend (`backend/.env`)

```
MONGODB_URI=mongodb://localhost:27017/connectup
JWT_SECRET=your_strong_secret_here
PORT=5000
CLIENT_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Features

- 🔐 JWT authentication (register / login)
- 👤 Profile setup with photo upload (JPEG/PNG, max 5MB)
- 🔍 Explore users by branch, year, and interests
- 👍 Like / skip with swipe gestures (touch & mouse)
- 💬 Real-time chat via Socket.IO with typing indicators & read receipts
- 🌙 Dark mode toggle
- 📱 Mobile-responsive design

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/users/me` | Get current user |
| PUT | `/api/users/me` | Update profile |
| DELETE | `/api/users/me` | Delete account |
| GET | `/api/users/explore` | Get explore users |
| POST | `/api/users/me/upload-profile-picture` | Upload avatar |
| POST | `/api/actions/like/:userId` | Like a user |
| GET | `/api/chat/matches` | Get matched users |
| GET | `/api/chat/history/:userId` | Get chat history |
