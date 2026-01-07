# BookLists API Documentation

## Overview

The BookLists feature allows authenticated users to create, manage, and organize custom book lists. Users can only perform operations on their own lists, ensuring proper authorization and privacy.

## Base URL

```
/api/v1/lists
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

---

## Endpoints

### 1. Create a List

**POST** `/api/v1/lists/`

Creates a new book list for the authenticated user.

**Authentication Required:** Yes

**Request Body:**

```json
{
  "name": "2026 Reading Challenge",
  "description": "Books I plan to finish this year.",
  "is_public": true
}
```

**Response (201):**

```json
{
  "statusCode": 201,
  "data": {
    "_id": "list_123",
    "user_id": "user_789",
    "name": "2026 Reading Challenge",
    "description": "Books I plan to finish this year.",
    "is_public": true,
    "book_count": 0,
    "items": [],
    "createdAt": "2026-01-07T12:00:00Z",
    "updatedAt": "2026-01-07T12:00:00Z"
  },
  "message": "List created successfully",
  "success": true
}
```

---

### 2. Get User's Lists

**GET** `/api/v1/lists/user/my-lists`

Retrieves all lists created by the authenticated user.

**Authentication Required:** Yes

**Response (200):**

```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "list_123",
      "user_id": "user_789",
      "name": "2026 Reading Challenge",
      "description": "Books I plan to finish this year.",
      "is_public": true,
      "book_count": 2,
      "items": [...],
      "createdAt": "2026-01-07T12:00:00Z",
      "updatedAt": "2026-01-07T12:00:00Z"
    }
  ],
  "message": "Lists fetched successfully",
  "success": true
}
```

---

### 3. Get a Single List

**GET** `/api/v1/lists/:listId`

Retrieves a specific list by ID. Public lists can be viewed by anyone, private lists only by the owner.

**Authentication Required:** Optional (required for private lists)

**URL Parameters:**

- `listId` (string) - The ID of the list

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "list_123",
    "user_id": "user_789",
    "name": "2026 Reading Challenge",
    "description": "Books I plan to finish this year.",
    "is_public": true,
    "book_count": 2,
    "items": [
      {
        "book_id": "b1",
        "title": "Project Hail Mary",
        "author": "Andy Weir",
        "added_at": "2026-01-01T12:00:00Z",
        "position": 1
      }
    ],
    "createdAt": "2026-01-07T12:00:00Z",
    "updatedAt": "2026-01-07T12:00:00Z"
  },
  "message": "List fetched successfully",
  "success": true
}
```

---

### 4. Update a List

**PATCH** `/api/v1/lists/:listId`

Updates an existing list. Only the list owner can update their lists.

**Authentication Required:** Yes

**URL Parameters:**

- `listId` (string) - The ID of the list

**Request Body:**

```json
{
  "name": "Updated List Name",
  "description": "Updated description",
  "is_public": false
}
```

_Note: All fields are optional_

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "list_123",
    "user_id": "user_789",
    "name": "Updated List Name",
    "description": "Updated description",
    "is_public": false,
    "book_count": 2,
    "items": [...],
    "createdAt": "2026-01-07T12:00:00Z",
    "updatedAt": "2026-01-07T13:00:00Z"
  },
  "message": "List updated successfully",
  "success": true
}
```

---

### 5. Delete a List

**DELETE** `/api/v1/lists/:listId`

Deletes a list. Only the list owner can delete their lists.

**Authentication Required:** Yes

**URL Parameters:**

- `listId` (string) - The ID of the list

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "message": "List deleted successfully"
  },
  "message": "List deleted successfully",
  "success": true
}
```

---

### 6. Add a Book to a List

**POST** `/api/v1/lists/:listId/books`

Adds a book to a specific list. Only the list owner can add books.

**Authentication Required:** Yes

**URL Parameters:**

- `listId` (string) - The ID of the list

**Request Body:**

```json
{
  "book_id": "b1"
}
```

