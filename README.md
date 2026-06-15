# 📚 City Library Management System

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?logo=vercel&logoColor=white&style=for-the-badge)](https://frontend-xi-henna-98.vercel.app)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white&style=for-the-badge)](https://www.prisma.io/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white&style=for-the-badge)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white&style=for-the-badge)](https://www.postgresql.org/)

A premium, modern, and interactive enterprise-grade Library Management System. Built using a robust monorepo structure with a **Next.js 14** (App Router) frontend, **Three.js** 3D graphics, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL**.

The application features an immersive 3D floating book showcase, dynamic faceted book search, role-scoped custom dashboards (Members, Librarians, Admins), a FIFO reservation queue, Supabase storage for cover images, and automated transaction notifications via Twilio WhatsApp API.

---

## 🚀 Live Production URL

The project is fully built, optimized, and deployed on **Vercel**:
🔗 **[https://frontend-xi-henna-98.vercel.app](https://frontend-xi-henna-98.vercel.app)**

---

## ✨ Key Enhancements & Features

- **🌐 Vercel Production Deployment** — Configured Vercel production deployment pipeline for high performance Next.js serverless rendering (SSR) and API routes.
- **🛠️ Optimized Build Config** — Resolved Next.js compile-time strict type checking issues on Vercel by introducing proper TypeScript devDependencies (e.g., `dotenv` type resolution for setup scripts).
- **🗄️ Supabase Storage Integration** — Secure and high-performance bucket integration for dynamic book covers, eliminating the dependency on unverified third-party image URLs.
- **💬 Twilio WhatsApp API** — Event-driven member notifications (for loans, returns, and overdue alerts) that gracefully fallback to a local mock logging system if credentials are not configured.
- **🛡️ Multi-Role Authorization & Guards** — Role-based authorization layers supporting `MEMBER`, `LIBRARIAN`, and `ADMIN` profiles. Implemented custom session guards to secure backend APIs.
- **📋 OTP Identity Verification** — Secure mobile OTP verification schema & workflows to register and validate users.
- **📈 Advanced Analytics** — Live library performance dashboard showcasing active loans, overdue statistics, queue length, and book analytics.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) | React server components, routing, and serverless API handlers. |
| **3D Elements** | Three.js + R3F + Drei | Interactive floating and rotating 3D book cover showcase on the hero landing page. |
| **Styling** | Tailwind CSS + CSS Variables | Glassmorphic design language, smooth CSS micro-interactions, dark mode. |
| **Database ORM** | Prisma ORM | Typesafe client queries and schema migration migrations. |
| **Database** | PostgreSQL 16 (Supabase) | Scalable relational storage with connection pooling configured. |
| **Storage & Assets** | Supabase Storage Buckets | Handles storage and CDN-accelerated delivery of book cover uploads. |
| **Communications** | Twilio WhatsApp API | Automated messaging pipeline for real-time transactional alerts. |

---

## 📐 System Architecture & Database Schema

### Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    Member ||--o{ Loan : "places"
    Member ||--o{ Hold : "requests"
    Member ||--o{ Session : "has"
    Book ||--o{ BookCopy : "has"
    Book ||--o{ Loan : "borrowed as"
    Book ||--o{ Hold : "reserved as"
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
        String aadharNumber UK
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

    Otp {
        String id PK
        String phone
        String code
        DateTime expiresAt
        DateTime createdAt
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

### Roles & Database Enums

| Enum | Supported System Values |
| :--- | :--- |
| `Role` | `MEMBER`, `ADMIN`, `LIBRARIAN` |
| `MemberStatus` | `PENDING`, `ACTIVE`, `EXPIRED`, `SUSPENDED` |
| `LoanStatus` | `ACTIVE`, `RETURNED`, `OVERDUE` |
| `HoldStatus` | `WAITING`, `READY`, `EXPIRED` |
| `BookCopyStatus` | `AVAILABLE`, `CHECKED_OUT`, `ON_HOLD`, `LOST` |

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- **Node.js**: v20.x LTS or higher
- **PostgreSQL**: v16.x database instance
- **NPM**: Package manager (comes with Node)

### 2. Installation & Setup
Clone the repository and install the dependencies:
```bash
git clone https://github.com/your-username/librr.git
cd librr/frontend
npm install
```

### 3. Environment Configurations
Copy the environment template:
```bash
cp .env.example .env
```
Populate the variables in `.env`:
```env
# Database Settings
DATABASE_URL="postgresql://username:password@localhost:5432/library_db"

# Authentication Settings
NEXTAUTH_SECRET="your_nextauth_secret_key" # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Supabase Storage Configurations
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Twilio Configurations (Optional - defaults to mock mode if left blank)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_WHATSAPP_FROM="+14155238886"
```

### 4. Database Setup & Seeding
Push the database schema structure and seed default mock books/users:
```bash
# Push schema structure to local DB
npm run db:push

# Seed the database
npm run db:seed
```
* **Default Admin Credentials**:
  * **Email**: `admin@library.local`
  * **Password**: `Admin@1234`

### 5. Running the Application
Start the development server:
```bash
npm run dev
```
Access the dashboard at [http://localhost:3000](http://localhost:3000).

---

## 🚢 Production Deployment

### Database Layer
1. Deploy a hosted PostgreSQL instance (e.g., Neon.tech, Supabase, AWS RDS).
2. Apply the database structure using Prisma:
   ```bash
   DATABASE_URL="your-production-db-url" npx prisma db push --schema=database/prisma/schema.prisma
   DATABASE_URL="your-production-db-url" npx tsx database/prisma/seed.ts
   ```

### Frontend (Vercel)
The project is optimized for deployment on Vercel. 
1. Link your repository in Vercel.
2. Set the root directory to `frontend`.
3. Add the exact environment variables in Vercel Dashboard Settings.
4. Deploy. The project automatically runs type validation, Prisma generation, and compile-time verification during build:
   ```json
   "build": "prisma generate && next build"
   ```

---

## 📂 Project Directory Structure

```
librr/
├── database/
│   └── prisma/
│       ├── schema.prisma            # Database Schema definitions
│       ├── seed.ts                  # Admin user seed script
│       ├── seed-books.ts            # Book catalog seed script
│       └── seed-copies.ts           # Book copies seed script
├── frontend/
│   ├── .env.example                 # Environment variables template
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                 # Endpoint logic (auth, admin, dashboard, stats)
│   │   │   ├── admin/               # Admin Portal screens
│   │   │   ├── book/                # Dynamic detailed book page
│   │   │   ├── dashboard/           # User dashboard (Loans, History, Reservations)
│   │   │   └── membership/          # Registration routes
│   │   ├── components/              # Interactive components (3D Hero, Carousel, Forms)
│   │   ├── lib/                     # Client helper wrappers & database interfaces
│   │   └── scripts/                 # Utility scripts (bucket initializers, etc.)
│   ├── package.json                 # Next.js workspace config
│   └── tsconfig.json                # TypeScript settings
└── README.md                        # Master Documentation
```

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE.txt](./LICENSE.txt) file for details.
