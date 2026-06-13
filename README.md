# City Library Management System

A premium, modern, and interactive library management system built with Next.js 14, React, Three.js, Tailwind CSS, Prisma ORM, and PostgreSQL. It features responsive pages, a 3D book hero showcase, a dynamic book search engine, custom dashboards for members and admins, and a robust borrowing / reservation pipeline.

---

## Tech Stack & Key Features

*   **Frontend Framework:** Next.js 14 (App Router) with TypeScript
*   **Aesthetic & Styling:** Tailwind CSS, custom design tokens (light cream/espresso brown & dark black/warm yellow), CSS variables, and glassmorphism.
*   **3D Interactive Elements:** Three.js, `@react-three/fiber`, and `@react-three/drei` for floating books and interactive UI cards.
*   **Authentication:** NextAuth.js (Session-based, securely linking to custom database credentials).
*   **Database Management (DBMS):** PostgreSQL served via Prisma ORM for type-safe database queries.

---

## Database Architecture & DBMS Design

This system leverages **PostgreSQL** as the core relational database management system (RDBMS) paired with **Prisma ORM** as the database connector and client.

### Client Connection Strategy (Prisma Singleton)
To prevent connection leaks and exhaustion of PostgreSQL's client connection pool during Next.js hot-reloads, the application uses a **Singleton pattern** for the Prisma Client defined in `lib/db.ts`. In development, the client is attached to `globalThis` so it persists across hot-reloads, while in production it operates as a standard single instance.

### Database Schema Entity-Relationship Diagram (ERD)

The relational schema represents the key entities of a library management system: books, physical copies, members, loans, and reservations (holds). Below is the Mermaid ERD:

```mermaid
erDiagram
    Member ||--o{ Loan : "places"
    Member ||--o{ Hold : "requests"
    Member ||--o{ Session : "has"
    Book ||--o{ BookCopy : "has"
    Book ||--o{ Loan : "borrowed"
    Book ||--o{ Hold : "reserved"
    BookCopy ||--o{ Hold : "assigned-to"

    Book {
        String id PK
        String title
        String author
        String isbn UK
        String category
        String publisher
        Int year
        Int totalCopies
        Int availableCopies
        String description
        String coverImage
        String language
        Int pages
        String location
        DateTime createdAt
        DateTime updatedAt
    }

    BookCopy {
        String id PK
        String bookId FK
        String barcode UK
        BookCopyStatus status
        String location
        DateTime createdAt
        DateTime updatedAt
    }

    Member {
        String id PK
        String name
        String email UK
        String studentId UK
        String department
        String phone
        String membershipId UK
        String passwordHash
        Role role
        MemberStatus status
        DateTime joinedAt
        DateTime expiresAt
        DateTime createdAt
        DateTime updatedAt
    }

    Loan {
        String id PK
        String memberId FK
        String bookId FK
        DateTime issuedAt
        DateTime dueDate
        DateTime returnedAt
        Boolean renewed
        LoanStatus status
        DateTime createdAt
        DateTime updatedAt
    }

    Hold {
        String id PK
        String memberId FK
        String bookId FK
        String copyId FK
        Int position
        DateTime requestedAt
        DateTime expiresAt
        HoldStatus status
        DateTime createdAt
        DateTime updatedAt
    }

    Session {
        String id PK
        String sessionToken UK
        String memberId FK
        DateTime expires
    }
```

---

### Database Tables & Data Dictionary

#### 1. Book (Metadata Table)
Holds the library's metadata definitions.
*   `id` (String, Primary Key): Unique CUID identifier.
*   `isbn` (String, Unique): The International Standard Book Number.
*   `totalCopies` (Int): Total copies purchased.
*   `availableCopies` (Int): Currently borrowable copies.
*   *Performance Indexes:* B-tree indexes are applied on `title`, `author`, `category`, and `isbn` to accelerate search queries and categorization lookups.

