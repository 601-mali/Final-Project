# Community Q&A Platform API

## 1. Project Description

The Community Q&A Platform is a RESTful API built with Node.js and Express.js. It allows users to ask questions, provide answers, vote on questions and answers, and organize questions into categories.

The platform includes user authentication, email verification, password reset, role-based authorization, input validation, administrative functionality, and centralized error handling.

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
- Postman for API testing
- phpMyAdmin for database management

## 3. Project Structure

```text
Final Project/
├── database/
│   └── schema.sql
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

## 4. Installation and Setup

### Prerequisites

Ensure that the following are installed:

- Node.js
- MySQL or MariaDB
- XAMPP or another compatible database management environment
- Postman for testing API endpoints

### Installation Steps

1. Clone or download the project repository from GitHub.
2. Open the project folder in Visual Studio Code.
3. Open the terminal in the project directory.
4. Install the required dependencies:

   ```bash
   npm install
   ```

5. Start MySQL or MariaDB using XAMPP or your preferred database environment.
6. Open phpMyAdmin in your browser.
7. Import `database/schema.sql` to create the `community_qa` database and its tables. If importing through phpMyAdmin, select the Import tab and choose the schema file.
8. Create a `.env` file in the project root and configure the environment variables described in Section 5.
9. Start the API server:

   ```bash
   node src/app.js
   ```

10. Use Postman to test the API at:

    `http://localhost:3000`

The server uses the port configured in the environment variables. Ensure that the configured port matches the URL used for testing.

## 5. Environment Variables

Create a `.env` file in the root directory of the project. The following is an example configuration:

```env
PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=community_qa
DB_PORT=3306

JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=1d

EMAIL_USER=your_email_address
EMAIL_APP_PASSWORD=your_email_app_password
```

**Important:** The values above are examples. Use the environment variable names expected by your application's configuration files. Do not overwrite working settings without checking them first.

Keep your actual `.env` file private. Never commit email app passwords, JWT secrets, or other credentials to a public repository.

## 6. Authentication and Authorization

The API uses JSON Web Tokens (JWT) for authentication and bcrypt for password hashing.

Authentication and account features include:

- User registration.
- Email verification.
- User login and JWT generation.
- Forgot-password requests.
- Password reset.
- Logout with server-side token revocation.

Authorization features include:

- The `USER` role for standard platform operations.
- The `ADMIN` role for administrative operations.
- Middleware that checks authentication and role permissions before granting access to protected routes.

Protected endpoints require an appropriate authentication token.

Example authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Replace `YOUR_JWT_TOKEN` with a valid token obtained from the login endpoint.

## 7. API Endpoints

All endpoints use the base URL:

`http://localhost:3000`

### 7.1 Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in and obtain a JWT |
| GET | `/api/auth/verify-email/:token` | Verify an email address |
| POST | `/api/auth/forgot-password` | Request a password reset |
| POST | `/api/auth/reset-password` | Reset a password |
| POST | `/api/auth/logout` | Log out and revoke the current token |

### 7.2 Questions

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/questions` | Create a question |
| GET | `/api/questions` | Retrieve questions |
| GET | `/api/questions/:id` | Retrieve a specific question |
| PATCH | `/api/questions/:id` | Update a question |
| DELETE | `/api/questions/:id` | Soft-delete a question |

### 7.3 Answers

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/questions/:id/answers` | Add an answer to a question |
| GET | `/api/questions/:id/answers` | Retrieve answers for a question |
| PATCH | `/api/answers/:id` | Update an answer |
| DELETE | `/api/answers/:id` | Soft-delete an answer |

### 7.4 Votes

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/questions/:id/vote` | Vote on a question |
| DELETE | `/api/questions/:id/vote` | Remove a question vote |
| POST | `/api/answers/:id/vote` | Vote on an answer |
| DELETE | `/api/answers/:id/vote` | Remove an answer vote |

Vote types are `up` and `down`. The API implements database constraints to help prevent duplicate votes.

### 7.5 Categories

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/categories` | Retrieve active categories |
| POST | `/api/admin/categories` | Create a category (admin only) |
| PATCH | `/api/admin/categories/:id` | Update a category (admin only) |
| DELETE | `/api/admin/categories/:id` | Deactivate a category (admin only) |

### 7.6 Administration

