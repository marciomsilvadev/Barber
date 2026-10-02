# Auth-Gated App Testing Playbook

## Required checks

- Verify `/api/auth/me` with a valid session cookie or bearer token.
- Verify protected barber and appointment endpoints reject unauthenticated requests.
- Verify the Google OAuth callback reads `session_id` from the URL hash and exchanges it through the backend.
- Verify logout clears the session and redirects to login.
- All MongoDB responses must omit `_id` and use the custom `user_id` field.

## Test data guidance

Create a temporary user with a custom `user_id` and a temporary `user_sessions` document using the configured database. Do not store real passwords or OAuth credentials in this file.