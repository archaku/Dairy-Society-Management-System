# Dairy Society Management System (DSMS)

A comprehensive MERN stack application for managing a dairy society in Areeparambu, Cherthala.

## Features

- **Role-based Authentication**: Three user types
  - **Admin**: Default credentials (username: `admin`, password: `admin`)
  - **Farmer**: Can sell milk (requires Aadhar for registration)
  - **User**: Can buy milk from the society

- **Modern UI/UX**: Beautiful, responsive design with smooth animations

## Tech Stack

- **Frontend**: React 18, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
DSMS/
├── backend/
│   ├── config/
│   │   └── createAdmin.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (connection string already configured)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new farmer or user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires authentication)

## User Roles

1. **Admin**: Full system access
2. **Farmer**: Can register with Aadhar number to sell milk
3. **User**: Can register to buy milk from the society

## Address

Areeparambu, Cherthala

## Development

- Backend uses `nodemon` for auto-restart during development
- Frontend uses `react-scripts` for development server with hot reload

## Notes

- The default admin user is automatically created when the backend server starts
- Aadhar number is required only for farmer registration
- All passwords are hashed using bcrypt before storage
- JWT tokens expire after 7 days