Administrative endpoints require authentication and the `ADMIN` role.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/users` | List users |
| PATCH | `/api/admin/users/:id/role` | Change a user's role |
| DELETE | `/api/admin/users/:id` | Deactivate a user |
| PATCH | `/api/admin/users/:id/reactivate` | Reactivate a user |
| DELETE | `/api/admin/questions/:id` | Delete a question through administration |
| DELETE | `/api/admin/answers/:id` | Delete an answer through administration |

## 8. Database Design

The application uses a relational database named `community_qa`.

The database contains six tables:

| Table | Purpose |
|---|---|
| `users` | Stores user accounts, credentials, roles, and account status |
| `categories` | Stores question categories |
| `questions` | Stores questions and their category and author relationships |
| `answers` | Stores answers associated with questions and users |
| `votes` | Stores votes on questions and answers |
| `revoked_tokens` | Stores revoked authentication tokens |

Foreign keys establish relationships between related records and help maintain referential integrity.

The schema file is located at `database/schema.sql`. It contains the table definitions and relationships needed to recreate the database structure. It does not contain the existing application's test records.

## 9. Validation and Error Handling

The API uses `express-validator` to validate incoming request data.

Examples of validation requirements include:

- Question titles must contain between 10 and 150 characters.
- Question content must contain between 20 and 5,000 characters.
- Answer content must contain between 10 and 2,000 characters.
- Vote types must be `up` or `down`.
- Identifiers and other request fields must satisfy their applicable validation rules.

The application uses middleware for request validation, authentication, authorization, handling unknown routes, and centralized error handling.

### Common HTTP Status Codes

| Status Code | Meaning |
|---|---|
| `200 OK` | Request completed successfully |
| `201 Created` | Resource created successfully |
| `400 Bad Request` | Request contains invalid input |
| `401 Unauthorized` | Authentication is missing or invalid |
| `403 Forbidden` | User lacks the required permission |
| `404 Not Found` | Requested resource or route was not found |
| `409 Conflict` | Duplicate data or conflicting operation |
| `500 Internal Server Error` | Unexpected server-side error |

## 10. Security Features

The application incorporates the following security measures:

- Password hashing with bcrypt.
- JWT-based authentication.
- Role-based authorization.
- Request validation with express-validator.
- Database constraints to help prevent duplicate votes.
- Ownership checks for supported question and answer operations.
- Server-side token revocation during logout.
- Soft deletion for supported resources.
- Environment variables for sensitive configuration.
- A `.gitignore` file intended to exclude `.env` and `node_modules`.

Sensitive credentials and private configuration must not be uploaded to the public repository.

## 11. Testing with Postman

The API can be tested using Postman.

Recommended testing sequence:

1. Start the database service.
2. Start the Node.js application.
3. Send a GET request to `/api/health` to check whether the API is responding.
4. Register a user through `/api/auth/register`.
5. Verify the user's email address.
6. Log in through `/api/auth/login` and copy the returned JWT.
7. Use the token as a Bearer Token when testing protected endpoints.
8. Create or retrieve categories as needed.
9. Create questions and add answers.
10. Test voting, updating, and deletion operations.
11. Test invalid inputs and requests made without the required permissions.
12. Test administrative endpoints using an account with the `ADMIN` role.

For protected endpoints, configure Postman's Authorization tab to use **Bearer Token** and enter the JWT.

A revoked token should no longer authorize requests to protected endpoints.

## 12. Health Check

The application provides a health-check endpoint:

```http
GET /api/health
```

Full URL:

`http://localhost:3000/api/health`

This endpoint can be used to confirm that the API is responding and to check the database connection as implemented by the application.

## 13. Running the Project

After completing the installation and configuration steps, run:

```bash
node src/app.js
```

Keep the terminal open while testing the API. If the server fails to start, check that the database service is running, the `.env` file is correctly configured, the required dependencies are installed, and the configured port is available.

## 14. Conclusion

The Community Q&A Platform API demonstrates the implementation of a backend application using Node.js, Express.js, and a relational database. It incorporates RESTful endpoints, CRUD operations, authentication, authorization, email verification, password recovery, validation, relational database constraints, and administrative features.

The project provides a foundation for a community-driven question-and-answer application in which users can interact with questions, answers, categories, and votes through a structured API.
