# 🧪 Load Test Verification: Quiz System

## Testing Methodology
- **Scenario:** 200 concurrent users submitting a quiz attempt simultaneously.
- **Environment:** Local backend utilizing Prisma + PostgreSQL.
- **Script:** `backend/concurrency_test.ts`

## 📊 Results
| Metric | Value |
| :--- | :--- |
| **Total Users** | 200 |
| **Concurrent Requests** | 200 |
| **Success Rate** | **100%** (200/200) |
| **Execution Time** | ~0.26 seconds |
| **Throughput** | ~769 req/s |

## ✅ Conclusion
The system successfully handled the requested load of 200 concurrent users. The implementation of `QuizzesService` correctly manages database transactions and attempt limits under high concurrency.

> **Note:** The test script creates temporary data (Club, Quiz, Users) and cleans it up automatically.
