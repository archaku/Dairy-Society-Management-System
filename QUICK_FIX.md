# Quick Fix for Registration Error

## Step 1: Check if Backend is Running

Open a new terminal and run:
```bash
cd backend
npm run dev
```

You should see:
- ✅ MongoDB Connected Successfully
- 🚀 Server running on port 5000

## Step 2: Check Backend Console

When you try to register, check the backend terminal. You should see:
- `Registration attempt: { username: 'archa', email: 'archaku75@gmail.com', role: 'farmer' }`
- Any error messages will appear here

## Step 3: Common Issues

### Issue: "User already exists"
**Solution**: The username "archa" or email "archaku75@gmail.com" is already registered.
- Try a different username/email
- Or login with existing credentials

### Issue: "Cannot connect to server"
**Solution**: Backend is not running
- Start the backend: `cd backend && npm run dev`
- Make sure it's running on port 5000

### Issue: MongoDB Connection Error
**Solution**: Check your MongoDB connection
- Verify connection string in `backend/.env`
- Check MongoDB Atlas is accessible
- Verify IP is whitelisted in MongoDB Atlas

## Step 4: Test the Connection

Open your browser and go to:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "DSMS Backend is running",
  "database": "Connected"
}
```

If you see an error, the backend is not running properly.

## Step 5: Try Registration Again

After ensuring the backend is running:
1. Go to the signup page
2. Fill in the form
3. Check the browser console (F12) for detailed error messages
4. Check the backend terminal for server-side errors

The error message should now be more specific!
