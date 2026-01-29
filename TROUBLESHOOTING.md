# Troubleshooting Guide

## Registration/Login Errors

### "Cannot connect to server" Error

**Problem**: Frontend cannot reach the backend server.

**Solution**:
1. Make sure the backend server is running:
   ```bash
   cd backend
   npm install  # If you haven't already
   npm run dev  # or npm start
   ```
2. Check that the backend is running on `http://localhost:5000`
3. Verify the backend is accessible by visiting: `http://localhost:5000/api/health`

### "MongoDB Connection Error"

**Problem**: Backend cannot connect to MongoDB.

**Solution**:
1. Check your MongoDB connection string in `backend/.env`
2. Verify your MongoDB Atlas cluster is running
3. Check if your IP is whitelisted in MongoDB Atlas
4. Verify your MongoDB username and password are correct

### "User already exists" Error

**Problem**: Trying to register with an existing username or email.

**Solution**:
- Use a different username or email
- Or login with existing credentials

### "Aadhar number is required for farmers"

**Problem**: Trying to register as a farmer without providing Aadhar.

**Solution**:
- Select "Sell Milk" (farmer role)
- Fill in the Aadhar number field (12 digits)

### Server Error (500)

**Problem**: Internal server error during registration/login.

**Solution**:
1. Check the backend console for detailed error messages
2. Verify all required fields are filled correctly
3. Check MongoDB connection
4. Ensure all dependencies are installed:
   ```bash
   cd backend
   npm install
   ```

## Common Issues

### Port Already in Use

If port 5000 is already in use:
1. Change the PORT in `backend/.env`
2. Update the frontend API URL in `frontend/src/context/AuthContext.js`

### CORS Errors

If you see CORS errors:
- The backend already has CORS enabled
- Make sure you're accessing the frontend from `http://localhost:3000`

### Module Not Found

If you see "module not found" errors:
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## Testing the Connection

1. **Test Backend Health**:
   - Open browser: `http://localhost:5000/api/health`
   - Should return: `{"status":"OK","message":"DSMS Backend is running"}`

2. **Test Frontend**:
   - Open browser: `http://localhost:3000`
   - Should show the login page

3. **Check Console**:
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

## Getting Help

If issues persist:
1. Check backend console logs for detailed errors
2. Check browser console (F12) for frontend errors
3. Verify MongoDB connection string
4. Ensure both servers are running
