# Gatherly - Centralized Club Management System

A modern, minimal, role-based web platform for managing university clubs, activities, quizzes, and member engagement.

## 🚀 Quick Start

**New to the project?** Get started in 5 minutes:

### Automated Setup (Recommended)

```bash
# Clone the repository
git clone <your-repository-url>
cd Gatherly

# Windows
.\setup.ps1

# macOS/Linux
chmod +x setup.sh && ./setup.sh
```

The script will install dependencies, set up databases, and configure everything automatically.

### Manual Setup

See [SETUP.md](./SETUP.md) for detailed manual installation instructions.

### Quick Commands

```bash
# Start development servers
cd backend && npm run dev      # Terminal 1 - Backend (port 5000)
cd frontend && npm run dev     # Terminal 2 - Frontend (port 3000)
docker-compose up -d           # Start databases (PostgreSQL + Redis)

# Database operations
npm run prisma:migrate         # Run migrations
npm run prisma:studio          # Open database GUI
npm run prisma:seed           # Seed initial data
```

## 🏗️ Project Structure

This project is organized into separate frontend and backend:

```
Gatherly/
├── frontend/          # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/      # Pages (login, dashboards, clubs)
│   │   ├── components/
│   │   ├── context/  # Zustand stores
│   │   └── styles/
│   └── package.json
├── backend/           # NestJS REST API
│   ├── src/
│   │   ├── modules/  # Feature modules (auth, users, clubs, etc.)
│   │   ├── prisma/   # Database client
│   │   └── main.ts   # Entry point
│   ├── prisma/       # Database schema & migrations
│   └── package.json
├── docker-compose.yml # PostgreSQL + Redis setup
├── SETUP.md          # Detailed setup instructions
└── CONTRIBUTING.md   # Development guidelines
```

## 🚀 Features

- **Google OAuth Authentication** - Seamless sign-in with institutional emails
- **Profile Completion Flow** - First-time setup with role selection
- **Role-Based Dashboards**
  - **Members** - Browse clubs, participate in activities, view leaderboards
  - **Coordinators** - Manage clubs, create activities, run quizzes
  - **Faculty/Admin** - Approve roles, manage platform, view analytics
- **Club Management** - Create, manage, and discover clubs
- **Quiz System** - MCQ quizzes with images, timers, and scoring
- **Leaderboards** - Overall, weekly, and quiz-specific rankings
- **Anonymous Comments** - Feedback hidden from peers, visible to admins
- **Resources Management** - Share PDFs, images, and links
- **Light/Dark Mode** - Full theme support with system preference detection

## 📋 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom theming
- **State Management**: Zustand
- **Authentication**: Google OAuth 2.0
- **Theme**: next-themes (Light/Dark mode)

### Backend
- **Runtime**: Node.js
- **Framework**: NestJS (Production-ready architecture)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: Passport.js + JWT
- **File Upload**: Cloudinary
- **Security**: Helmet, Throttling, bcrypt

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 14
- **Cache**: Redis 7
- **DB Admin**: Adminer (included in Docker setup)

## 🛠️ Installation

