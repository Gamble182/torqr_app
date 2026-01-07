# Test User Credentials

This file contains test user credentials for local development and testing.

**⚠️ WARNING: These credentials are for DEVELOPMENT ONLY. Never use these in production!**

---

## Test User Account

| Field    | Value              |
|----------|--------------------|
| Email    | test@torqr.app     |
| Password | Test123!           |
| Name     | Test User          |

---

## How to Create Test User

If the test user doesn't exist in your database yet, run:

```bash
npx tsx scripts/create-test-user.ts
```

This script will:
- Check if the user already exists
- If exists: Update the password to `Test123!`
- If not: Create a new user with the credentials above

---

## Login URL

Once your development server is running:

```
http://localhost:3000/login
```

---

## Additional Test Data

After logging in, you can:
1. Create test customers manually through the UI
2. Or run a seed script (to be created later) to populate sample data

---

## Security Notes

- ✅ Password meets requirements: 8+ characters, uppercase, lowercase, number, special char
- ✅ Password is hashed with bcrypt (10 rounds) before storage
- ❌ This account should be deleted before deploying to production
- ❌ Never commit real user passwords to version control

---

**Last Updated:** January 7, 2026
