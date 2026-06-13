# 🚀 TaskFlow — Real-Time Task Management System

TaskFlow is a **production-ready, full-stack task management application** built with **Next.js, Node.js, Express, TypeScript, PostgreSQL, and Prisma ORM**. It provides secure authentication, role-based access control, real-time updates, optimistic UI interactions, activity tracking, file attachments, Docker support, and CI/CD automation.

---

## 🌐 Live Demo & Submission Links

### 🚀 Deployed Applications

- **Frontend (Live Application):** https://assign-jade.vercel.app/
- **Backend Health Endpoint:** https://assign-amg8.onrender.com/health

### 🎥 Demo Video

- **Project Walkthrough:** https://youtu.be/c2v60XHtdnM

### 👨‍💻 Developer Information

- **LinkedIn:** https://www.linkedin.com/in/shashank-chaudhary3309/
- **GitHub Profile:** https://github.com/shashank6993

### 📦 Repository

- **GitHub Repository:** https://github.com/shashank6993/Assign

### 🔄 CI/CD Pipeline

- **GitHub Actions:** https://github.com/shashank6993/Assign/actions

## ✨ Key Features

### 🔐 Authentication & Authorization

- JWT-based authentication using **HTTP-only cookies**
- Password hashing using **bcrypt**
- Persistent user sessions across page refreshes
- Protected backend routes
- Secure logout functionality

### 👥 Role-Based Access Control

#### USER
- Create, view, update, and delete their own tasks
- Upload attachments to their tasks
- View task activity logs

#### ADMIN
- View and manage tasks across all users
- Filter tasks by specific users
- Access all administrative operations

---

## 📋 Task Management Features

- Create tasks
- Edit existing tasks
- Delete tasks
- Mark tasks as completed
- View task details
- Responsive task dashboard

Each task supports:

- Title
- Description
- Status
- Priority
- Due Date
- Attachments
- Activity History

---

## 🔎 Search, Filter & Sorting

Task lists support:

### Search
- Search tasks by title

### Filtering
- Filter tasks by status:
  - TODO
  - IN_PROGRESS
  - COMPLETED

### Sorting
Sort tasks by:

- Created Date
- Due Date
- Priority

### Pagination

Supports paginated task retrieval with metadata.

---

## ⚡ Real-Time Updates

TaskFlow uses **Server-Sent Events (SSE)** to synchronize task changes across active browser sessions.

Real-time events include:

- Task Created
- Task Updated
- Task Deleted
- Task Completed

---

## 📝 Activity Timeline

Every significant task action is recorded:

- Task Creation
- Task Updates
- Status Changes
- Task Deletion
- Attachment Uploads

Users can review task history directly from the task details modal.

---

## 📎 File Attachments

Supported attachment types:

- Images
- PDF Documents

Features:

- Secure upload handling
- Metadata persistence
- Download links
- Attachment listing within task details

---

## 🎨 User Experience Features

- Responsive Design
- Dark Mode Support
- Theme Persistence
- Loading States
- Empty States
- Error Handling
- Toast Notifications
- Optimistic UI Updates

---

## 🛠️ Technology Stack

### Frontend

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query
- React Hook Form
- Zod
- Lucide Icons
- Jest
- React Testing Library

### Backend

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcrypt
- Multer
- Server-Sent Events (SSE)
- Jest
- Supertest

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions
- Render
- Vercel

---

## 📁 Project Structure

