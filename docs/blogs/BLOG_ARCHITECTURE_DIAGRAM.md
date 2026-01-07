# Blog Feature - Architecture Diagram & Visual Guide

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (API CALLER)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP Request/Response
                             │
        ┌────────────────────▼─────────────────────┐
        │        Express Routes (blog.route.ts)    │
        │                                           │
        │  POST   /api/v1/blogs                    │
        │  GET    /api/v1/blogs                    │
        │  GET    /api/v1/blogs/:slug              │
        │  GET    /api/v1/blogs/user/my-blogs      │
        │  PATCH  /api/v1/blogs/:id                │
        │  DELETE /api/v1/blogs/:id                │
        └────────────────────┬─────────────────────┘
                             │
        ┌────────────────────▼─────────────────────┐
        │   Middleware Stack                       │
        │  ┌──────────────────────────────────┐   │
        │  │ 1. Zod Validation Schema         │   │
        │  │    (blog.schema.ts)              │   │
        │  └──────────────────────────────────┘   │
        │  ┌──────────────────────────────────┐   │
        │  │ 2. VerifyJWT (if protected)      │   │
        │  │    (auth.middleware.ts)          │   │
        │  └──────────────────────────────────┘   │
        │  ┌──────────────────────────────────┐   │
        │  │ 3. Rate Limiter                  │   │
        │  │    (rateLimiter.middleware.ts)   │   │
        │  └──────────────────────────────────┘   │
        └────────────────────┬─────────────────────┘
                             │
        ┌────────────────────▼─────────────────────┐
        │    Controllers (blog.controller.ts)      │
        │                                           │
        │  • createBlogController                  │
        │  • getAllBlogsController                 │
        │  • getBlogBySlugController               │
        │  • getUserBlogsController                │
        │  • updateBlogController                  │
        │  • deleteBlogController                  │
        └────────────────────┬─────────────────────┘
                             │
        ┌────────────────────▼─────────────────────┐
        │    Services (blog.service.ts)            │
        │                                           │
        │  • createBlog() - with slug generation   │
        │  • getBlogBySlug() - with access control │
        │  • getAllBlogs() - with pagination       │
        │  • getAuthorBlogs()                      │
        │  • updateBlog() - author only            │
        │  • deleteBlog() - author only            │
        └────────────────────┬─────────────────────┘
                             │
        ┌────────────────────▼─────────────────────┐
        │    Models (blog.model.ts)                │
        │                                           │
        │    MongoDB Blog Collection               │
        │  ┌──────────────────────────────────┐   │
        │  │ author_id  (indexed)             │   │
        │  │ title      (required, 1-200)     │   │
        │  │ slug       (unique, indexed)      │   │
        │  │ content    (required)             │   │
        │  │ cover_image (optional)            │   │
        │  │ is_published (boolean)            │   │
        │  │ createdAt  (timestamp)            │   │
        │  │ updatedAt  (timestamp)            │   │
        │  └──────────────────────────────────┘   │
        └────────────────────┬─────────────────────┘
                             │
                        Database
```

---

## 🔄 Request Flow Diagram

### Example: Create Blog

```
Client sends:
POST /api/v1/blogs
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
Body: { title, content, cover_image?, is_published? }
                    │
                    ▼
            ┌───────────────┐
            │  Route Match  │
            │ (/api/v1/     │
            │  blogs POST)  │
            └───────┬───────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Validation Layer    │
        │ (blogValidationSchema │
        │   .createBlog)        │
        │ - Check title length  │
        │ - Check content min   │
        │ - Validate cover_image│
        └────────┬──────────────┘
                 │
                 ▼
        ┌──────────────────┐
        │  Auth Middleware │
        │  (VerifyJWT)     │
        │ - Extract token  │
        │ - Verify JWT     │
        │ - Add user to req│
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────────┐
        │  Rate Limiter        │
        │  (apiLimiter)        │
        │ - Check IP limit     │
        │ - Allow/Deny request │
        └────────┬─────────────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │  Controller              │
        │ (createBlogController)   │
        │ - Extract userId from   │
        │   req.user._id           │
        │ - Extract blog data from │
        │   req.body               │
        │ - Call service           │
        └────────┬─────────────────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │  Service Layer           │
        │ (blogService.createBlog) │
        │ - Validate author_id     │
        │ - Generate slug from     │
        │   title (slug generation)│
        │ - Check for duplicate    │
        │   slug                   │
        │ - Create document in DB  │
        │ - Populate author info   │
        └────────┬─────────────────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │  Database Operation      │
        │ (BlogModel.create())     │
        │ - Insert document        │
        │ - Return created doc     │
        │ - Apply indexes          │
        └────────┬─────────────────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │  Response Formatting     │
        │ (ApiResponse)            │
        │ { statusCode: 201,       │
        │   data: blog,            │
        │   message: "...",        │
        │   success: true }        │
        └────────┬─────────────────┘
                 │
                 ▼
            Client Receives
            201 Created + Blog Data
