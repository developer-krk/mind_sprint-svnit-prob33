

# 🌟 MindSprint – Smart Subscription Manager

A **full-stack subscription management application** with authentication, dashboards, and theme support.

* **Frontend**: Deployed on **GitHub Pages** (`/docs`)
* **Backend**: Deployed on **Railway** (`/Server`)

---

## 📑 Table of Contents

* [✨ Features](#-features)
* [🛠 Tech Stack](#-tech-stack)
* [📂 Project Structure](#-project-structure)
* [⚙️ Setup & Installation](#️-setup--installation)
* [🌍 Deployment](#-deployment)
* [📡 API Endpoints](#-api-endpoints)
* [🖥️ Usage Guide](#️-usage-guide)
* [🤝 Contributing](#-contributing)
* [📜 License](#-license)

---

## ✨ Features

* 🔐 **Authentication** – Secure Register/Login with JWT & HttpOnly cookies
* 📊 **Dashboard** – Manage and track your subscriptions easily
* 🎨 **Theme Support** – Light & Dark mode available
* 🧩 **Modular APIs** – Authentication and subscription management
* 🛡️ **Security First** – Helmet, CORS, and secure cookie handling
* 🌍 **Deployment Ready** – Frontend on GitHub Pages, Backend on Railway

---

## 🛠 Tech Stack

**Frontend** (`/docs`)

* HTML5, CSS3 (Custom + Tailwind)
* JavaScript (Vanilla, DOM manipulation)

**Backend** (`/Server`)

* Node.js, Express.js
* MongoDB with Mongoose ODM
* JWT Authentication
* Middleware: Helmet, CORS, Cookie-Parser
* Deployment: Railway

---

## 📂 Project Structure

```
mind_sprint-svnit-prob33/
│
├── docs/                 # Frontend (GitHub Pages)
│   ├── index.html
│   ├── homepage.html
│   ├── login.html
│   ├── app.js
│   ├── login.js
│   ├── styles.css
│   └── login.css
│
├── Server/               # Backend (Railway)
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env (local only)
│   └── Routes/...
│
└── README.md
```

---

## ⚙️ Setup & Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/developer-krk/mind_sprint-svnit-prob33.git
cd mind_sprint-svnit-prob33
```

### 2️⃣ Backend Setup (`/Server`)

```bash
cd Server
npm install
```

Create a `.env` file in `/Server`:

```env
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
COOKIE_NAME=auth_token
NODE_ENV=development
PORT=3000
DOMAIN=http://localhost:3000
```

Run the server:

```bash
npm start
```

👉 Server runs at: [http://localhost:3000](http://localhost:3000)

### 3️⃣ Frontend Setup (`/docs`)

Open `index.html` in a browser or deploy using GitHub Pages.

---

## 🌍 Deployment

* **Frontend** → GitHub Pages (`/docs`)
* **Backend** → Railway (`/Server`)

CORS configuration allows:

* `http://localhost:3000`
* `http://localhost:5173`
* `http://localhost:8080`
* `https://developer-krk.github.io`
* Railway Production URL

---

## 📡 API Endpoints

### 🔑 Auth

* `POST /api/auth/register` → Register a new user
* `POST /api/auth/login` → Login & receive token
* `GET /api/user` → Fetch logged-in user details

### 📊 Dashboard

* `GET /api/dashboard` → Get all subscriptions
* `POST /api/dashboard` → Add new subscription
* `PUT /api/dashboard/:id` → Update subscription
* `DELETE /api/dashboard/:id` → Remove subscription

### 🛠 Utilities

* `GET /health` → Server health check
* `GET /api/db-status` → MongoDB connection status

---

## 🖥️ Usage Guide

1. **Open the App**

   * Navigate to the frontend via GitHub Pages or `docs/index.html` locally.

2. **Register / Login**

   * Create a new account or log in with existing credentials.
   * Authentication uses JWT stored in HttpOnly cookies.

3. **Access Dashboard**

   * After login, you’ll be redirected to the subscription dashboard.
   * View all your subscriptions in one place.

4. **Manage Subscriptions**

   * **Add**: Enter subscription details and save.
   * **Edit**: Update an existing subscription.
   * **Delete**: Remove unwanted subscriptions.

5. **Switch Theme**

   * Toggle between **Light Mode** and **Dark Mode**.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch → `git checkout -b feature-name`
3. Commit your changes → `git commit -m "Add feature"`
4. Push to your branch → `git push origin feature-name`
5. Open a Pull Request 🎉

---

## 📜 License

This project is licensed under the **ISC License**.

---

🔥 Ready to try? Access the **Frontend on GitHub Pages** and connect with the **Backend on Railway**.

