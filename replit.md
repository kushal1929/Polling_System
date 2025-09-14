# Overview

PollStream is a real-time polling application built with React and Express. It allows users to create, participate in, and manage polls with live updates via WebSocket connections. The application features user authentication, real-time voting updates, admin controls, and comprehensive poll management capabilities. Users can create polls with multiple options, vote on existing polls, and view results in real-time as votes are cast.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses a React-based Single Page Application (SPA) with TypeScript and Vite for development tooling. The UI is built with shadcn/ui components based on Radix UI primitives and styled with Tailwind CSS. State management is handled through React Query (@tanstack/react-query) for server state and local React state for UI interactions. Routing is implemented using Wouter for client-side navigation.

## Backend Architecture  
The server follows an Express.js REST API pattern with TypeScript. Routes are organized in a centralized registration system with middleware for logging, error handling, and session management. The storage layer uses a repository pattern to abstract database operations, providing a clean interface between business logic and data persistence.

## Database Schema
The application uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema includes:
- **users**: User accounts with authentication and admin roles
- **polls**: Poll questions with configuration options (multiple choice, result visibility)
- **poll_options**: Individual choices for each poll
- **votes**: User voting records with poll and option references
- **Relations**: Properly defined foreign key relationships between all entities

## Authentication System
Session-based authentication using express-session with PostgreSQL session store (connect-pg-simple). Passwords are hashed using bcrypt. The system includes role-based access control with admin privileges for user management and system oversight.

## Real-time Features
WebSocket integration provides live updates for:
- New votes cast on polls
- Newly created polls
- Poll deletions
- Connection status indicators
The WebSocket server broadcasts events to all connected clients for immediate UI updates.

## Component Architecture
The frontend uses a component-based architecture with:
- **Layout components**: Sidebar navigation and header with real-time status
- **UI components**: Reusable shadcn/ui components for consistent design
- **Page components**: Route-specific views for different application sections
- **Custom hooks**: Reusable logic for WebSocket connections and toast notifications

# External Dependencies

## Database
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database queries and migrations with PostgreSQL dialect
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI Framework
- **React 18**: Frontend framework with TypeScript support
- **shadcn/ui**: Pre-built component library based on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Headless, accessible component primitives

## Development Tools
- **Vite**: Fast build tool and development server with HMR support
- **TypeScript**: Type safety across frontend and backend
- **Replit plugins**: Development banner, error overlay, and cartographer for Replit environment

## Authentication & Security
- **bcrypt**: Password hashing for secure credential storage
- **express-session**: Session management middleware for user authentication

## Real-time Communication
- **WebSocket (ws)**: Native WebSocket implementation for real-time updates
- **WebSocket client**: Browser-native WebSocket API for frontend connections

## State Management
- **@tanstack/react-query**: Server state management with caching and synchronization
- **React Hook Form**: Form validation and management with resolvers
- **Zod**: Schema validation for form inputs and API data