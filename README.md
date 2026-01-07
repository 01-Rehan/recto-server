# Recto Server

A TypeScript/Express REST API powering Recto — a social, book-tracking application where readers discover books, maintain lists, publish reviews, and connect with other readers.

---

## Overview

- Robust REST API built with Express 5, TypeScript, and MongoDB (Mongoose).
- Authentication via JWT with refresh-token rotation; Google OAuth supported.
- Zod-powered input validation, consistent error/response wrappers, and structured middlewares.
- Strong rate limiting policies and CORS configuration for safe public access.
- Features: Books + TBR lists, reviews, blogs, user profiles, connections, and search.

Base URL prefix: `/api/v1` (see [src/app.ts](src/app.ts)).

---

## Tech Stack

- Runtime: Node.js + Express 5
- Language: TypeScript
- Database: MongoDB via Mongoose
- Validation: Zod
- Auth: JWT (access/refresh), Google OAuth
- File uploads: Multer + Cloudinary
- Rate limiting: `express-rate-limit`
- Formatting/Linting: Prettier + ESLint

---

## Architecture

- Entry and App
  - Server bootstrap in [src/server.ts](src/server.ts) with `dotenv` and DB connect.
  - Express configuration and route mounting in [src/app.ts](src/app.ts).
- Routing
  - Feature-first routers in [src/routes](src/routes) mapping to controller actions.
- Controllers
  - Request orchestration lives in [src/controller](src/controller), delegating to services and utilities.
- Services
  - Business logic and integration calls in [src/services](src/services).
- Models
  - Mongoose schemas in [src/models](src/models) — user, book, lists, reviews, blogs, followers, OTP.
- Middlewares
  - Auth (`VerifyJWT`, `VerifyRole`), validation, rate limiting, and uploads in [src/middlewares](src/middlewares).
- Utilities
  - Error/response wrappers, async handler, Cloudinary helpers, OpenLibrary data cleaner in [src/utils](src/utils).

---

## Folder Structure

```
src/
  app.ts               # Express app setup and router mounting
  server.ts            # Server entry, env, and DB connect
  constant.ts          # App constants (DB name, roles)
  controller/          # Route controllers
  db/connection.ts     # Mongoose connection
  middlewares/         # Auth, validation, rate-limit, multer
  models/              # Mongoose schemas/models
  routes/              # Routers per feature
  services/            # Business logic; grouped by domain
  types/               # Custom TypeScript types
  utils/               # Helpers: ApiError/ApiResponse, async, Cloudinary, etc.
```

---

## Configuration & Environment

Required environment variables (names inferred from code):

- Server/CORS
  - `PORT` — server port (default 3000)
  - `NODE_ENV` — `development` or `production`
  - `CLIENT_URL` — allowed CORS origin (used in [src/app.ts](src/app.ts))
  - `CLIENT_URL_LOCAL` — frontend local URL used after Google auth callback
- Database
  - `MONGODB_URL` — base connection string; DB name appended from [src/constant.ts](src/constant.ts)
- Auth (JWT)
  - `ACCESS_TOKEN_SECRET` — secret for access tokens
  - `ACCESS_TOKEN_EXPIRE` — e.g., `15m`
  - `REFRESH_TOKEN_SECRET` — secret for refresh tokens
  - `REFRESH_TOKEN_EXPIRE` — e.g., `7d`
