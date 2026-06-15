# City Library Management System

A premium, modern, and interactive library management system built with **Next.js 14**, **React**, **Three.js**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL**. It features a 3D book hero showcase, dynamic book search, custom dashboards for members and admins, a book reservation queue, Supabase-based image storage, and optional WhatsApp notifications via Twilio.

---

## What's New / Improvements

- **Supabase Storage Integration** — Book cover images are now uploaded and served via Supabase Storage, removing the dependency on third-party CDN URLs.
- **WhatsApp Notifications (Twilio)** — Members receive WhatsApp notifications on key events (loan issued, overdue reminders). Falls back to a local mock log file if Twilio is not configured.
- **Librarian Role** — New `LIBRARIAN` role added alongside `MEMBER` and `ADMIN`. Librarians can issue/return books without full admin access.
- **OTP Table** — New `Otp` model added to support phone-based one-time password flows for identity verification.
- **Aadhar-based Identity** — Member identity is now verified via `aadharNumber` (Aadhaar) instead of a generic student ID.
- **Overdue Loan Tracking** — Stats API now exposes live `overdueLoans` and `activeLoans` counts for the admin dashboard.
- **Singleton Prisma Client** — Global Prisma Client pattern prevents connection pool exhaustion during Next.js hot-reloads.
- **Role-scoped Session Guards** — `session.ts` exposes `requireMember`, `requireAdmin`, `requireStaff`, and `requireLibrarian` helpers used across all API routes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + CSS Variables + Glassmorphism |
| 3D Elements | Three.js, `@react-three/fiber`, `@react-three/drei` |
| Authentication | NextAuth.js (credential-based, DB-linked) |
| ORM | Prisma ORM |
| Database | PostgreSQL 16 |
| File Storage | Supabase Storage |
| Notifications | Twilio WhatsApp API (optional) |

---

## Database Schema

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

### Enums

| Enum | Values |
|---|---|
| `Role` | `MEMBER`, `ADMIN`, `LIBRARIAN` |
| `MemberStatus` | `PENDING`, `ACTIVE`, `EXPIRED`, `SUSPENDED` |
| `LoanStatus` | `ACTIVE`, `RETURNED`, `OVERDUE` |
| `HoldStatus` | `WAITING`, `READY`, `EXPIRED` |
| `BookCopyStatus` | `AVAILABLE`, `CHECKED_OUT`, `ON_HOLD`, `LOST` |

### Data Dictionary

#### Book
Holds library catalogue metadata. B-tree indexes on `title`, `author`, `category`, `isbn` accelerate search queries.

#### BookCopy
Tracks each physical copy. `barcode` is the unique shelf label. Indexes on `bookId` and `status` for fast availability checks.

#### Member
User accounts for students, admins, and librarians. `aadharNumber` is the government-issued identity field. `passwordHash` uses SHA-256. Members start as `PENDING` until an admin approves them.

#### Otp
Stores short-lived OTP codes (linked by `phone`) for identity verification flows. Indexed on `phone`.

#### Loan
Transaction log of all checkouts. `dueDate` is auto-set to 14 days from issue. Indexed on `memberId`, `bookId`, `status`, and `dueDate`.

#### Hold
FIFO reservation queue. `position` determines priority. `copyId` is assigned when a copy becomes available and the hold becomes `READY`.

#### Session
NextAuth.js session tokens. Cascade-deleted when the related member is deleted.

---

## Application Workflows

### 1. Membership & Authentication Flow
```
[Registration Form] ──> status: PENDING
                              │
                              ▼
[Admin Dashboard] ──> Approve (status: ACTIVE)
                              │
                              ▼
[Login Page] ──> NextAuth Credential Auth ──> Session Created
```

### 2. Borrowing & Hold Lifecycle

1. **Checkout:** `Loan` created → `Book.availableCopies` decremented → `BookCopy.status = CHECKED_OUT`
2. **Return:** `Loan.returnedAt` set → `status = RETURNED` → `availableCopies` incremented → If hold queue exists, top hold → `READY`
3. **Hold Queue:** If `availableCopies == 0` → `Hold` created with `status: WAITING` and FIFO `position`

### 3. WhatsApp Notification Flow
```
[Loan / Overdue Event]
       │
       ▼
[sendWhatsAppMessage()]
       │
       ├─── Twilio credentials set? ──> POST to Twilio WhatsApp API
       │
       └─── No credentials? ──────────> Mock log to whatsapp_mock_logs.txt
```

---

## Local Development Setup

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20 LTS or higher |
| PostgreSQL | 16 (via Homebrew or installer) |
| npm | Bundled with Node.js |

---

### Step 1 — Clone & Install

```bash
git clone https://github.com/your-username/librr.git
cd librr/frontend
npm install
```

---

### Step 2 — Create the PostgreSQL Database

Open `psql` (or use pgAdmin / TablePlus) and run:

```sql
CREATE DATABASE library_db;
```

> **Homebrew users:** Your default PostgreSQL user is your macOS username with no password.
> Connection string: `postgresql://your_mac_username@localhost:5432/library_db`

---

### Step 3 — Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in at minimum:

```env
# Required
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/library_db"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Required for book cover uploads
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Optional — WhatsApp notifications (leave blank to use mock log mode)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_WHATSAPP_FROM="+14155238886"
```

> **Generate `NEXTAUTH_SECRET`:**
> ```bash
> openssl rand -base64 32
> ```

