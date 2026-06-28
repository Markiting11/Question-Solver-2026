# Security Specification

## Data Invariants
1. A user's profile can only be read by the owner or an administrator.
2. A user's question history is nested under their profile and can only be accessed by the owner or an administrator.
3. Only the hardcoded administrator `arshad2097@gmail.com` can self-approve and gain administrative roles upon creation.
4. Normal users must register in 'pending' status and cannot escalate their own privilege or change their approval status.
5. The platform sign-up config can be read publicly but only modified by administrators.

## "Dirty Dozen" Payloads to Deny
1. Creating a user profile with role 'admin' (privilege escalation).
2. Creating a user profile with status 'approved' (by-passing pending stage).
3. Reading another user's profile.
4. Writing/reading history items under another user's path.
5. Modifying own status to 'approved' or role to 'admin' via updates.
6. Writing to platform config as a non-admin.
7. Deleting another user's profile as a non-admin.
8. Deleting own profile to clear bad states (unless admin).
9. Writing custom properties or shadow fields outside of allowed schema.
10. Modifying immutable fields like email or createdAt after registration.
11. Reading user list without being an admin.
12. Creating a user with arbitrary long string ids or junk names.

## Verification
All these attempts must return permission denied via security rules.
