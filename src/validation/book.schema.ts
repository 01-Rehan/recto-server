import z from "zod";

class BookValidationSchema {
  createBook = z
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
}

export default new BookValidationSchema();