---

### Step 4 — Push Schema & Seed Database

```bash
# From the project root (librr/)
npx prisma db push --schema=database/prisma/schema.prisma

# Seed admin account (admin@library.local / Admin@1234)
npx tsx database/prisma/seed.ts

# (Optional) Seed book catalogue
npx tsx database/prisma/seed-books.ts

# (Optional) Seed physical copies for each book
npx tsx database/prisma/seed-copies.ts
```

Or use the npm scripts from inside `frontend/`:

```bash
npm run db:push
npm run db:seed
```

> **Default Admin Credentials:**
> - Email: `admin@library.local`
> - Password: `Admin@1234`

---

### Step 5 — Start the Dev Server

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Troubleshooting Local Setup

| Problem | Fix |
|---|---|
| `ECONNREFUSED` on DATABASE_URL | PostgreSQL is not running. Run `brew services start postgresql@16` |
| `prisma: command not found` | Use `npx prisma` instead |
| Supabase upload fails | Ensure `SUPABASE_SERVICE_ROLE_KEY` is set and the `book-covers` storage bucket exists in your Supabase project |
| WhatsApp 63007 error | Your Twilio `From` number is not registered for WhatsApp. Use the Sandbox number or leave Twilio blank to use Mock Mode |
| WhatsApp 70051 error | Auth Token is invalid or does not have messaging permissions. Rotate your Auth Token in the Twilio Console |
| Login always fails | Check `NEXTAUTH_SECRET` is set. Re-run `npm run db:seed` to ensure the admin account exists |

---

## Deployment (Production)

### Phase 1 — Database

Deploy PostgreSQL on **Neon.tech** (recommended), **Supabase**, or **Render**:

1. Sign up at [neon.tech](https://neon.tech) → Create Project → Select PostgreSQL 16.
2. Copy the pooled connection string:
   ```
   postgresql://user:password@host/dbname?sslmode=require
   ```

### Phase 2 — Push Schema to Production DB

```bash
DATABASE_URL="your-production-connection-string" npx prisma db push --schema=database/prisma/schema.prisma
DATABASE_URL="your-production-connection-string" npx tsx database/prisma/seed.ts
```

### Phase 3 — Deploy Frontend on Vercel

1. Push your code to GitHub.
2. Import the repo at [vercel.com](https://vercel.com) → **Add New → Project**.
3. Set **Root Directory** to `frontend`.
4. Add all environment variables from your `.env` in the Vercel Environment Variables panel.
5. Click **Deploy**.

> **Vercel build command** (auto-migrates on deploy):
> ```json
> "build": "prisma generate && next build"
> ```

---

## Project Directory Structure

```
librr/
├── database/
│   └── prisma/
│       ├── schema.prisma            # Full data model (Book, Member, Loan, Hold, Otp)
│       ├── seed.ts                  # Seeds default admin account
│       ├── seed-books.ts            # Seeds library book catalogue
│       └── seed-copies.ts          # Seeds physical book copies
├── docs/
│   └── README.md                    # Documentation mirror
├── frontend/
│   ├── .env.example                 # Environment variable template
│   └── src/
│       ├── app/
│       │   ├── api/
│       │   │   ├── admin/           # Member management + book uploads (admin)
│       │   │   │   ├── books/       # Admin book CRUD
│       │   │   │   ├── loans/       # Admin loan management
│       │   │   │   ├── members/     # Member approval & management
│       │   │   │   └── upload-image/ # Supabase cover image upload
│       │   │   ├── auth/            # NextAuth [...nextauth] handler
│       │   │   ├── books/           # Public book search & detail
│       │   │   ├── dashboard/       # Member loans, holds, history
│       │   │   ├── holds/           # Place / cancel holds
│       │   │   ├── membership/      # New member registration
│       │   │   └── stats/           # Library statistics (cached 60s)
│       │   ├── admin/               # Admin console UI
│       │   ├── book/[id]/           # Book detail page
│       │   ├── dashboard/           # Member dashboard
│       │   ├── login/               # Sign-in page
│       │   ├── membership/          # Registration & rules pages
│       │   ├── search/              # Book search & filter page
│       │   ├── layout.tsx           # Root layout shell
│       │   └── page.tsx             # Homepage with 3D hero
│       ├── components/
│       │   ├── BookCarousel.tsx     # Featured books carousel
│       │   ├── Providers.tsx        # NextAuth + Theme context providers
│       │   ├── SidebarLogin.tsx     # Slide-in login sidebar
│       │   ├── ThemeContext.tsx     # Light/dark theme context
│       │   ├── hero/                # Three.js 3D floating book canvas
│       │   ├── layout/              # Navbar and Footer
│       │   ├── search/              # BookCard, SearchBar, CategoryFilter
│       │   └── ui/                  # Shared UI primitives
│       └── lib/
│           ├── auth.ts              # NextAuth options & credential provider
│           ├── db.ts                # Prisma Client singleton
│           ├── session.ts           # requireAdmin / requireMember / requireStaff guards
│           ├── supabase.ts          # Supabase client (public + admin)
│           ├── utils.ts             # Date helpers, fine calculators, ID generators
│           └── whatsapp.ts          # Twilio WhatsApp sender (with mock fallback)
├── .gitignore
├── LICENSE.txt
├── README.md
└── render.yaml                      # Render.com deployment config
```

---

## License

MIT — see [LICENSE.txt](./LICENSE.txt).
