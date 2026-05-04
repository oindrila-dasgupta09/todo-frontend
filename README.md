# 🚀 Todo App (Full Stack + DevOps)

A full-stack Todo Application built using **React, Node.js, PostgreSQL, Docker, and Kubernetes**.
This project demonstrates CRUD operations along with containerization and deployment using Kubernetes.

---

## 🧠 Project Overview

This application allows users to:

* ➕ Add tasks
* ✏️ Update tasks
* ❌ Delete tasks
* 📋 View all tasks

---

## 🏗️ Architecture

```
React (Frontend - localhost:3000)
        ↓
Node.js + Express (Backend API)
        ↓
PostgreSQL (Database)
```

---

## 📁 Project Structure

```
Downloads/
│
├── todo-app (Backend + Kubernetes)
│   ├── server.js
│   ├── Dockerfile
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── package.json
│
└── todo-frontend (React App)
    ├── src/App.js
```

---

## ⚙️ Tech Stack

* **Frontend:** React.js
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL
* **Containerization:** Docker
* **Orchestration:** Kubernetes (Minikube)

---

## 🔥 Features

* Full CRUD operations (Create, Read, Update, Delete)
* REST API integration
* Dockerized backend
* Kubernetes deployment
* Simple and responsive UI

---

## 📦 Backend Setup

```bash
cd todo-app
npm install
node server.js
```

Backend runs on:

```
http://localhost:3000
```

---

## 🐘 Database Setup (PostgreSQL)

```sql
CREATE DATABASE tododb;

\c tododb

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL
);
```

---

## ⚛️ Frontend Setup

```bash
cd todo-frontend
npm install
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

## 🐳 Docker Setup

```bash
cd todo-app

docker build -t todo-app:latest .
docker tag todo-app:latest <your-docker-username>/todo-app:v1
docker push <your-docker-username>/todo-app:v1
```

---

## ☸️ Kubernetes Setup

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl get pods
kubectl get svc
```

---

## 🔌 Run with Port Forwarding

```bash
kubectl port-forward service/todo-service 8080:3000
```

Backend will be accessible at:

```
http://localhost:8080
```

---

## 💥 Common Issues

### ❌ Failed to fetch

* Backend not running
* Wrong API URL
* Port-forward not active

### ❌ ImagePullBackOff

* Docker image not pushed
* Incorrect image name

### ❌ CrashLoopBackOff

* Error in server.js

---

## 🎯 What I Learned

* Building REST APIs with Express
* Connecting Node.js with PostgreSQL
* Creating React frontend
* Dockerizing applications
* Deploying apps using Kubernetes

---

## 🚀 Future Improvements

* Add authentication (login/signup)
* Improve UI/UX
* Add CI/CD pipeline (Jenkins/GitHub Actions)
* Deploy backend on cloud (AWS/GCP)

---

## 👩‍💻 Author

**Oindrila Dasgupta**

---

## ⭐ Final Result

This project demonstrates a **production-style full-stack DevOps workflow**, combining development and deployment skills in a single application.