> **⚡ Quick Setup:** Use our automated setup scripts! See [Quick Start](#-quick-start) above.

For detailed installation instructions, troubleshooting, and manual setup, see [SETUP.md](./SETUP.md).

## 📁 Project Structure

### Frontend (`/frontend`)
```
src/
├── app/                      # Next.js App Router pages
│   ├── login/               # Professional login with split-screen
│   ├── complete-profile/    # Profile setup
│   ├── member/              # Member dashboard
│   ├── coordinator/         # Coordinator dashboard
│   ├── faculty/             # Faculty dashboard
│   ├── admin/               # Admin dashboard
│   └── clubs/               # Club pages
├── components/              # Reusable UI components
│   ├── Navbar.tsx
│   ├── ThemeToggle.tsx
│   └── [19 total components]
├── context/                # Zustand state stores
│   ├── AuthContext.tsx
│   └── ClubContext.tsx
└── styles/
    └── globals.css         # Theme variables & styling
```

### Backend (`/backend`)
```
src/
├── config/
│   └── database.js         # MongoDB connection
├── models/
│   └── User.js             # User schema
├── routes/                 # API endpoints
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── club.routes.js
│   ├── activity.routes.js
│   ├── quiz.routes.js
│   ├── resource.routes.js
│   ├── comment.routes.js
│   └── leaderboard.routes.js
├── controllers/            # Route handlers (to be implemented)
├── middleware/             # Auth & validation (to be implemented)
└── server.js               # Express app entry
```

## 🎨 Design System

### Color Scheme
- **Primary**: Indigo (#6366f1) - Buttons, links, highlights
- **Secondary**: Purple (#8b5cf6) - Gradients, accents
- **Light Mode**: White background, dark gray text
- **Dark Mode**: Slate background, light gray text

### Login Page
Professional split-screen design:
- **Left Panel**: Branding with gradient, feature highlights with emojis
- **Right Panel**: Google OAuth button with proper branding, welcome text
- **Responsive**: Stacked on mobile, side-by-side on desktop

## 🔐 Authentication Flow

1. User clicks "Sign In"
2. Redirected to `/login`
3. Mock Google OAuth login (ready for real integration)
4. First-time users → `/complete-profile`
5. Profile completion (mandatory fields)
6. Role selection → Dashboard (with approval status if needed)

## 👥 User Roles

### Member
- View dashboard with activity overview
- Browse and join clubs
- Participate in activities and quizzes
- Access leaderboards and resources
- Post anonymous comments

### Club Coordinator
- Create and manage activities
- Create and publish quizzes
- Manage club members and resources
- View club-specific analytics
- Moderate comments (can see author)
- Status: Requires admin approval

### Faculty Mentor
- Register clubs
- Assign coordinators
- Approve coordinator/faculty requests
- View platform analytics
- Override permissions

### Admin
- Full platform control
- User management
- System analytics
- Announcement broadcasting

## 🎯 Key Pages

| Page | Route | Access |
|------|-------|--------|
| Landing | `/` | Public |
| Login | `/login` | Public |
| Profile Setup | `/complete-profile` | First-time users |
| Member Dashboard | `/dashboard` | Members+ |
| My Clubs | `/dashboard/clubs` | Members+ |
| Discover Clubs | `/dashboard/discover` | Members+ |
| Club Detail | `/dashboard/clubs/[id]` | Members+ |
| Quiz | `/dashboard/quiz/[id]` | Members+ |
| Leaderboard | `/dashboard/leaderboard` | Members+ |
| Club Manager | `/dashboard/manage` | Coordinators+ |
| Approvals | `/dashboard/approvals` | Faculty+ |
| Analytics | `/dashboard/analytics` | Faculty+ |
| Profile | `/dashboard/profile` | Members+ |

## 🚀 Development

### Essential Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio (DB GUI)
npm run prisma:seed     # Seed database with test data

# Code Quality
npm run lint            # Check code style
npm run format          # Format code with Prettier
npm test               # Run tests (when implemented)

# Docker
docker-compose up -d    # Start all services
docker-compose down     # Stop all services
docker-compose logs -f  # View logs
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the [CONTRIBUTING.md](./CONTRIBUTING.md) guidelines
   - Write clean, documented code
   - Test your changes thoroughly

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed development guidelines.

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) guide for:

- Code standards and best practices
- Git workflow and branch naming
- Testing guidelines
- Pull request process
- Project structure overview

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide with troubleshooting
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development guidelines and workflow
- **[CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)** - Cloudinary integration guide
- **[QUIZ_LEADERBOARD_SYSTEM.md](./QUIZ_LEADERBOARD_SYSTEM.md)** - Quiz & leaderboard documentation

## 🔧 Environment Variables

### Backend (.env)

```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5433/gatherly
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Optional
REDIS_HOST=localhost
REDIS_PORT=6379
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
NEXT_PUBLIC_API_URL=http://localhost:5000
```

See [SETUP.md](./SETUP.md) for complete environment variable documentation.

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

**Database connection issues?**
```bash
# Restart Docker containers
docker-compose restart

# Or reset everything
docker-compose down -v
docker-compose up -d
```

## 🚀 Deployment

The project is ready for deployment on **Railway**.

### Deployment Steps (Railway)

1. **Fork/Clone** this repository to your GitHub account.
2. Login to [Railway](https://railway.app/).
3. Create a **New Project** -> **Deploy from GitHub repo**.
4. Select your forked repository.
5. Railway will automatically detect the multiple services. If not, add them manually:
    - **Service 1 (Backend)**:
        - Root Directory: `/backend`
        - Build Command: `npm install && npm run prisma:generate && npm run build`
        - Start Command: `npm run start:prod`
        - Variables: Add all variables from `backend/.env.example` (DATABASE_URL, JWT_SECRET, etc.).
    - **Service 2 (Frontend)**:
        - Root Directory: `/frontend`
        - Build Command: `npm install && npm run build`
        - Start Command: `npm start`
        - Variables: `NEXT_PUBLIC_API_URL` (points to your backend domain), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
6. **Databases**:
    - Add a **PostgreSQL** service in Railway and link it (use `DATABASE_URL` variable).
    - Add a **Redis** service and link it (use `REDIS_HOST`, `REDIS_PORT` variables).

Your application should now be live! 🚀
