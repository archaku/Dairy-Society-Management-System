# Fix Admin Login Issue

## Quick Fix

Run this command in the backend folder:

```powershell
cd e:\DSMS\backend
npm run fix-admin
```

This will:
1. Check if admin user exists
2. Reset admin password to "admin"
3. Verify the password works

## Manual Fix (Alternative)

If the script doesn't work, you can manually reset the admin:

1. **Stop the backend server** (Ctrl+C in the terminal)

2. **Run the fix script:**
   ```powershell
   cd e:\DSMS\backend
   node scripts/fixAdmin.js
   ```

3. **Restart the backend:**
   ```powershell
   npm run dev
   ```

4. **Try logging in again:**
   - Username: `admin`
   - Password: `admin`

## What to Check

After running the fix script, check the backend console when you try to login. You should see:
- `Login attempt: { searchTerm: 'admin', userFound: true, userRole: 'admin' }`
- `Password check: { username: 'admin', role: 'admin', passwordValid: true }`

If you see `passwordValid: false`, the password wasn't reset correctly.

## Still Not Working?

1. **Check backend console** - Look for error messages
2. **Verify admin exists** - The script will tell you if admin was found/created
3. **Check MongoDB** - Make sure the database connection is working
4. **Try the email** - You can also try logging in with email: `admin@dsms.com` and password: `admin`
