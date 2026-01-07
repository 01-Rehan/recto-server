# Blog Feature - Quick Reference Guide

## 📁 File Structure

```
src/
├── models/
│   └── blog.model.ts          ← Database schema
├── types/
│   └── blog.ts                ← TypeScript interfaces
├── validation/
│   └── blog.schema.ts         ← Zod validation
├── services/
│   └── blog.service.ts        ← Business logic
├── controller/
│   └── blog.controller.ts     ← Request handlers
├── routes/
│   └── blog.route.ts          ← API endpoints
└── app.ts                     ← Routes registered
```

## 🚀 API Endpoints Summary

| Method | Endpoint                      | Auth        | Description            |
| ------ | ----------------------------- | ----------- | ---------------------- |
| POST   | `/api/v1/blogs`               | ✅ Required | Create new blog        |
| GET    | `/api/v1/blogs`               | ❌ Public   | List blogs (paginated) |
| GET    | `/api/v1/blogs/:slug`         | ❌ Public   | Get blog by slug       |
| GET    | `/api/v1/blogs/user/my-blogs` | ✅ Required | Get user's blogs       |
| PATCH  | `/api/v1/blogs/:id`           | ✅ Author   | Update blog            |
| DELETE | `/api/v1/blogs/:id`           | ✅ Author   | Delete blog            |

## 📤 Request/Response Examples

### Create Blog

```bash
curl -X POST http://localhost:3000/api/v1/blogs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with Node.js",
    "content": "In this post, we will explore...",
    "cover_image": "https://example.com/image.jpg",
    "is_published": true
  }'
```

**Success Response (201):**

```json
{
  "statusCode": 201,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "author_id": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "title": "Getting Started with Node.js",
    "slug": "getting-started-with-nodejs",
    "content": "In this post, we will explore...",
    "cover_image": "https://example.com/image.jpg",
    "is_published": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Blog created successfully",
  "success": true
}
```

### Get All Blogs

```bash
curl "http://localhost:3000/api/v1/blogs?page=1&limit=10&published=true"
```

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "blogs": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "author_id": {...},
        "title": "Getting Started with Node.js",
        "slug": "getting-started-with-nodejs",
        "content": "...",
        "is_published": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  },
  "message": "Blogs fetched successfully",
  "success": true
}
```

### Get Blog by Slug

```bash
curl "http://localhost:3000/api/v1/blogs/getting-started-with-nodejs"
```

### Update Blog

```bash
curl -X PATCH http://localhost:3000/api/v1/blogs/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced Node.js Tips",
    "is_published": false
  }'
```

### Delete Blog

```bash
curl -X DELETE http://localhost:3000/api/v1/blogs/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ✅ Validation Rules

### Title

- **Required**: Yes
- **Type**: String
- **Length**: 1-200 characters
- **Trimmed**: Yes

### Content

- **Required**: Yes
- **Type**: String
- **Min Length**: 10 characters
- **Trimmed**: Yes

### Cover Image

- **Required**: No (Optional)
- **Type**: String (URL)
- **Valid URL**: Required if provided
- **Trimmed**: Yes

### Is Published

- **Required**: No (Optional)
- **Type**: Boolean
- **Default**: true

## 🔐 Authentication & Authorization

### Protected Routes

All routes starting with `POST /api/v1/blogs` and requiring authentication use the `VerifyJWT` middleware.

### Author-Only Operations

For `PATCH` and `DELETE` operations, the authenticated user must be the blog's author:

- Error (403): "You can only update your own blogs"
- Error (403): "You can only delete your own blogs"

## 📊 Query Parameters

### Pagination (GET /api/v1/blogs)

```
page: number (default: 1)
  - Minimum: 1
  - Used for offset calculation: (page - 1) * limit

limit: number (default: 10)
  - Minimum: 1
  - Maximum: 100

published: "true" | "false" | "both" (default: "true")
  - "true": Only published blogs
  - "false": Only unpublished blogs
  - "both": All blogs (for authenticated users)
```

### Example Pagination Queries

```
GET /api/v1/blogs?page=2&limit=20&published=true
GET /api/v1/blogs?page=1&limit=5&published=both
GET /api/v1/blogs/user/my-blogs?page=1&limit=15
```

## 🛡️ Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Invalid blog ID",
  "success": false
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "data": null,
  "message": "You can only update your own blogs",
  "success": false
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Blog not found",
  "success": false
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "data": null,
  "message": "Unauthorized: Access token is missing",
  "success": false
}
```

## 🧠 Slug Generation Logic

The slug is automatically generated from the title:

```
Input: "My Awesome Blog Post!"
Process:
  1. Convert to lowercase: "my awesome blog post!"
  2. Remove special chars: "my awesome blog post"
  3. Replace spaces with hyphens: "my-awesome-blog-post"
  4. Remove extra hyphens: "my-awesome-blog-post"

Output: "my-awesome-blog-post"
```

**Duplicate Handling:**

```
If "my-awesome-blog-post" already exists:
  Second attempt: "my-awesome-blog-post-1"
  Third attempt: "my-awesome-blog-post-2"
  etc.
```

## 🔄 Lifecycle of a Blog

### 1. Creation

- User creates blog with title, content, optional cover_image
- System auto-generates unique slug
- Blog defaults to `is_published: true`
- Author and timestamps recorded

### 2. Publishing

- Published blogs visible to everyone via public endpoints
- Unpublished blogs only visible to author

### 3. Update

- Only author can update
- Changing title regenerates slug if needed
- All fields except author_id are updatable

### 4. Deletion

- Only author can delete
- Hard delete from database
- No soft delete/archive

## 📈 Performance Notes

### Indexes

- `author_id`: Fast author lookups
- `is_published + createdAt`: Fast public blog listing
- `slug`: Unique constraint + fast slug lookup
- Text search on title/content for search functionality

### Query Optimization

- `.lean()` used for list endpoints (no Mongoose wrapping)
- `.populate()` fetches author details in one query
- Pagination prevents loading large datasets

## 🔗 Dependencies

```typescript
- mongoose: ^7.0.0 (Database)
- zod: ^3.0.0 (Validation)
- express: ^4.18.0 (Framework)
- jsonwebtoken: ^9.0.0 (Auth)
```

## 💡 Best Practices Used

1. ✅ **Separation of Concerns**: Models, Services, Controllers separate
2. ✅ **Type Safety**: Full TypeScript implementation
3. ✅ **Error Handling**: Custom ApiError class
4. ✅ **Validation**: Zod for input validation
5. ✅ **Authentication**: JWT with VerifyJWT middleware
6. ✅ **Authorization**: Author-only operations verified
7. ✅ **Rate Limiting**: apiLimiter middleware applied
8. ✅ **Pagination**: Implemented with limit and offset
9. ✅ **Slug Generation**: URL-friendly with duplicate handling
10. ✅ **Database Efficiency**: Proper indexes and query optimization