- Google OAuth
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL` — backend callback URL
- Cloudinary
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

---

## Setup & Commands

1. Install dependencies

```bash
npm install
```

2. Create `.env` with the required keys above.
3. Start in development

```bash
npm run dev
```

4. Build and run production

```bash
npm run build
npm start
```

5. Lint and format (rules relaxed in [eslint.config.js](eslint.config.js))

```bash
npm run lint
npm run lint:fix
npm run format
```

---

## Middlewares

- Auth: [src/middlewares/auth.middleware.ts](src/middlewares/auth.middleware.ts)
  - `VerifyJWT` extracts token from cookies (`accessToken`) or `Authorization: Bearer` header. Sets `req.user` with `_id`, `role`, `isVerified`.
  - `VerifyRole(roles)` guards controller actions by role.
- Validation: [src/middlewares/validate.middleware.ts](src/middlewares/validate.middleware.ts)
  - Zod-based; parses only expected sections (`body`, `query`, `params`, etc.). Responds `400` with structured details on error.
- Rate Limiting: [src/middlewares/rateLimiter.middleware.ts](src/middlewares/rateLimiter.middleware.ts)
  - `globalLimiter` — applied app-wide.
  - `authLimiter` — strict for signup/signin flows.
  - `apiLimiter` — moderate for public endpoints.
  - `sensitiveOpLimiter` — strict for password/OTP operations.
- Uploads: Multer config in [src/middlewares/multer.middleware.ts](src/middlewares/multer.middleware.ts); Cloudinary helpers in [src/utils/cloudinary.ts](src/utils/cloudinary.ts).

---

## Error & Response Model

- Errors: [src/utils/ApiError.ts](src/utils/ApiError.ts)
  - Consistent shape with `statusCode`, `message`, `errors`, `success=false`.
- Responses: [src/utils/ApiResponse.ts](src/utils/ApiResponse.ts)
  - Unified success payloads; `success` inferred from `statusCode`.
- Async handling: [src/utils/asyncHandler.ts](src/utils/asyncHandler.ts) wraps controllers to surface errors.

---

## Authentication & Authorization

- Sign-in sets `accessToken` and `refreshToken` as httpOnly cookies (see [src/controller/user.controller.ts](src/controller/user.controller.ts)).
- `VerifyJWT` reads cookies first, then `Authorization` header; returns 401 on expired/invalid tokens.
- Token generation on the `User` model methods (see [src/models/user.model.ts](src/models/user.model.ts)): `generateAccessToken()`, `generateRefreshToken()` with env-driven expiry.
- Refresh flow handled in [src/services/user/JWT.service.ts](src/services/user/JWT.service.ts).
- Google OAuth redirect and callback in [src/services/user/googleAuth.service.ts](src/services/user/googleAuth.service.ts).

---

## Data Models (Highlights)

- User: [src/models/user.model.ts](src/models/user.model.ts)
  - Fields: `userName`, `fullName`, `email`, `googleId`, `hashedPassword`, `bio`, `avatarImage`, `coverImage`, counters (`followersCount`, `followingCount`, `postsCount`), `refreshToken`, `role`, `isVerified`.
  - Index: `userName` text search.
  - Hooks: hash password on save; methods for password compare and token generation.
- Books & Reviews
  - Books: [src/models/books.model.ts](src/models/books.model.ts)
  - Added books (TBR/status): [src/models/addedBook.model.ts](src/models/addedBook.model.ts)
  - Reviews: [src/models/bookReview.model.ts](src/models/bookReview.model.ts) and likes in [src/models/reviewLike.model.ts](src/models/reviewLike.model.ts)
- Lists: [src/models/bookLists.model.ts](src/models/bookLists.model.ts)
- Social connections: [src/models/follower.model.ts](src/models/follower.model.ts)
- Blogs & comments: [src/models/blog.model.ts](src/models/blog.model.ts), [src/models/blog.comment.model.ts](src/models/blog.comment.model.ts)
- OTP: [src/models/otp.model.ts](src/models/otp.model.ts)

---

## API Overview

All routes are mounted under `/api/v1` (see [src/app.ts](src/app.ts)). Tables below summarize endpoints, auth, and notes. Refer to the router files for validation and middleware.

### Users — `/api/v1/user` ([src/routes/user.route.ts](src/routes/user.route.ts))

| Method | Path                   | Auth      | Description                                 |
| ------ | ---------------------- | --------- | ------------------------------------------- |
| POST   | /signup                | Public    | Start email signup (OTP).                   |
| POST   | /signup-verify         | Public    | Verify OTP and create user.                 |
| POST   | /signin                | Public    | Login; sets httpOnly access/refresh tokens. |
| POST   | /refresh-accesstoken   | Public    | Issue new access/refresh tokens.            |
| GET    | /google                | Public    | Redirect to Google OAuth.                   |
| GET    | /google/callback       | Public    | Google OAuth callback.                      |
| POST   | /password-otp          | Public    | Request password reset OTP.                 |
| POST   | /password-otp-verify   | Public    | Verify password-reset OTP.                  |
| POST   | /new-password          | Public    | Set new password after OTP verification.    |
| GET    | /check?userName=...    | Public    | Check username availability.                 |
| POST   | /change-password       | VerifyJWT | Change password with current password.      |
| POST   | /logout                | VerifyJWT | Clear refresh and access tokens.            |
| PATCH  | /update-profile        | VerifyJWT | Update profile: `fullName`, `bio`, `userName`. |
| PATCH  | /update-email          | VerifyJWT | Placeholder (501) for email change.         |
| PATCH  | /update-profileimage   | VerifyJWT | Upload avatar/cover via Multer + Cloudinary.|
| GET    | /whoami                | VerifyJWT | Current user details.                        |

### Search — `/api/v1/search` ([src/routes/search.route.ts](src/routes/search.route.ts))

| Method | Path    | Auth   | Description                       |
| ------ | ------- | ------ | --------------------------------- |
| GET    | /users  | Public | Search users.                     |
| GET    | /user   | Public | Get specific user by id/handle.   |

### Books — `/api/v1/books` ([src/routes/book.route.ts](src/routes/book.route.ts))

| Method | Path                        | Auth      | Description                                 |
| ------ | --------------------------- | --------- | ------------------------------------------- |
| POST   | /getbook                    | Public    | Fetch book via OpenLibrary query.           |
| GET    | /purchase-links/:bookId     | Public    | Retrieve affiliate purchase links.          |
| POST   | /tbrbook                    | VerifyJWT | Add book to TBR/status.                     |
| DELETE | /tbrbook/:tbrId             | VerifyJWT | Remove from TBR.                            |
| GET    | /fetch-user-books           | VerifyJWT | List user books by status.                  |
| POST   | /reviews/add                | VerifyJWT | Add review for a book.                      |
| GET    | /reviews/:bookId            | Public    | Get all reviews for a book.                 |
| PATCH  | /reviews/:reviewId          | VerifyJWT | Update review.                              |
| DELETE | /reviews/:reviewId          | VerifyJWT | Remove review.                              |

### Lists — `/api/v1/lists` ([src/routes/list.route.ts](src/routes/list.route.ts))

| Method | Path                     | Auth      | Description                         |
| ------ | ------------------------ | --------- | ----------------------------------- |
| GET    | /public                  | Public    | Fetch public lists.                 |
| GET    | /:listId                 | Public    | Get a single list (public).         |
| POST   | /                        | VerifyJWT | Create a list.                      |
| GET    | /user/my-lists           | VerifyJWT | Get my lists.                       |
| PATCH  | /:listId                 | VerifyJWT | Update a list.                      |
| DELETE | /:listId                 | VerifyJWT | Delete a list.                      |
| POST   | /:listId/books           | VerifyJWT | Add a book to a list.               |
| DELETE | /:listId/books/:bookId   | VerifyJWT | Remove a book from a list.          |
| PATCH  | /:listId/reorder         | VerifyJWT | Reorder books in a list.            |

### Connections — `/api/v1/connection` ([src/routes/connection.route.ts](src/routes/connection.route.ts))

| Method | Path               | Auth      | Description                                 |
| ------ | ------------------ | --------- | ------------------------------------------- |
| GET    | /followers         | Public    | Followers of a user (by query).             |
| GET    | /following         | Public    | Following of a user (by query).             |
| POST   | /follow/:userId    | VerifyJWT | Follow a user.                              |
| DELETE | /unfollow/:userId  | VerifyJWT | Unfollow a user.                            |
| GET    | /myfollowers       | VerifyJWT | My followers.                               |
| GET    | /myfollowings      | VerifyJWT | My followings.                              |

### Blogs — `/api/v1/blogs` ([src/routes/blog.route.ts](src/routes/blog.route.ts))

| Method | Path         | Auth      | Description         |
| ------ | ------------ | --------- | ------------------- |
| GET    | /            | Public    | List blogs.         |
| GET    | /:slug       | Public    | Blog by slug.       |
| POST   | /            | VerifyJWT | Create blog.        |
| GET    | /user/my-blogs| VerifyJWT | My blogs.           |
| PATCH  | /:id         | VerifyJWT | Update blog.        |
| DELETE | /:id         | VerifyJWT | Delete blog.        |

---

## Validation & Schemas

- Zod schemas per feature in [src/validation](src/validation): `user.schema.ts`, `book.schema.ts`, `bookReview.schema.ts`, `list.schema.ts`, `search.schema.ts`, `blog.schema.ts`, `connection.schema.ts`.
- All routes apply `validate(schema)` middleware before controller execution.

---

## File Uploads & Media

- Multer handles `avatarImage` and `coverImage` via `upload.fields(...)` in user routes.
- Cloudinary upload/delete helpers in [src/utils/cloudinary.ts](src/utils/cloudinary.ts).
- Errors during upload produce a `500` via `ApiError` with safe temp file cleanup.

---

## Rate Limiting

- Global: 100 req / 15 min per IP.
- Auth endpoints: 5 req / 15 min, counts only failures.
- General API: 30 req / minute.
- Sensitive ops (password reset): 3 req / hour.

See [src/middlewares/rateLimiter.middleware.ts](src/middlewares/rateLimiter.middleware.ts).

---

## Conventions

- JSON responses always wrap in `ApiResponse` with `statusCode`, `data`, `message`, `success`.
- Errors raised as `ApiError` for consistency.
- Protected routes require `VerifyJWT`; read token from cookies or header.
- Controller logic is thin; move business rules into services.

---

## Development Notes

- Pass `CLIENT_URL` to allow CORS.
- Mongo URL should be a base (e.g., `mongodb+srv://...`); DB name appended from [src/constant.ts](src/constant.ts).
- Access/refresh token expirations are driven by env to ease rotation.
- Username search index and availability checks exist on the `User` model and controller.

---

## Quick Examples

- Refresh Access Token

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<your_refresh_token>"}' \
  http://localhost:3000/api/v1/user/refresh-accesstoken
```

- Add Review (requires auth)

```bash
curl -X POST \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"bookId":"<id>","rating":5,"comment":"Loved it"}' \
  http://localhost:3000/api/v1/books/reviews/add
```

---

## Scripts

- `npm run dev` — nodemon + ts-node development server
- `npm run build` — compile TypeScript to `dist`
- `npm start` — run compiled server
- `npm run lint` / `npm run lint:fix` — lint codebase
- `npm run format` — format using Prettier

---

## License & Author

- Author: Rehan Halai
- License: ISC (see `package.json`)