#### 2. BookCopy (Physical Inventory)
Tracks each unique physical copy of a book in the library.
*   `id` (String, Primary Key): Unique CUID.
*   `bookId` (String, Foreign Key): References `Book.id`.
*   `barcode` (String, Unique): Unique scanned barcode on the physical book.
*   `status` (Enum `BookCopyStatus`): `AVAILABLE`, `CHECKED_OUT`, `ON_HOLD`, `LOST`.
*   *Performance Indexes:* Indexes applied on `bookId` and `status` to quickly fetch and update available copies.

#### 3. Member (User Accounts)
Contains credentials and profile settings for both students and library administrators.
*   `id` (String, Primary Key): Unique CUID.
*   `email` (String, Unique): Account email (also used as login ID).
*   `studentId` & `membershipId` (String, Unique): Institutional IDs.
*   `passwordHash` (String): SHA-256 hashed password.
*   `role` (Enum `Role`): `MEMBER` or `ADMIN`.
*   `status` (Enum `MemberStatus`): `PENDING` (needs approval), `ACTIVE` (can login), `EXPIRED`, `SUSPENDED`.

#### 4. Loan (Transaction Log)
Tracks checkout logs, borrowing windows, returns, and renewals.
*   `id` (String, Primary Key): Unique CUID.
*   `memberId` (String, Foreign Key): References `Member.id`.
*   `bookId` (String, Foreign Key): References `Book.id`.
*   `status` (Enum `LoanStatus`): `ACTIVE`, `RETURNED`, `OVERDUE`.
*   *Performance Indexes:* Indexes applied on `memberId`, `bookId`, and `status` to optimize search and dashboard queries.

#### 5. Hold (Reservations Queue)
Manages waiting lists for books that are currently checked out.
*   `id` (String, Primary Key): Unique CUID.
*   `memberId` & `bookId` (String, Foreign Keys).
*   `copyId` (String, Nullable Foreign Key): Assigned physical copy when it becomes available.
*   `position` (Int): Queue order position.
*   `status` (Enum `HoldStatus`): `WAITING` (in queue), `READY` (reserved for member pickup), `EXPIRED`.

---

## Application Workflows & State Logic

### 1. Membership Application & Authentication Flow
```
[User Registration Form] ──> Status: PENDING 
                                  │
                                  ▼
[Admin Dashboard] ─────────> Clicks "Approve" (Status: ACTIVE)
                                  │
                                  ▼
[Login Panel] ─────────────> Standard NextAuth Session (SHA-256 Credential Match)
```

### 2. Borrowing & Hold Lifecycle
1.  **Checkout:** When a member borrows a book:
    *   A `Loan` record is created (with a 14-day `dueDate`).
    *   The `Book.availableCopies` value is decremented.
    *   The corresponding `BookCopy` status changes to `CHECKED_OUT`.
2.  **Return:** When a book is returned:
    *   The `Loan.returnedAt` timestamp is populated, and status becomes `RETURNED`.
    *   `Book.availableCopies` is incremented.
    *   `BookCopy` status reverts to `AVAILABLE`.
3.  **Holds:** If `availableCopies == 0`, a member can place a `Hold`:
    *   A `Hold` record is inserted with `status: WAITING`.
    *   The member is placed in a FIFO queue (`position` increments).
    *   Upon book return, the system updates the highest priority hold (`position: 1`) to `status: READY` and sets the `copyId`.

---

## Deployment Guide

Follow these instructions to deploy both the PostgreSQL Database and the Next.js Frontend.

### Phase 1: Deploy the Database (DBMS)
You can deploy your PostgreSQL database on **Neon.tech**, **Supabase**, or **Render**.

