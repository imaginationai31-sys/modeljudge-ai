# Admin Bootstrap

ModelJudge AI supports a one-time admin bootstrap for an existing active reviewer account.

## Render setup

Add this environment variable to the API service:

`ADMIN_BOOTSTRAP_TOKEN=<strong-random-secret>`

Keep the value private. Never commit it to GitHub.

## Promote the first admin

Call:

```bash
curl -i -X POST "https://modeljudge-api.onrender.com/api/auth/bootstrap-admin" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Bootstrap-Token: YOUR_BOOTSTRAP_TOKEN" \
  -d '{"reviewer_id":"YOUR_REVIEWER_ID"}'
```

The endpoint only succeeds when there is no active admin account. It promotes the named active reviewer account to `admin`.

Expected success response:

```json
{
  "message": "Admin bootstrap complete. Sign out and sign in again to receive an admin session.",
  "account": {
    "id": "...",
    "reviewer_id": "YOUR_REVIEWER_ID",
    "role": "admin"
  }
}
```

After success, sign out of ModelJudge AI and sign in again. The new session will contain `role=admin` and Buyer Management will become available.

## Security

- Do not place `ADMIN_BOOTSTRAP_TOKEN` in frontend code.
- Do not commit the token to GitHub.
- Bootstrap is disabled once an active admin exists.
- Buyer Management remains protected by the authenticated `admin` role.
