import z from "zod";

class BookValidationSchema {
  createBook = z.object({
    body: z
      .object({
        externalId: z.string({ message: "externalId is required" }),
        title: z.string({ message: "Title is required" }),
        authors: z.array(z.string()).min(1, "At least one author is required"),
        rest: z.object({}).optional(),
      })
      .strict(),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
  });

  tbrBook = z
    .object({
      body: z.object({
        bookId: z.string({ message: "bookId is required" }),
        status: z.enum(["wishlist", "reading", "finished"]),
        startedAt: z.string().optional(),
        finishedAt: z.string().optional(),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    })
    .strict();

  tbrRemoveBook = z
    .object({
      body: z.object({}).optional(),
      query: z.object({}).optional(),
      params: z.object({
        tbrId: z.string({ message: "tbrId is required" }),
      }),
    })
    .strict();

  fetchBooksBasedOnStatus = z
    .object({
      body: z.object({}).optional(),
      query: z.object({ status: z.enum(["wishlist", "reading", "finished"]) }),
      params: z.object({}).optional(),
    })
    .strict();

    
}

export default new BookValidationSchema();
