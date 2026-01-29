# How to Start the Backend Server

## Quick Start (Windows PowerShell)

1. **Open a new terminal/command prompt**

2. **Navigate to the backend folder:**
   ```powershell
   cd e:\DSMS\backend
   ```

3. **Install dependencies (if not already done):**
   ```powershell
   npm install
   ```

4. **Start the server:**
   ```powershell
   npm run dev
   ```
   OR if nodemon is not installed:
   ```powershell
   npm start
   ```

5. **You should see:**
   ```
   ✅ MongoDB Connected Successfully
   📊 Database: dsms
   ✅ Default admin user created (username: admin, password: admin)
   🚀 Server running on port 5000
   ```

6. **Keep this terminal open** - the server must stay running!

7. **Test the connection:**
   - Open your browser
   - Go to: `http://localhost:5000/api/health`
   - You should see: `{"status":"OK","message":"DSMS Backend is running"}`

## Troubleshooting

### If you see "npm is not recognized":
- Install Node.js from: https://nodejs.org/
- Restart your terminal after installation

### If you see "MongoDB Connection Error":
- Check your internet connection
- Verify MongoDB Atlas cluster is running
- Check if your IP is whitelisted in MongoDB Atlas

### If port 5000 is already in use:
- Change PORT in `backend/.env` to another number (e.g., 5001)
- Update frontend API URL in `frontend/src/context/AuthContext.js`

### If dependencies are missing:
```powershell
cd e:\DSMS\backend
npm install
```

## Important Notes

- **Keep the backend terminal running** while using the app
- The backend must be running before you can register/login
- You need TWO terminals:
  - One for backend (port 5000)
  - One for frontend (port 3000)
