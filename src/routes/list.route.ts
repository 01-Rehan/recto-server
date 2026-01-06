import { Router } from "express";
import validate from "../middlewares/validate.middleware";
import listValidationSchema from "../validation/list.schema";
import {
  createListController,
  getUserListsController,
  getListController,
  updateListController,
  deleteListController,
  addBookToListController,
  removeBookFromListController,
  reorderBooksController,
  getPublicListsController,
} from "../controller/list.controller";
import { VerifyJWT } from "../middlewares/auth.middleware";
import { apiLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

// Public route - get public lists
router.route("/public").get(apiLimiter, getPublicListsController);

// Public route - get a single list (if public)
router
  .route("/:listId")
  .get(apiLimiter, validate(listValidationSchema.getList), getListController);

// Protected Routes - require authentication
router.use(VerifyJWT);

// Create a new list
router
  .route("/")
  .post(validate(listValidationSchema.createList), createListController);

// Get all lists for the authenticated user
router.route("/user/my-lists").get(getUserListsController);

// Update a list
router
  .route("/:listId")
  .patch(validate(listValidationSchema.updateList), updateListController);

// Delete a list
router
  .route("/:listId")
  .delete(validate(listValidationSchema.deleteList), deleteListController);

// Add a book to a list
router
  .route("/:listId/books")
  .post(validate(listValidationSchema.addBookToList), addBookToListController);

// Remove a book from a list
router
  .route("/:listId/books/:bookId")
  .delete(
    validate(listValidationSchema.removeBookFromList),
    removeBookFromListController,
  );

// Reorder books in a list
router
  .route("/:listId/reorder")
  .patch(validate(listValidationSchema.reorderBooks), reorderBooksController);

export default router;
