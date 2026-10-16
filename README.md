# Community Q&A Platform API

## 1. Project Description

The Community Q&A Platform is a RESTful API that allows users to ask questions, provide answers, vote on questions and answers, and organize questions into categories. It includes authentication, email verification, password reset, role-based access control, and administrative features.

## 2. Technologies Used

- Node.js
- Express.js
- MySQL / MariaDB
- mysql2
- bcrypt
- JSON Web Token (JWT)
- express-validator
- Nodemailer
- dotenv

## 3. Project Structure

```text
Final Project/
├── src/
│   ├── configs/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── questionController.js
│   │   ├── answerController.js
│   │   ├── voteController.js
│   │   ├── categoryController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   ├── validate.js
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── answerRoutes.js
│   │   ├── voteRoutes.js
│   │   ├── categoryRoutes.js
│   │   └── adminRoutes.js
│   └── app.js
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## 4. Installation

Ensure Node.js and MySQL or MariaDB are installed.

1. Open a terminal in the project directory.
2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a database named `community_qa` in MySQL or phpMyAdmin.
4. Create the required database tables and relationships.
5. Configure the environment variables in the `.env` file.
6. Start the server:

   ```bash
   node src/app.js
   ```

The API uses port `3000` by default if configured in the environment.

## 5. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=community_qa
DB_PORT=3306
JWT_SECRET=MY_private_jwt_secret
JWT_EXPIRES_IN=1d
EMAIL_USER=your_email_address
EMAIL_APP_PASSWORD=MY_email_app_password
```



## 6. Authentication and Authorization

The API uses JSON Web Tokens (JWT) to authenticate users and bcrypt to hash passwords.

- Users must register and verify their email addresses.
- Registered users can log in to receive an authentication token.
- Protected endpoints require a valid Bearer token.
- Users can request a password reset through email.
- Logout invalidates the current token on the server.
- The `USER` role provides standard platform access.
- The `ADMIN` role provides access to administrative endpoints.

Example authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## 7. API Endpoints

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/verify-email/:token` | Verify email |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/logout` | Log out and invalidate token |

### Questions

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/questions` | Create a question |
| GET | `/api/questions` | List questions |
| GET | `/api/questions/:id` | Get a question |
| PATCH | `/api/questions/:id` | Update a question |
| DELETE | `/api/questions/:id` | Soft-delete a question |

### Answers

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/questions/:id/answers` | Add an answer |
| GET | `/api/questions/:id/answers` | List answers |
| PATCH | `/api/answers/:id` | Update an answer |
| DELETE | `/api/answers/:id` | Soft-delete an answer |

### Votes

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/questions/:id/vote` | Vote on a question |
| DELETE | `/api/questions/:id/vote` | Remove a question vote |
| POST | `/api/answers/:id/vote` | Vote on an answer |
| DELETE | `/api/answers/:id/vote` | Remove an answer vote |

### Categories

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/categories` | List active categories |

### Administration

All administrative endpoints require an authenticated user with the `ADMIN` role.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/users` | List users |
| PATCH | `/api/admin/users/:id/role` | Change a user's role |
| DELETE | `/api/admin/users/:id` | Deactivate a user |
| PATCH | `/api/admin/users/:id/reactivate` | Reactivate a user |
| DELETE | `/api/admin/questions/:id` | Admin question deletion |
| DELETE | `/api/admin/answers/:id` | Admin answer deletion |
| POST | `/api/admin/categories` | Create a category |
| PATCH | `/api/admin/categories/:id` | Update a category |
| DELETE | `/api/admin/categories/:id` | Deactivate a category |

## 8. Validation and Error Handling

The API uses `express-validator` to validate request data.

Examples of validation requirements:

- Question titles must contain 10–150 characters.
- Question content must contain 20–5000 characters.
- Answer content must contain 10–2000 characters.
- Vote types must be `up` or `down`.
- Receiver or user identifiers must be valid for their relevant endpoints.

The application uses centralized error-handling and not-found middleware to return appropriate HTTP status codes.

Common status codes include:

- `200 OK` — Request succeeded.
- `201 Created` — Resource created.
- `400 Bad Request` — Invalid input.
- `401 Unauthorized` — Authentication required or invalid.
- `403 Forbidden` — Insufficient permissions.
- `404 Not Found` — Resource or route not found.
- `409 Conflict` — Duplicate resource or conflicting operation.
- `500 Internal Server Error` — Unexpected server error.

## 9. Security Features

- Password hashing using bcrypt.
- JWT-based authentication.
- Role-based authorization.
- Request validation.
- Prevention of duplicate votes.
- Ownership checks for questions and answers.
- Server-side token revocation on logout.
- Soft deletion for supported resources.
- Environment variables for sensitive configuration.
- `.gitignore` excludes `.env` and `node_modules`.

## 10. Testing

API endpoints can be tested with Postman.

1. Start the Node.js server.
2. Send requests to `http://localhost:3000`.
3. Register and verify a user.
4. Log in and copy the JWT.
5. Use Bearer Token authorization for protected requests.
6. Test successful requests, invalid inputs, unauthorized access, and missing resources.

## 11. Health Check

Send a GET request to:

```http
GET /api/health
```

This endpoint can be used to check whether the API server is responding.
