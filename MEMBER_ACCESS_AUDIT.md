# 🛡️ Member Access Control Audit

> **Objective:** Comprehensive verification of system access for users with the `MEMBER` role.

The following audit details every action a standard `MEMBER` can perform, what is explicitly blocked, and where logic checks are applied.

## 👤 User Profile & Auth
| Action | Endpoint | Access | Logic Check |
| :--- | :--- | :--- | :--- |
| **Login/Register** | `POST /auth/*` | ✅ Allowed | Public access. |
| **View Own Profile** | `GET /users/me` | ✅ Allowed | Returns own data only. |
| **Update Own Profile** | `PUT /users/me` | ✅ Allowed | **SAFE**: Controller strips `role` and `approvalStatus`. |
| **View Others** | `GET /users/:id` | ✅ Allowed | Public profile info (Name, Avatar, Dept). |
| **Search Faculty** | `GET /users/search-faculty` | ✅ Allowed | Read-only. |
| **List Users** | `GET /users` | ⛔ Blocked | Requires `FACULTY` or `ADMIN`. |
| **Update Role** | `PUT /users/:id/role` | ⛔ Blocked | Requires `FACULTY` or `ADMIN`. |
| **Delete User** | `DELETE /users/:id` | ⛔ Blocked | Requires `ADMIN`. |

---

## 🏛️ Clubs Management
| Action | Endpoint | Access | Logic Check |
| :--- | :--- | :--- | :--- |
| **View Clubs** | `GET /clubs` | ✅ Allowed | Public read access. |
| **View My Clubs** | `GET /clubs/my-clubs` | ✅ Allowed | Returns clubs user joined. |
| **Join Club** | `POST /clubs/:id/join` | ✅ Allowed | Checks `maxMembers` limit. |
| **Leave Club** | `POST /clubs/:id/leave` | ✅ Allowed | Coordinators cannot leave directly (must be removed). |
| **Apply Coordinator** | `POST /clubs/:id/apply-coordinator`| ✅ Allowed | Creates request for Admin/Faculty approval. |
| **Create Club** | `POST /clubs` | ⛔ Blocked | Requires `FACULTY` or `ADMIN`. |
| **Update Club** | `PUT /clubs/:id` | ⛔ Blocked | Requires `COORDINATOR`, `FACULTY` or `ADMIN`. |
| **Delete Club** | `DELETE /clubs/:id` | ⛔ Blocked | Requires `ADMIN`. |
| **Add/Remove Coord** | `POST/DELETE .../coordinators` | ⛔ Blocked | Requires `FACULTY` or `ADMIN`. |
| **Export Members** | `GET .../export` | ⛔ Blocked | Requires `COORDINATOR`+ |

---

## 📝 Quizzes
| Action | Endpoint | Access | Logic Check |
| :--- | :--- | :--- | :--- |
| **List Quizzes** | `GET /quizzes` | ✅ Allowed | Read-only. |
| **Take Quiz** | `GET /quizzes/:id` | ✅ Allowed | **SAFE**: Does NOT return answers for Members. |
| **Submit Quiz** | `POST /quizzes/:id/submit` | ✅ Allowed | Checks `maxAttempts` and `timeLimit`. |
| **View Leaderboard** | `GET .../leaderboard` | ✅ Allowed | Public read access. |
| **Create Quiz** | `POST /quizzes` | ⚠️ Conditional | **Check:** Controller calls `canUserCreateQuiz`. <br> **Logic:** Returns `403` if user is not a Coordinator of that club. <br> **Result:** Safe. Members cannot create arbitrary quizzes. |
| **Update/Delete** | `PUT/DELETE /quizzes/:id` | ⛔ Blocked | Requires `COORDINATOR`+ |
| **View Stats** | `GET .../stats` | ⛔ Blocked | Requires `COORDINATOR`+ |

---

## 📚 Resources
| Action | Endpoint | Access | Logic Check |
| :--- | :--- | :--- | :--- |
| **List Resources** | `GET /resources` | ✅ Allowed | Read-only. |
| **Download** | `GET /resources/:id` | ✅ Allowed | Read-only. |
| **Upload** | `POST /resources` | ⚠️ Conditional | **Check:** Endpoint allows `MEMBER` role to enter, but implementation logic explicitly checks: `if (role === MEMBER && !isClubCoordinator) throw Forbidden`. <br> **Result:** Safe. Only Coordinators can upload. |
| **Update/Delete** | `PUT/DELETE ...` | ✅ Allowed | **Logic:** `canUserModifyResource` checks ownership. Users can only modify resources they uploaded (which implies they were coordinators when they did it). |

---

## 📅 Activities
| Action | Endpoint | Access | Logic Check |
| :--- | :--- | :--- | :--- |
| **List Activities** | `GET /activities` | ✅ Allowed | Public read access. |
| **Create Activity** | `POST /activities` | ⚠️ Conditional | **Check:** Similar to Quizzes, calls `canUserCreateActivity`. <br> **Result:** Safe. Only Coordinators can create. |
| **Update/Delete** | `PUT/DELETE ...` | ✅ Allowed | **Logic:** `canUserModifyActivity` restricts to Coordinator/Faculty. |

---

## 💬 Comments
| Action | Endpoint | Access | Logic Check |
| :--- | :--- | :--- | :--- |
| **Create Comment** | `POST /comments` | ✅ Allowed | Any auth user. |
| **View Club Comments**| `GET /comments/club/:id` | ✅ Allowed | Any auth user. |
| **List All** | `GET /comments` | ⛔ Blocked | Requires `COORDINATOR`+ |
| **Edit/Delete** | `PUT/DELETE ...` | ✅ Allowed | **Logic:** `canUserModifyComment` checks if user is the author. Safe. |

---

## 🚫 Member Removal Requests
| Action | Endpoint | Access | Logic Check |
| :--- | :--- | :--- | :--- |
| **Create Request** | `POST /removal-requests` | ⛔ Blocked | Requires `COORDINATOR`. Members cannot vote off other members. |
| **Review Request** | `PUT ...` | ⛔ Blocked | Requires `FACULTY` or `ADMIN`. |

## 🏁 Conclusion
The system follows a strict Role-Based Access Control (RBAC) model.
- **Normal Members** are restricted to consumption (viewing clubs, resources, activities) and participation (joining, commenting, taking quizzes).
- **Destructive/Management Actions** are protected either by:
    1.  `@Roles` decorators (Hard Block).
    2.  Service-level logic checks (`canUserCreate...`) for granular Coordinator permissions.
- **Privilege Escalation** via Profile Update is patched.

The system is secure for deployment for normal users.
