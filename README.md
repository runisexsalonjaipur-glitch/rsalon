# R Unisex Salon - Management System

A full-stack salon management dashboard built with React + Node.js + MongoDB Atlas.

## Features
- 📊 Real-time Revenue Analytics Dashboard
- 👤 Customer Entry & History
- 💇 Service Management
- 👥 Staff Management
- 💳 Multi-mode Payment Tracking (Cash / UPI / Card)
- 🔐 Role-based Access (Super Admin & Admin/Staff)

## Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Auth:** JWT

## Setup

### Backend
```bash
cd backend
npm install
# Create .env with your values (see below)
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables (Backend `.env`)
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=your_password
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
```

## Railway Deployment
Set the above variables in Railway → Project → Variables tab.
Set the **Start Command** to: `node server.js`