_Note: Title and author are auto-fetched from the stored book record._

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "list_123",
    "user_id": "user_789",
    "name": "2026 Reading Challenge",
    "book_count": 3,
    "items": [
      {
        "book_id": "b1",
        "title": "Project Hail Mary",
        "author": "Andy Weir",
        "added_at": "2026-01-07T12:00:00Z",
        "position": 1
      }
    ],
    ...
  },
  "message": "Book added to list successfully",
  "success": true
}
```

---

### 7. Remove a Book from a List

**DELETE** `/api/v1/lists/:listId/books/:bookId`

Removes a book from a list. Only the list owner can remove books.

**Authentication Required:** Yes

**URL Parameters:**

- `listId` (string) - The ID of the list
- `bookId` (string) - The ID of the book to remove

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "list_123",
    "user_id": "user_789",
    "name": "2026 Reading Challenge",
    "book_count": 2,
    "items": [...],
    ...
  },
  "message": "Book removed from list successfully",
  "success": true
}
```

---

### 8. Reorder Books in a List

**PATCH** `/api/v1/lists/:listId/reorder`

Reorders books within a list. Only the list owner can reorder books.

**Authentication Required:** Yes

**URL Parameters:**

- `listId` (string) - The ID of the list

**Request Body:**

```json
{
  "bookIds": ["b2", "b1", "b3"]
}
```

_Note: Must include ALL book IDs from the list in the desired order_

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "list_123",
    "user_id": "user_789",
    "name": "2026 Reading Challenge",
    "book_count": 3,
    "items": [
      {
        "book_id": "b2",
        "title": "Dune",
        "author": "Frank Herbert",
        "added_at": "2026-01-05T09:30:00Z",
        "position": 1
      },
      {
        "book_id": "b1",
        "title": "Project Hail Mary",
        "author": "Andy Weir",
        "added_at": "2026-01-01T12:00:00Z",
        "position": 2
      }
    ],
    ...
  },
  "message": "Books reordered successfully",
  "success": true
}
```

---

### 9. Get Public Lists

**GET** `/api/v1/lists/public`

Retrieves all public lists for discovery. Includes pagination.

**Authentication Required:** No

**Query Parameters:**

- `limit` (number, optional) - Number of lists to return (default: 20)
- `skip` (number, optional) - Number of lists to skip (default: 0)

**Example:** `/api/v1/lists/public?limit=10&skip=0`

**Response (200):**

```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "list_123",
      "user_id": {
        "_id": "user_789",
        "userName": "bookworm",
        "fullName": "John Doe",
        "avatarImage": "https://..."
      },
      "name": "2026 Reading Challenge",
      "description": "Books I plan to finish this year.",
      "is_public": true,
      "book_count": 2,
      "items": [...],
      "createdAt": "2026-01-07T12:00:00Z",
      "updatedAt": "2026-01-07T12:00:00Z"
    }
  ],
  "message": "Public lists fetched successfully",
  "success": true
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Invalid list ID",
  "success": false
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized: Access token is missing",
  "success": false
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "You can only update your own lists",
  "success": false
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "List not found",
  "success": false
}
```

---

## Authorization Rules

1. **Create List**: User must be authenticated
2. **Update List**: User must be the list owner
3. **Delete List**: User must be the list owner
4. **Add Books**: User must be the list owner
5. **Remove Books**: User must be the list owner
6. **Reorder Books**: User must be the list owner
7. **View List**: Public lists visible to all; private lists only to owner
8. **View User Lists**: Only the authenticated user's lists

---

## Data Model

### BookList Schema

```typescript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  name: string (required, max 100 chars),
  description: string (optional, max 500 chars),
  is_public: boolean (default: false),
  book_count: number (auto-calculated),
  items: [
    {
      book_id: ObjectId (ref: Book),
      title: string,
      author: string,
      added_at: Date,
      position: number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- Rate limiting is applied to public endpoints
- Book positions are automatically managed and updated
- When removing a book, all subsequent positions are adjusted
- When reordering, all book IDs in the list must be provided
