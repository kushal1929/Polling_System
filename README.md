# Overview

PollStream is a real-time polling application built with React and Express. It allows users to create, participate in, and manage polls with live updates via WebSocket connections. The application features user authentication, real-time voting updates, admin controls, and comprehensive poll management capabilities. Users can create polls with multiple options, vote on existing polls, and view results in real-time as votes are cast.


## Table of Contents

- [Overview](#overview)  
- [Application Structure](#application-structure)  
- [Prerequisites](#prerequisites)  
- [Setup Locally](#setup-locally)  
- [System Architecture](#system-architecture)  
- [External Dependencies](#external-dependencies)  

---

## Overview

PollStreamer allows users to:

- Create polls with multiple options  
- Vote on existing polls  
- View real-time results as votes are cast  
- Admins can manage polls and users  

---

## Application Structure

PollStreamer/
├── client/ # Frontend React application
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── pages/ # Route components
│ │ ├── hooks/ # Custom hooks (use-auth, use-websocket)
│ │ ├── lib/ # Utilities (queryClient, helpers)
│ │ └── types/ # TypeScript type definitions
│ └── index.html # HTML entry point
├── server/ # Backend Express + WebSocket application
│ ├── routes.ts # API endpoints
│ ├── storage.ts # Database functions
│ ├── db.ts # Drizzle ORM / PostgreSQL connection
│ ├── middleware.ts # Error handling, auth, validation
│ ├── vite.ts # Development tooling integration
│ └── index.ts # Server entry point
├── shared/ # Shared types/schemas
│ └── schema.ts # Drizzle ORM schema definitions
├── tests/ # Test cases
└── package.json # Project metadata + scripts

yaml
Copy code

---

## Prerequisites

- Node.js >= 18  
- npm  
- Git  
- PostgreSQL database (Neon/Postgres free tier recommended)  

---

## Setup Locally

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd PollStreamer
2. Install dependencies
bash
Copy code
npm install
cd client
npm install
cd ..
3. Configure environment variables
Create a .env file in server/:

ini
Copy code
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
PORT=5000
NODE_ENV=development
Use your Neon/Postgres free database URL.

4. Push database schema
bash
Copy code
npm run db:push
This will create tables for users, polls, poll_options, and votes.

5. Start backend + frontend together
bash
Copy code
npm run dev
Backend: Express API + WebSockets

Frontend: Vite dev server

Open browser at: http://localhost:5000

6. Test APIs
bash
Copy code
curl http://localhost:5000/api/polls
curl http://localhost:5000/api/users
System Architecture
Frontend Architecture
React SPA with TypeScript & Vite

UI: shadcn/ui + Radix UI + Tailwind CSS

State management: React Query (@tanstack/react-query) + local state

Routing: Wouter

Backend Architecture
Express.js REST API with TypeScript

Centralized route registration

Middleware for logging, error handling, sessions

Repository pattern for database abstraction

Database Schema
users: User accounts with authentication and admin roles

polls: Poll questions (multiple choice, result visibility)

poll_options: Choices for each poll

votes: User votes with poll/option references

Proper foreign key relationships

Authentication System
Session-based with express-session + PostgreSQL store (connect-pg-simple)

Passwords hashed with bcrypt

Role-based access control for admin

Real-time Features
WebSocket integration for:

New votes

New polls

Poll deletions

Connection indicators

Component Architecture
Layout components: Sidebar, header

UI components: Reusable shadcn/ui

Page components: Route-specific views

Custom hooks: WebSocket and notifications

External Dependencies
Database
Neon PostgreSQL: Serverless DB

Drizzle ORM: Type-safe queries

connect-pg-simple: PostgreSQL session store

UI Framework
React 18 + TypeScript

shadcn/ui

Tailwind CSS

Radix UI

Development Tools
Vite

TypeScript

Replit plugins (if used)

Authentication & Security
bcrypt: Password hashing

express-session: Session management

Real-time Communication
WebSocket (ws)

Browser-native WebSocket client

State Management
@tanstack/react-query

React Hook Form

Zod for validation

License
MIT

yaml
Copy code

---

If you want, I can also **add badges, screenshots, and live demo links** to make it look even more professional for GitHub.  

Do you want me to do that next?