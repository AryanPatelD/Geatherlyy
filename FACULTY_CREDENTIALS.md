# 🔐 Faculty Account Credentials
> **Important for Developers:** This document contains information about the provisioning of Faculty accounts.

## 👥 How Faculty Accounts are Created
When a new Club is created by a Faculty or Admin, they can assign other Faculty members as **Mentors** or **Convenors** using their email address.

If the Faculty member does not already exist in the system, an account is **automatically created** for them.

## 🔑 Default Credentials
To allow these automatically created Faculty members to log in without using Google Sign-In, a **default password** is now assigned.

**You must securely provide these credentials to the respective Faculty members:**

- **Username:** (Their email address)
- **Default Password:** `GatherlyFaculty123!`

> [!WARNING]
> You should advise Faculty members to **immediately change this password** after their first login by visiting their Profile page.

## 🛠️ Implementation Details
- **File:** `backend/src/clubs/clubs.service.ts`
- **Method:** `findOrCreateFaculty`
- **Logic:** Now uses `bcrypt` to set the default password instead of leaving it null.