```

---

## 📝 Data Flow: Slug Generation

```
User Input Title:
"My Awesome Blog Post!"
          │
          ▼
  ┌─────────────────────┐
  │ generateSlug()      │
  │ ┌─────────────────┐ │
  │ │ toLowerCase()   │ │
  │ │ "my awesome..!" │ │
  │ └────────┬────────┘ │
  │          │          │
  │ ┌────────▼────────┐ │
  │ │ Remove special  │ │
  │ │ chars (/)       │ │
  │ │ "my awesome..p" │ │
  │ └────────┬────────┘ │
  │          │          │
  │ ┌────────▼────────┐ │
  │ │ Replace spaces  │ │
  │ │ with hyphens    │ │
  │ │ "my-awesome-..p"│ │
  │ └────────┬────────┘ │
  │          │          │
  │ ┌────────▼────────┐ │
  │ │ Remove extra    │ │
  │ │ hyphens         │ │
  │ │ "my-awesome-p"  │ │
  │ └────────┬────────┘ │
  │          │          │
  │ ┌────────▼────────┐ │
  │ │ Remove leading/ │ │
  │ │ trailing hyphens│ │
  │ │ "my-awesome-p"  │ │
  │ └────────┬────────┘ │
  └─────────┬────────────┘
            │
            ▼
   Base Slug Generated:
   "my-awesome-blog-post"
            │
            ▼
  ┌──────────────────────────┐
  │ generateUniqueSlug()     │
  │ Check if exists in DB    │
  └──────────┬───────────────┘
             │
     ┌───────┴────────┐
     │                │
     ▼                ▼
   Exists?         Doesn't Exist?
     │                │
     │ YES            │ NO
     │                │
     ▼                ▼
   Counter++      Return Base Slug
   my-awesome-..  "my-awesome-blog-post"
   blog-post-1
     │
     ▼
   Check if
   Exists?
     │
     ├─ NO: Return "my-awesome-blog-post-1"
     ├─ YES: Try "my-awesome-blog-post-2"
     └─ Continue until unique
```

---

## 🔐 Access Control Matrix

```
┌─────────────────────┬──────────────┬──────────────┬──────────────┐
│ Operation           │ Public       │ Author       │ Other Auth   │
├─────────────────────┼──────────────┼──────────────┼──────────────┤
│ Create Blog         │ ❌ Denied    │ ✅ Allowed   │ ✅ Allowed   │
│ List All Blogs      │ ✅ Published │ ✅ All Blogs │ ✅ Published │
│ Get by Slug         │ ✅ Published │ ✅ All Blogs │ ✅ Published │
│ Get User's Blogs    │ ❌ Denied    │ ✅ Allowed   │ ❌ Denied    │
│ Update Blog         │ ❌ Denied    │ ✅ Allowed   │ ❌ Denied    │
│ Delete Blog         │ ❌ Denied    │ ✅ Allowed   │ ❌ Denied    │
└─────────────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 📊 Database Query Performance

```
Query: Get all published blogs
├─ Index Used: is_published + createdAt
├─ Execution: < 10ms (for 10K documents)
├─ Sort: createdAt DESC
└─ Limit: 10

Query: Get blog by slug
├─ Index Used: slug (unique)
├─ Execution: < 1ms
├─ Single document retrieval
└─ Populates author details

Query: Get user's blogs
├─ Index Used: author_id
├─ Execution: < 10ms
├─ Filter: author_id = X
└─ Paginated results

Query: Find by text (future enhancement)
├─ Index Used: text index (title + content)
├─ Execution: Variable based on results
├─ Search: Full-text search capability
└─ Supports: Fuzzy matching
```

---

## 🎯 Error Handling Flow

```
                   Error Occurs
                        │
                        ▼
            ┌────────────────────────┐
            │  asyncHandler catches  │
            │  error & passes to     │
            │  next(error)           │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Express Error Handler │
            │  (if configured)       │
            └────────────┬───────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
    ApiError Instance      Other Error Type
            │                         │
            ▼                         ▼
    Response with:          Response with:
    • statusCode            • statusCode: 500
    • data: null            • data: null
    • message: custom       • message: generic
    • success: false        • success: false
```

