# 🎉 Community Events Board

A full-stack community events platform built with Next.js, JavaScript, Prisma, and MySQL. Users can discover upcoming events, filter by category and city, save favourites, manage reminders, and personalize event cards.

## ✨ Features

### 🌍 Public Event Discovery
- Browse active upcoming community events.
- Search events by keyword.
- Filter events by category and city.
- Combine multiple filters.
- Browse events with pagination.
- View event details, dates, locations, prices, and images.

### 👤 User Accounts
- User registration and login.
- Authenticated user sessions.
- Personalized event favourites.
- My Feed based on preferred event categories.
- Save and remove event reminders.
- Personalized event card designs.

### 🎨 Event Card Designer
- Choose from three themes.
- Select stickers for event cards.
- Limit sticker selection to three per card.
- Save custom designs to the database.

### 🛠️ Admin Dashboard
- Admin authentication.
- Create and edit events.
- Manage event information.
- Set events as Active or Inactive.
- Protected admin routes and API endpoints.

## 🧰 Technology Stack

- **Frontend:** Next.js App Router, React, JavaScript, Tailwind CSS
- **Backend:** Next.js Route Handlers
- **Database:** MySQL
- **ORM:** Prisma
- **Authentication:** JWT and password hashing
- **Development Environment:** Node.js, npm, XAMPP

## ⚙️ Prerequisites

Install the following before running the project:

- Node.js
- npm
- MySQL or XAMPP
- Git

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/imdipthodurjoy/community-events-board.git
cd community-events-board
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the database

Start MySQL through XAMPP or your preferred MySQL service.

Create a database named:

```sql
CREATE DATABASE community_events_board;
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="mysql://root:@localhost:3306/community_events_board"
ADMIN_EMAIL="your-admin-email@example.com"
ADMIN_PASSWORD="replace-with-a-strong-password"
JWT_SECRET="replace-with-a-long-random-secret"
```

Update these values to match your local MySQL configuration. Use strong, unique credentials.

**Security:** Never commit `.env` or expose database credentials, passwords, or JWT secrets publicly.

### 5. Apply database migrations

```bash
npx prisma migrate deploy
```

Generate the Prisma Client if needed:

```bash
npx prisma generate
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Production Build

To verify the production build:

```bash
npm run build
```

To start the production server after building:

```bash
npm run start
```

## 🗄️ Database

The application uses MySQL with Prisma.

Database migrations are stored in:

```text
prisma/migrations/
```

The Prisma schema is located at:

```text
prisma/schema.prisma
```

## 🔐 Security Notes

- Keep environment variables private.
- Use strong admin credentials and a secure JWT secret.
- Do not expose secrets in source code, screenshots, or demo videos.
- Test protected routes before deployment.
- Configure production environment variables securely.


## 📌 Project Status

Core features implemented and locally tested.
Production build completed successfully.
Preparing the project for final assignment submission.
 

## 👨‍💻 Developer

**Diptho Durjoy**

GitHub: [@imdipthodurjoy](https://github.com/imdipthodurjoy)

## 📄 License

No license has been specified yet.