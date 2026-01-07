# writing this as the Progress tracker and also things that is used for this project and features list for future use

### Date: November 27, 2025

- setuped the project repo and folder structure
- wrote basic utils like ApiError, ApiResponse
- created data models for mongoDB.(users,book,blog and others related to those basic features)

### November 29, 2025

- setuped the /user route for user auth related controllers ("/api/v1/user")
- added OTP based SignUp controller and route ("signup","signup-verify")
- ADDED GOOGLE AUTHENTICATION METHODDDDD :>

### Novmeber 30,2025

- added access token (short lived) refresher using refresh token (longed lived)
- implimented reset and forget password function with OTP verification.

### December 9, 2025

- implemented user following/unfollowing and followers/following endpoints
- enhanced book management features
- merged PR #1: Auth

### December 12, 2025

- added roles in the user model and role-based route checks
- added book reviews update and remove controllers
- began moving logic to services (service-first approach)

### December 15, 2025

- split `getBook` controller into a dedicated service
- split book, TBR, and review controllers into services

### December 16, 2025

- completed book service refactors and added Zod validation for inputs
- merged PR #2: fix/servicesSplitting
- split controllers for reviews and connections; added Zod input validation

### December 19, 2025

- completed service/controller split for user flows
- fixed update profile and cover image service
- merged PR #3: fix/servicesSplitting

### January 4, 2026

- optimized book retrieval with enhanced validation, caching, and query indexing
- added complete book fetch + enrichment logic to support multiple OpenLibrary workIds
- added ISBN-13 fetch logic for books

### January 5, 2026

- added affiliate and free ebook links for each book
- removed icons from affiliate links
- improved type safety, tightened rate limiting, and applied miscellaneous bug fixes

### January 6, 2026

- repository housekeeping: initial commit sequence alignment
- added Prettier and ESLint configuration for formatting and quality

### January 7, 2026

- implemented Book Lists feature with full CRUD and API documentation
