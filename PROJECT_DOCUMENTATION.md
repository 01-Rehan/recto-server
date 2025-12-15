# Recto Server Documentation

## Project Overview

Recto is a social book-tracking application. It allows users to search for books, keep track of what they're reading, and connect with other readers. The backend server provides a RESTful API for all the application's functionality.

## Features

*   **User Authentication:** Users can sign up, sign in, and manage their accounts. Authentication is handled using JWT (JSON Web Tokens) and also supports Google OAuth.
*   **Book Management:** Users can search for books, add them to their "to-be-read" (TBR) list, and track their reading status.
*   **Social Connections:** Users can follow and be followed by other users.
*   **Book Reviews:** Users can write, update, and delete reviews for books.
*   **Profile Management:** Users can update their profile information, including their avatar and banner images.

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### User Routes (`/user`)

| Method | Path                       | Description                               | Protected |
| ------ | -------------------------- | ----------------------------------------- | --------- |
| POST   | `/signup`                  | Register a new user.                      | No        |
| POST   | `/signup-verify`           | Verify a new user's OTP.                  | No        |
| POST   | `/signin`                  | Sign in an existing user.                 | No        |
| POST   | `/refresh-accesstoken`     | Refresh an expired access token.          | No        |
| GET    | `/google`                  | Redirect to Google for authentication.    | No        |
| GET    | `/google/callback`         | Callback for Google authentication.       | No        |
| POST   | `/password-otp`            | Send an OTP to reset a forgotten password.| No        |
| POST   | `/password-otp-verify`     | Verify the password reset OTP.            | No        |
| POST   | `/new-password`            | Set a new password after verification.    | No        |
| POST   | `/change-password`         | Change the current user's password.       | Yes       |
| POST   | `/logout`                  | Log out the current user.                 | Yes       |
| POST   | `/update-profile`          | Update the current user's profile.        | Yes       |
| POST   | `/update-email`            | Update the current user's email.          | Yes       |
| POST   | `/update-profileimage`     | Update the user's avatar and cover image. | Yes       |
| GET    | `/check`                   | Check for username availability.          | No        |
| GET    | `/whoami`                  | Get the current user's information.       | Yes       |

### Search Routes (`/search`)

| Method | Path    | Description              | Protected |
| ------ | ------- | ------------------------ | --------- |
| GET    | `/users`| Search for users.        | No        |
| GET    | `/user` | Get a specific user.     | No        |

### Book Routes (`/books`)

| Method | Path                       | Description                      | Protected |
| ------ | -------------------------- | -------------------------------- | --------- |
| POST   | `/getbook`                 | Get book information.            | No        |
| POST   | `/tbrbook`                 | Add a book to the TBR list.      | Yes       |
| DELETE | `/remove-tbrbook`          | Remove a book from the TBR list. | Yes       |
| GET    | `/fetch-user-books`        | Fetch the user's reading status. | Yes       |
| POST   | `/reviews/add`             | Add a review for a book.         | Yes       |
| PATCH  | `/reviews/:reviewId`       | Update a review.                 | Yes       |
| DELETE | `/reviews/:reviewId`       | Delete a review.                 | Yes       |
| POST   | `/reviews/:reviewId/like`  | Like a review.                   | Yes       |

### Connection Routes (`/connection`)

| Method | Path             | Description                   | Protected |
| ------ | ---------------- | ----------------------------- | --------- |
| POST   | `/follow/:userId`| Follow a user.                | Yes       |
| POST   | `/unfollow/:userId`| Unfollow a user.              | Yes       |
| GET    | `/followers`     | Get the current user's followers. | Yes       |
| GET    | `/following`     | Get the users the current user is following.| Yes       |

## Database Models

The application uses MongoDB and Mongoose for data modeling.

*   **`User`**: Stores user information, including username, email, password, profile details, and social connections.
*   **`Book`**: Stores information about books.
*   **`AddedBook`**: Represents a book that a user has added to their collection, including its reading status.
*   **`BookReview`**: Stores user reviews for books.
*   **`Follower`**: Represents the relationship between a user and their followers.
*   **`OTP`**: Stores One-Time Passwords for user verification.
*   **`Blog`**: Stores blog posts.
*   **`BlogComment`**: Stores comments on blog posts.
*   **`ReviewLike`**: Represents a "like" on a book review.

## Code Structure

The source code is organized into the following directories:

*   **`src/`**: The main application source code.
    *   **`app.ts`**: The main Express application setup file.
    *   **`server.ts`**: The entry point for starting the server.
    *   **`constant.ts`**: Holds application-wide constants.
    *   **`controller/`**: Contains the route handlers (controllers) that process incoming requests.
    *   **`db/`**: Includes the database connection logic.
    *   **`middlewares/`**: Contains custom Express middleware, such as for authentication and file uploads.
    *   **`models/`**: Defines the Mongoose schemas and models for the database.
    *   **`routes/`**: Defines the API routes and maps them to controllers.
    *   **`services/`**: Contains business logic that is separated from the controllers.
    *   **`types/`**: Holds custom TypeScript type definitions.
    *   **`utils/`**: Contains utility functions and classes used throughout the application.

## Utilities

*   **`ApiError.ts`**: A custom error class for handling API errors consistently.
*   **`ApiResponse.ts`**: A custom response class for sending consistent API responses.
*   **`asyncHandler.ts`**: A wrapper function to handle errors in asynchronous route handlers.
*   **`cloudinary.ts`**: A utility for uploading files to Cloudinary.
*   **`OpenLibraryDataCleaner.ts`**: A utility to clean and process data from the OpenLibrary API.
*   **`OTP.ts`**: A utility for generating and verifying One-Time Passwords.
*   **`UserNameChecker.ts`**: A utility to check for the availability of a username.
