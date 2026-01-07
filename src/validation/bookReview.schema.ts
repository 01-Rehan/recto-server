import z from "zod";

class BookReviewValidation {
  addReview = z
    .object({
      body: z.object({
        bookId: z.string({ message: "bookId is required" }),
        content: z.string().optional(),
        rating: z.number().min(1).max(5),
      }),
    })
    .strict();

  removeReview = z
    .object({
      params: z.object({
        reviewId: z.string({ message: "reviewId is required" }),
      }),
    })
    .strict();

  updateReview = z
    .object({
      body: z
        .object({
          content: z.string().optional(),
          rating: z.number().min(1).max(5).optional(),
        })
        .refine(
          (data) => data.content !== undefined || data.rating !== undefined,
          {
            message:
              "At least one field (content or rating) must be provided for update",
          },
        ),
      params: z.object({
        reviewId: z.string({ message: "reviewId is required" }),
      }),
    })
    .strict();

  getAllReviewsForBook = z
    .object({
      query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
      params: z.object({
        bookId: z.string({ message: "bookId is required" }),
      }),
    })
    .strict();
}

export default new BookReviewValidation();
