# 🚀 CommunityPulse

> **Real-Time Community Sentiment & Issue Tracking Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)

CommunityPulse is a modern, full-stack web application that helps communities (schools, churches, organizations, student groups) collect anonymous feedback, analyze sentiment with AI, and make data-driven decisions to build stronger, more engaged environments.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Database Setup](#-database-setup)
- [Default Credentials](#-default-credentials)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## ✨ Features

### 🔐 Authentication & Authorization
- ✅ Secure user registration and login with JWT
- ✅ Role-based access control (Member vs Admin)
- ✅ Session management with PostgreSQL storage
- ✅ Password hashing with bcrypt (12 rounds)

### 📝 Feedback Management
- ✅ Anonymous feedback submission
- ✅ AI-powered sentiment analysis (Hugging Face)
- ✅ Category-based organization
- ✅ Upvoting system for community priorities
- ✅ Status tracking (Pending → In Progress → Resolved → Dismissed)

### 📊 Analytics & Reporting
- ✅ Real-time dashboard with sentiment distribution
- ✅ 7-day trend charts
- ✅ Category breakdown visualization
- ✅ CSV/JSON export functionality
- ✅ Priority alerts for negative sentiment spikes

### 👥 Admin Features
- ✅ Comprehensive admin dashboard
- ✅ Feedback moderation tools
- ✅ Category management (CRUD)
- ✅ User management (role assignment, deactivation)
- ✅ Activity logs and audit trails

### 🎨 User Experience
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode support
- ✅ Real-time updates
- ✅ Loading states and error handling
- ✅ Accessible UI (ARIA labels, keyboard navigation)

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Component-based UI with hot reload |
| **State Management** | React Query + Context | Server-state caching + global state |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS framework |
| **Forms** | React Hook Form + Zod | Type-safe form validation |
| **Charts** | Custom SVG + Recharts | Data visualization |
| **Backend** | Node.js 18 + Express | RESTful API server |
| **Database** | PostgreSQL 14+ | Relational data storage |
| **ORM** | Native pg driver | Direct SQL queries |
| **Auth** | JWT + bcrypt | Token-based authentication |
| **AI** | Hugging Face Inference API | Sentiment analysis |
| **Deployment** | Render.com | Full-stack hosting |
| **Version Control** | Git + GitHub | Collaborative development |

---

## 📦 Prerequisites

Before installation, ensure you have:

| Software | Version | Download Link |
|----------|---------|---------------|
| **Node.js** | 18.x or higher | [nodejs.org](https://nodejs.org) |
| **npm** | 9.x or higher | Included with Node.js |
| **PostgreSQL** | 14.x or higher | [postgresql.org](https://postgresql.org) |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

### Verify Installation

```bash
node -v      # Should show v18.x or higher
npm -v       # Should show 9.x or higher
psql --version  # Should show 14.x or higher
git --version