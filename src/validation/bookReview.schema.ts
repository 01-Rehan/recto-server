import z from "zod";

class BookReviewValidation {

  addReview = z.object({
    body: z.object({
      bookId: z.string({ message: "bookId is required" }),
      content: z.string().optional(),
      rating: z.number().min(1).max(5),
    }),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
  });

  removeReview = z.object({
    body: z.object({}).optional(),
    query: z.object({}).optional(),
    params: z.object({
      reviewId: z.string({ message: "reviewId is required" }),
    }),
  });

  updateReview = z.object({
    body: z.object({
      content: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
    }),
    query: z.object({}).optional(),
    params: z.object({
      reviewId: z.string({ message: "reviewId is required" }),
    }),
  });

  getAllReviewsForBook = z.object({
    body: z.object({}).optional(),
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
    params: z.object({
      bookId: z.string({ message: "bookId is required" }),
    }),
  });

}

export default new BookReviewValidation();