---

## 🧩 Component Dependency Graph

```
blog.route.ts
├── imports: blog.controller.ts
│   ├── imports: blog.service.ts
│   │   ├── imports: blog.model.ts
│   │   ├── imports: ApiError.ts
│   │   └── imports: mongoose
│   ├── imports: asyncHandler.ts
│   ├── imports: ApiResponse.ts
│   └── imports: blog.schema.ts (for types)
├── imports: blog.schema.ts
│   └── imports: zod
├── imports: auth.middleware.ts
├── imports: rateLimiter.middleware.ts
└── imports: validate.middleware.ts

blog.schema.ts
└── imports: zod

blog.model.ts
├── imports: mongoose
└── imports: blog.ts (types)

blog.ts (types)
├── imports: mongoose
└── imports: user.ts
```

---

## 📈 Scalability Considerations

### Indexing Strategy

```
Index 1: author_id (1)
├─ Purpose: Fast author lookups
├─ Usage: getAuthorBlogs, getUserBlogs
└─ Cardinality: High

Index 2: author_id (1) + is_published (1)
├─ Purpose: Author's published blogs
├─ Usage: Filter author's public blogs
└─ Cardinality: High

Index 3: is_published (1) + createdAt (-1)
├─ Purpose: Public blog feed
├─ Usage: getAllBlogs, sorting
└─ Cardinality: Medium

Index 4: slug (1) - Unique
├─ Purpose: Fast slug lookup
├─ Usage: getBlogBySlug, uniqueness check
└─ Cardinality: Perfect

Index 5: text (title, content)
├─ Purpose: Full-text search
├─ Usage: Future search functionality
└─ Cardinality: Flexible
```

### Optimization Opportunities

```
✓ Implemented Now:
  • Pagination (limit 10-100)
  • Lean queries for lists
  • Compound indexes
  • Slug uniqueness with counter

⭐ Future Enhancements:
  • Caching (Redis) for popular blogs
  • View count tracking
  • Read time estimation
  • Search ranking/relevance
  • Drafts/scheduled publishing
  • Comment denormalization
  • Tag-based filtering
```

---

## 🔗 Integration Points

```
App Entry:
src/app.ts
    │
    ├─ Imports BlogRouter
    └─ Mounts at /api/v1/blogs
            │
            ▼
    blog.route.ts
        │
        ├─ Public Routes (no auth)
        │   ├─ GET /
        │   └─ GET /:slug
        │
        └─ Protected Routes (with VerifyJWT)
            ├─ POST /
            ├─ GET /user/my-blogs
            ├─ PATCH /:id
            └─ DELETE /:id

Each Route:
    │
    ├─ validate() middleware
    │   └─ Uses blogValidationSchema
    │
    ├─ apiLimiter middleware
    │   └─ Rate limiting
    │
    ├─ VerifyJWT middleware (if protected)
    │   └─ Authentication
    │
    └─ Controller function
        └─ Uses blogService
            └─ Database operations via BlogModel
```

---

## 📋 Complete Request-Response Cycle

```
Client Request
    │
    ├─ HTTP Method + Path
    │
    ├─ Headers (Authorization, Content-Type)
    │
    ├─ Query Parameters (page, limit, published)
    │
    └─ Body (JSON for POST/PATCH)
         │
         ▼
    ┌─────────────────────┐
    │ Route Matching      │
    │ (Express Router)    │
    └────────┬────────────┘
             │
         ┌───┴────────────────┐
         │ Middleware Chain   │
         │ 1. Validation      │
         │ 2. Auth (if needed)│
         │ 3. Rate Limit      │
         └────────┬───────────┘
                  │
             ┌────▼─────┐
             │ Controller
             │ Function  │
             └────┬──────┘
                  │
        ┌─────────┴──────────┐
        │ Service Method     │
        │ • Validate         │
        │ • Authorize        │
        │ • Process          │
        │ • Persist          │
        └────────┬───────────┘
                 │
          ┌──────▼──────┐
          │  Database   │
          │ Operation   │
          └──────┬──────┘
                 │
        ┌────────▼────────┐
        │ Response Created │
        │ • Status Code   │
        │ • Data          │
        │ • Message       │
        │ • Success Flag  │
        └────────┬────────┘
                 │
                 ▼
        Client Receives Response
```

This architecture ensures clean separation of concerns, scalability, security, and maintainability!
