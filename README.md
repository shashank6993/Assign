# TaskFlow — Real-Time Task Management System

TaskFlow is a production-ready, real-time, responsive Task Management System built with a Node.js/Express/TypeScript backend and a Next.js/TypeScript frontend.

---

## 🚀 Key Features

- **Secure Session Management**: HTTP-only JWT cookies prevent client-side script interception (XSS protection).
- **Role-Based Authorization**:
  - **USER**: Can perform CRUD operations only on their own tasks.
  - **ADMIN**: Can view and manage all user tasks, filter tasks by user, and run full administrative controls.
- **SSE Real-Time Synchronization**: Instantly broadcast dashboard updates (create, update, delete, complete) to active browser sessions using Server-Sent Events.
- **Activity Timelines & Audit Logs**: Historical tracking of every task update, status change, creation, or deletion.
- **File Attachments**: Upload and store PDF/image attachments securely, with size limitations and download links.
- **Optimistic Updates**: Highly interactive UX that optimistically updates the task state on the frontend with automatic rollback capabilities if API requests fail.
- **Theme Selection**: Persisted Light/Dark theme switching using Tailwind classes and standard Web Storage.

---

## 🛠️ Technology Stack

### Backend
- **Core**: Node.js & Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT in HTTP-Only cookies + Bcrypt password hashing
- **File Upload**: Multer multipart parser
- **Testing**: Jest & Supertest

### Frontend
- **Core**: Next.js 16 (App Router) & React 19 with TypeScript
- **State Management**: Zustand
- **Server Cache & Sync**: TanStack Query (React Query)
- **Forms**: React Hook Form & Zod Resolver
- **Styling**: Tailwind CSS & Lucide Icons
- **Testing**: Jest & React Testing Library

---

## 📁 Project Directory Structure

```text
├── backend/
│   ├── src/
│   │   ├── __tests__/       # Integration test suites for auth and tasks
│   │   ├── handlers/        # Controller logic for auth and tasks
│   │   ├── middleware/      # Auth validation, upload, and error catchers
│   │   ├── routes/          # Express route registration
│   │   ├── sse/             # Real-time Server-Sent Events listener manager
│   │   ├── utils/           # Prisma client, token utilities
│   │   └── index.ts         # Main server entrypoint
│   ├── prisma/              # Prisma schema definition & migration logs
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── __tests__/       # Frontend component unit tests
│   │   ├── app/             # Next.js App Router (login, signup, dashboard, landing page)
│   │   ├── components/      # Modals, theme toggles, toast containers
│   │   ├── hooks/           # useSse connection hook
│   │   ├── providers/       # Auth guard and React Query context providers
│   │   ├── store/           # Zustand stores for auth, theme, and toast alerts
│   │   └── utils/           # API fetch client wrapper & Zod schemas
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml       # Production/development orchestrator
└── README.md
```

---

## 🗄️ Database Models

```prisma
model User {
  id          String        @id @default(uuid())
  name        String
  email       String        @unique
  password    String
  role        Role          @default(USER)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  tasks       Task[]
  activityLogs ActivityLog[]
}

enum Role {
  USER
  ADMIN
}

model Task {
  id          String        @id @default(uuid())
  title       String
  description String?
  status      Status        @default(TODO)
  priority    Priority      @default(MEDIUM)
  dueDate     DateTime?
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  attachments Attachment[]
}

enum Status {
  TODO
  IN_PROGRESS
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

model Attachment {
  id        String   @id @default(uuid())
  fileName  String
  fileUrl   String
  mimeType  String
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model ActivityLog {
  id        String   @id @default(uuid())
  taskId    String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String
  oldValue  Json?
  newValue  Json?
  createdAt DateTime @default(now())
}
```

---

## ⚡ Setup & Run Instructions

### Prerequisites
- Node.js (v20 or higher)
- PostgreSQL (or run via Docker)
- Docker & Docker Compose (optional)

### Method 1: Using Docker Compose (Recommended)

1. Clone the repository and navigate to the project root.
2. Run the following command to start all services (PostgreSQL, Backend Express, and Frontend Next.js):
   ```bash
   docker-compose up --build
   ```
3. Once running:
   - Frontend is available at `http://localhost:3000`
   - Backend API is available at `http://localhost:8080`
   - PostgreSQL runs on `localhost:5432`

---

### Method 2: Running Locally (Development Mode)

#### 1. Setup Backend:
1. Navigate to `/backend`.
2. Create a `.env` file from the environment template:
   ```env
   PORT=8080
   DATABASE_URL="postgresql://postgres:password123@localhost:5432/taskflow?schema=public"
   JWT_SECRET="your-development-jwt-secret-key"
   UPLOAD_DIR="uploads"
   FRONTEND_URL="http://localhost:3000"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run migrations and database schema generation:
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```
5. Start backend development server:
   ```bash
   npm run dev
   ```

#### 2. Setup Frontend:
1. Navigate to `/frontend`.
2. Create a `.env` file (if customization is needed):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start frontend development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Running Tests

### Backend Tests
Integration and unit tests mock the database layer using mock models. Run from the `/backend` directory:
```bash
npm run test
```

### Frontend Tests
Runs UI component tests using Jest and JSDOM. Run from the `/frontend` directory:
```bash
npm run test
```
