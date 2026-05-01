# TaskFlow

A full-stack MERN project & task management platform with role-based access control.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Node.js, Express, MongoDB (Mongoose), ES Modules |
| Auth      | JWT (Bearer token), bcryptjs (saltRounds=12)    |
| Docs      | Swagger (swagger-jsdoc + swagger-ui-express)    |
| Validation| express-validator                               |
| Logging   | Winston (console + file)                        |
| Frontend  | React 18, Vite, React Router v6, Axios          |
| Styling   | Tailwind CSS                                    |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, swagger.js
│   │   ├── controllers/     # auth, project, task, user, dashboard
│   │   ├── middleware/      # auth.js, authorize.js, errorHandler.js, validate.js
│   │   ├── models/          # User.js, Project.js, Task.js
│   │   ├── routes/v1/       # auth, projects, tasks, users, dashboard
│   │   ├── validators/      # authValidators, projectValidators, taskValidators
│   │   └── utils/           # logger.js, apiResponse.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # axiosInstance, auth, projects, tasks, users, dashboard
│   │   ├── components/      # Navbar, Sidebar, ProtectedRoute, TaskCard, ProjectCard,
│   │   │                    # StatusBadge, Modal
│   │   ├── context/         # AuthContext.jsx
│   │   ├── hooks/           # useAuth, useProjects, useTasks
│   │   ├── pages/           # Login, Register, Dashboard, Projects, ProjectDetail,
│   │   │                    # Tasks, AdminPanel, NotFound
│   │   └── utils/           # formatDate.js, constants.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── .env.example
```

---

## Setup

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### 1. Clone & install

```bash
# Backend
cd taskflow/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
# Backend
cp .env.example backend/.env
# Edit backend/.env with your MONGO_URI and JWT_SECRET

# Frontend
cp .env.example frontend/.env
# VITE_API_URL is already set to http://localhost:5000/api/v1
```

### 3. Run in development

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd taskflow/backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd taskflow/frontend
npm run dev
```

### 4. Access

| URL                              | Description              |
|----------------------------------|--------------------------|
| http://localhost:5173            | Frontend app             |
| http://localhost:5000/api/docs   | Swagger API docs         |
| http://localhost:5000/health     | API health check         |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable        | Required | Description                                      |
|-----------------|----------|--------------------------------------------------|
| `PORT`          | No       | Server port (default: 5000)                      |
| `MONGO_URI`     | Yes      | MongoDB connection string                        |
| `JWT_SECRET`    | Yes      | Secret key for signing JWTs                      |
| `JWT_EXPIRES_IN`| No       | Token expiry (default: 7d)                       |
| `NODE_ENV`      | No       | Environment: development / production            |
| `CLIENT_URL`    | No       | Allowed CORS origin (default: localhost:5173)    |

### Frontend (`frontend/.env`)

| Variable        | Required | Description                                      |
|-----------------|----------|--------------------------------------------------|
| `VITE_API_URL`  | Yes      | Backend API base URL                             |

---

## API Endpoint Reference

### Auth

| Method | Endpoint              | Auth | Description                  |
|--------|-----------------------|------|------------------------------|
| POST   | `/api/v1/auth/register` | No | Register new user, return JWT |
| POST   | `/api/v1/auth/login`    | No | Login, return JWT             |
| GET    | `/api/v1/auth/me`       | Yes | Get current user              |

### Projects

| Method | Endpoint                        | Auth | Description                          |
|--------|---------------------------------|------|--------------------------------------|
| GET    | `/api/v1/projects`              | Yes  | List projects (role-filtered)        |
| POST   | `/api/v1/projects`              | Yes  | Create project                       |
| GET    | `/api/v1/projects/:id`          | Yes  | Get project + tasks                  |
| PUT    | `/api/v1/projects/:id`          | Yes  | Update project (owner or admin)      |
| DELETE | `/api/v1/projects/:id`          | Admin| Delete project + all tasks           |
| POST   | `/api/v1/projects/:id/members`  | Yes  | Add member (owner or admin)          |

### Tasks

| Method | Endpoint              | Auth | Description                                      |
|--------|-----------------------|------|--------------------------------------------------|
| GET    | `/api/v1/tasks`       | Yes  | List tasks (filterable by project/status/priority)|
| POST   | `/api/v1/tasks`       | Yes  | Create task (project owner or admin)             |
| GET    | `/api/v1/tasks/:id`   | Yes  | Get single task                                  |
| PUT    | `/api/v1/tasks/:id`   | Yes  | Update task (assignee: status only; owner/admin: all) |
| DELETE | `/api/v1/tasks/:id`   | Yes  | Delete task (project owner or admin)             |

### Users

| Method | Endpoint                  | Auth  | Description                    |
|--------|---------------------------|-------|--------------------------------|
| GET    | `/api/v1/users`           | Admin | List all users                 |
| GET    | `/api/v1/users/:id`       | Yes   | Get user profile (admin or self)|
| PUT    | `/api/v1/users/:id/role`  | Admin | Change user role               |

### Dashboard

| Method | Endpoint              | Auth | Description                              |
|--------|-----------------------|------|------------------------------------------|
| GET    | `/api/v1/dashboard`   | Yes  | Stats: projects, tasks by status, overdue|

---

## Role Permissions

| Action                        | Admin | Member (Owner) | Member (Assignee) | Member (Other) |
|-------------------------------|-------|----------------|-------------------|----------------|
| View all projects             | ✅    | ❌             | ❌                | ❌             |
| View own/assigned projects    | ✅    | ✅             | ✅                | ✅             |
| Create project                | ✅    | ✅             | ✅                | ✅             |
| Edit project                  | ✅    | ✅ (own)       | ❌                | ❌             |
| Delete project                | ✅    | ❌             | ❌                | ❌             |
| Add project member            | ✅    | ✅ (own)       | ❌                | ❌             |
| Create task                   | ✅    | ✅ (own proj)  | ❌                | ❌             |
| Update task (all fields)      | ✅    | ✅ (own proj)  | ❌                | ❌             |
| Update task (status only)     | ✅    | ✅             | ✅                | ❌             |
| Delete task                   | ✅    | ✅ (own proj)  | ❌                | ❌             |
| List all users                | ✅    | ❌             | ❌                | ❌             |
| Change user role              | ✅    | ❌             | ❌                | ❌             |
| View admin panel              | ✅    | ❌             | ❌                | ❌             |

---

## Deployment Notes

### Backend (e.g., Railway, Render, Fly.io)

1. Set all environment variables in the platform dashboard.
2. Set `NODE_ENV=production`.
3. Set `CLIENT_URL` to your frontend's production URL.
4. The `logs/` directory is created automatically — ensure the filesystem is writable or switch to a cloud logging service.
5. Start command: `node server.js`

### Frontend (e.g., Vercel, Netlify)

1. Set `VITE_API_URL` to your backend's production URL (e.g., `https://api.taskflow.app/api/v1`).
2. Build command: `npm run build`
3. Output directory: `dist`
4. Configure your hosting to redirect all routes to `index.html` (SPA routing).

### MongoDB Atlas

1. Whitelist your server's IP address (or use `0.0.0.0/0` for development).
2. Create a dedicated database user with read/write access.
3. Use the connection string format: `mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskflow`

### Security Checklist for Production

- [ ] Use a strong, random `JWT_SECRET` (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Restrict `CLIENT_URL` to your actual frontend domain
- [ ] Enable MongoDB Atlas IP allowlist
- [ ] Use HTTPS for all traffic
- [ ] Review and tighten CORS settings
