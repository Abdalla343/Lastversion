# Node.js Authentication API

A simple authentication system built with Node.js, Express, Sequelize ORM, and MySQL.

## Features

- User registration
- User login with JWT authentication
- Protected routes using JWT middleware
- Password hashing with bcrypt

## Project Structure

```
project/
├── config/
│   └── database.js
├── models/
│   └── User.js
├── routes/
│   └── authRoutes.js
├── middleware/
│   └── authMiddleware.js
├── .env
├── package.json
├── server.js
└── README.md
```

## Prerequisites

- Node.js 20 or higher
- MySQL server

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd <project-folder>
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory with the following variables:

```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASS=your_mysql_password
DB_NAME=auth_db
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

4. Create (or recreate) the MySQL database automatically:

```bash
npm run setup-db
```

If you prefer to do it manually, run:

```sql
CREATE DATABASE auth_db;
```

5. (Optional) Seed an initial admin user:

```bash
npm run seed-admin
```

### Manual SQL import

If you prefer working directly with SQL, you can recreate the schema with the script in `database/schema.sql`:

```bash
mysql -u <user> -p < database/schema.sql
```

## Running the Application

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm start
```

## API Endpoints

### Register a new user

```
POST /api/auth/register
```

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login

```
POST /api/auth/login
```

Request body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get user profile (Protected route)

```
GET /api/auth/profile
```

Headers:

```
Authorization: Bearer <your-jwt-token>
```

## License

MIT