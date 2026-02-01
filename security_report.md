# Profile & Security Hardening Report

## 🔒 Security Fixes Implemented

### 1. UI Hardening (Frontend)
- **Issue:** The "Complete Your Profile" page included a "Faculty" option in the Year/Designation dropdown.
- **Risk:** Inaccurate user profile data and potential confusion about role assignment.
- **Fix:** Removed the `<option value="faculty">Faculty</option>` from `frontend/src/app/complete-profile/page.tsx`.

### 2. Privilege Escalation Prevention (Backend)
- **Issue:** The `PUT /users/me` endpoint blindly accepted the request body and passed it to the database update method.
- **Risk:** A malicious user could manually construct a request with `{ "role": "ADMIN" }` or `{ "role": "FACULTY" }` to escalate their privileges during profile completion.
- **Fix:** Updated `UsersController.updateCurrentUser` in `backend/src/users/users.controller.ts` to explicitly strip `role` and `approvalStatus` fields from the request payload before processing the update.

## ✅ Verification
- **Frontend:** The dropdown no longer shows "Faculty".
- **Backend:** Any attempt to send `role` in the profile update payload will now be efficiently ignored, preventing unauthorized role changes.