```text
taskflow/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── __tests__/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── sse/
│   │   ├── utils/
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── __tests__/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── providers/
│   │   ├── store/
│   │   └── utils/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .github/workflows/
└── README.md
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|---------|-----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get authenticated user |

### Tasks

| Method | Endpoint |
|---------|------------|
| POST | `/api/tasks` |
| GET | `/api/tasks` |
| GET | `/api/tasks/:id` |
| PATCH | `/api/tasks/:id` |
| DELETE | `/api/tasks/:id` |

Supports:

```text
?page=
&limit=
&status=
&search=
&sort=
&order=
```

### Activity Logs

| Method | Endpoint |
|---------|-----------|
| GET | `/api/tasks/:id/activity` |

### Attachments

| Method | Endpoint |
|---------|-----------|
| POST | `/api/tasks/:id/attachments` |
| GET | `/api/tasks/:id/attachments` |

### Realtime Events

| Method | Endpoint |
|---------|-----------|
| GET | `/api/events` |

---

## ⚙️ Environment Variables

### Backend

```env
PORT=8080
DATABASE_URL=
JWT_SECRET=
UPLOAD_DIR=uploads
FRONTEND_URL=
```

### Frontend

```env
NEXT_PUBLIC_API_URL=
```

---

## 🚀 Local Development Setup

### Clone Repository

```bash
git clone https://github.com/shashank6993/Assign.git

cd Assign
```

### Backend Setup

```bash
cd backend

npm install

npx prisma migrate dev

npm run dev
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## 🐳 Docker Setup

Run the entire application stack using Docker:

```bash
docker compose up --build
```

Services:

- Frontend → http://localhost:3000
- Backend → http://localhost:8080
- PostgreSQL → localhost:5432

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

npm test
```

Tests cover:

- Signup success
- Login success
- Unauthorized access
- Validation failures
- Ownership enforcement
- Admin permissions
- Activity log creation

### Frontend Tests

```bash
cd frontend

npm test
```

Tests cover:

- Login validation
- Task form validation
- Task rendering
- Pagination behavior
- Optimistic rollback
- Theme persistence

---

## 🔄 Continuous Integration

GitHub Actions automatically performs:

- Dependency installation
- Backend testing
- Frontend testing
- Backend build validation
- Frontend build validation

---

## 🚢 Deployment

### Frontend

Hosted on **Vercel**

https://assign-jade.vercel.app/

---

### Backend

Hosted on **Render**

Health Check Endpoint:

https://assign-amg8.onrender.com/health

---

### Continuous Integration

GitHub Actions Workflow:

https://github.com/shashank6993/Assign/actions

## ⚖️ Architecture Decisions

- Express + TypeScript was selected to provide a familiar and maintainable backend architecture with strong typing support.
- Prisma ORM simplifies database interactions while maintaining type safety.
- HTTP-only JWT cookies improve security against XSS attacks.
- TanStack Query enables efficient server state management and optimistic UI updates.
- Server-Sent Events provide lightweight real-time synchronization without introducing WebSocket complexity.
- Docker Compose ensures consistent local development environments.

---

## 🔁 Trade-offs & Assumptions

### Trade-offs

- Local file storage was chosen for attachments instead of cloud providers to simplify deployment.
- SSE was selected instead of WebSockets due to the application's one-way update requirements.
- Prisma migrations are expected to be executed during deployment setup.

### Assumptions

- PostgreSQL is available in all deployment environments.
- Modern browsers supporting EventSource are used.
- Uploaded files remain within configured size limits.

---

## 🔮 Future Improvements

- Email verification workflows
- Password reset functionality
- WebSocket-based collaboration
- Cloud storage integration (AWS S3 / Cloudinary)
- Push notifications
- Advanced analytics dashboard
- Bulk task operations

---

## 📬 Submission Checklist

- ✅ Source Code Repository
- ✅ Frontend Deployment
- ✅ Backend Deployment
- ✅ Demo Video
- ✅ Docker Configuration
- ✅ Automated Tests
- ✅ GitHub Actions CI/CD Pipeline
- ✅ README Documentation

## 👨‍💻 Author

### Shashank Chaudhary

- **LinkedIn:** https://www.linkedin.com/in/shashank-chaudhary3309/
- **GitHub:** https://github.com/shashank6993

---

Thank you for reviewing this submission. I appreciate your time and consideration.