#### Option A: Neon (Serverless PostgreSQL - Recommended)
1.  Sign up at [Neon.tech](https://neon.tech) and create a new project.
2.  Select **PostgreSQL 16**.
3.  Copy the connection string (with pooled connections `?pgbouncer=true` if using serverless functions). It will look like:
    ```
    postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
    ```

#### Option B: Supabase
1.  Go to [Supabase.com](https://supabase.com) and create a project.
2.  In Database Settings, copy the **Transaction Connection String** (Port `6543`) for your environment variables.

---

### Phase 2: Deploy the Frontend on Vercel
Since this is a Next.js app, deploying on **Vercel** is highly optimized and straightforward.

1.  Push your code to a GitHub, GitLab, or Bitbucket repository.
2.  Login to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
3.  Import your repository.
4.  Configure the **Environment Variables** (expand the toggle):
    *   `DATABASE_URL`: Add your PostgreSQL connection string from Phase 1.
    *   `NEXTAUTH_SECRET`: Generate a random hash (e.g., run `openssl rand -base64 32` in your terminal).
    *   `NEXTAUTH_URL`: Enter your deployed canonical production URL (e.g., `https://my-library-app.vercel.app`) or leave blank for Vercel to automatically resolve it.
5.  In **Build and Development Settings**, ensure the Install Command is `npm install` and the Build Command is `npm run build`.
6.  Click **Deploy**.

---

### Phase 3: Run Production Migrations & Seed Admin
Vercel builds will fail if the database schema is not provisioned. To push the database schema and add the admin user in production:

1.  Install the Prisma CLI globally or use `npx`.
2.  Ensure you have your production database connection string in your local `.env` file, or run the command inline:
    ```bash
    # Push the schema to your remote database
    DATABASE_URL="your-production-db-connection-string" npx prisma db push
    
    # Run the seeder to populate the initial admin account
    DATABASE_URL="your-production-db-connection-string" npm run db:seed
    ```
3.  *(Alternative)* You can add a post-install hook inside `package.json` to auto-migrate:
    ```json
    "build": "prisma generate && prisma db push && next build"
    ```

---

## Local Development Setup

To run this application locally, follow these steps:

### 1. Prerequisites
*   **Node.js 20 LTS** or higher
*   **PostgreSQL 16** running locally

### 2. Setup Guide
1.  **Clone the Repository & Install Dependencies:**
    ```bash
    cd assignments-library-website
    npm install
    ```

2.  **Database Creation:**
    Create a new database locally via `psql` or pgAdmin:
    ```sql
    CREATE DATABASE library_db;
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and enter your connection credentials:
    ```env
    DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/library_db"
    NEXTAUTH_SECRET="your-super-secret-random-key"
    NEXTAUTH_URL="http://localhost:3000"
    ```

4.  **Database Migration & Seeding:**
    Push the schema rules to PostgreSQL and create the primary admin credential:
    ```bash
    npm run db:push
    npm run db:seed
    ```
    *   *Default Admin Login:* `admin@library.local` / `Admin@1234`

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Project Directory Structure

```
├── app/
│   ├── api/                   # API routes for books, members, loans, holds, stats
│   ├── admin/                 # Admin console UI (Membership management)
│   ├── book/[id]/             # Book details page
│   ├── dashboard/             # Member loans, holds, and history dashboard
│   ├── login/                 # Sign-in page
│   ├── membership/            # Apply forms and rules
│   ├── search/                # Book Search and Filters page
│   ├── layout.tsx             # Main layout shell
│   └── page.tsx               # Homepage with 3D elements
├── components/
│   ├── hero/                  # Three.js 3D floating canvas and elements
│   ├── ui/                    # Shared reusable UI elements (buttons, inputs)
│   └── layout/                # Navbars and Footer
├── lib/
│   ├── db.ts                  # Prisma Client singleton
│   ├── auth.ts                # NextAuth options and configurations
│   └── utils.ts               # Date helpers, fines, and IDs generators
└── prisma/
    ├── schema.prisma          # Data Models definitions
    └── seed.ts                # Script to seed default database tables
```
