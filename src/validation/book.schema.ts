import z from "zod";

class BookValidationSchema {
  getBook = z
    .object({
      body: z
        .object({
          externalId: z.string({ message: "externalId is required" }),
          title: z.string({ message: "Title is required" }),
          authors: z
            .array(z.string())
            .min(1, "At least one author is required"),
        })
        .strict(),
    })
    .strict();

  tbrBook = z
    .object({
      body: z.object({
        bookId: z.string({ message: "bookId is required" }),
        status: z.enum(["wishlist", "reading", "finished"]),
        startedAt: z.string().optional(),
        finishedAt: z.string().optional(),
      }),
    })
    .strict();

  tbrRemoveBook = z
    .object({
      params: z.object({
        tbrId: z.string({ message: "tbrId is required" }),
      }),
    })
    .strict();

  fetchBooksBasedOnStatus = z
    .object({
      query: z.object({ status: z.enum(["wishlist", "reading", "finished"]) }),
    })
    .strict();

  getPurchaseLinks = z
    .object({
      params: z.object({
        bookId: z.string({ message: "bookId is required" }),
      }),
    })
    .strict();

  searchBooks = z
    .object({
      query: z.object({
        title: z
          .string({
            message: "Title is required for search",
          })
          .min(2, "Title must be at least 2 characters")
          .max(200, "Title must not exceed 200 characters")
          .trim()
          .optional(),
        genre: z
          .string({
            message: "Genre for filtering",
          })
          .max(100, "Genre must not exceed 100 characters")
          .trim()
          .optional(),
        sort: z.enum(["averageRating", "releaseDate", "createdAt"]).optional(),
        order: z.enum(["asc", "desc"]).optional().default("desc"),
        page: z
          .string()
          .optional()
          .default("1")
          .transform((val) => parseInt(val, 10))
          .refine((val) => val > 0, "Page must be greater than 0"),
        limit: z
          .string()
          .optional()
          .default("10")
          .transform((val) => parseInt(val, 10))
          .refine(
            (val) => val > 0 && val <= 50,
            "Limit must be between 1 and 50",
          ),
      }),
    })
    .strict();

  searchBooksByAuthor = z
    .object({
      query: z.object({
        author: z
          .string({
            message: "Author name is required for search",
          })
          .min(2, "Author name must be at least 2 characters")
          .max(200, "Author name must not exceed 200 characters")
          .trim(),
        page: z
          .string()
          .optional()
          .default("1")
          .transform((val) => parseInt(val, 10))
          .refine((val) => val > 0, "Page must be greater than 0"),
        limit: z
          .string()
          .optional()
          .default("10")
          .transform((val) => parseInt(val, 10))
          .refine(
            (val) => val > 0 && val <= 50,
            "Limit must be between 1 and 50",
          ),
      }),
    })
    .strict();
}

export default new BookValidationSchema();
