# Admin Credentials

## Default Admin Login

- **Username:** `admin`
- **Password:** `admin1`

**Note:** The password must be at least 6 characters long (as per system validation), so it's set to `admin1` instead of `admin`.

## Why "admin1" instead of "admin"?

The User model has a validation rule requiring passwords to be at least 6 characters long. Since "admin" is only 5 characters, the password was changed to "admin1" (6 characters) to meet this requirement.

## To Reset Admin Password

If you need to reset the admin password, run:

```powershell
cd e:\DSMS\backend
npm run fix-admin
```

This will reset the admin password to `admin1`.
