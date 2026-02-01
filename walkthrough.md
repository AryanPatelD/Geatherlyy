# Quiz Attempt Limit Implementation

## 📝 Changes Made

### 1. Database Schema Update
- **File:** `backend/prisma/schema.prisma`
- **Change:** Added `attemptCount` field to the `QuizAttempt` model (default: 0).
- **Reason:** To allow tracking how many times a user has taken a quiz, enabling the logic to support `maxAttempts > 1`.

### 2. Logic Implementation
- **File:** `backend/src/quizzes/quizzes.service.ts`
- **Change:** Updated `submitQuizAttempt` method.
    - **Check:** Before processing, it now checks if `existingAttempt.attemptCount >= quiz.maxAttempts`.
    - **Increment:** On successful submission, it increments the `attemptCount` (or sets to 1 for new attempts).
    - **Upsert:** Maintains the "latest score" storage strategy but now respects the limit count.

## ⚠️ Action Required
The backend server locked the Prisma Client files, preventing an automatic update of the type definitions.

**You MUST restart your backend server:**
1. Stop the running `npm run dev` in the backend folder.
2. Run again: `npm run dev`
3. This will regenerate the Prisma client and allow the new code to compile and run correctly.

## ✅ Verification
Once restarted, the system will:
1. Allow users to take a quiz up to `maxAttempts` times.
2. Throw a `403 Forbidden` error if they try to take it again after the limit is reached.
