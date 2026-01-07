import z from "zod";

class ListValidationSchema {
  // Create a new list
  createList = z
    .object({
      body: z
        .object({
          name: z
            .string({ message: "List name is required" })
            .min(1, "List name cannot be empty")
            .max(100, "List name cannot exceed 100 characters")
            .trim(),
          description: z
            .string()
            .max(500, "Description cannot exceed 500 characters")
            .trim()
            .optional(),
          is_public: z.boolean().optional().default(false),
        })
        .strict(),
    })
    .strict();

  // Update an existing list
  updateList = z
    .object({
      params: z.object({
        listId: z.string({ message: "List ID is required" }),
      }),
      body: z
        .object({
          name: z
            .string()
            .min(1, "List name cannot be empty")
            .max(100, "List name cannot exceed 100 characters")
            .trim()
            .optional(),
          description: z
            .string()
            .max(500, "Description cannot exceed 500 characters")
            .trim()
            .optional(),
          is_public: z.boolean().optional(),
        })
        .strict(),
    })
    .strict();

  // Delete a list
  deleteList = z
    .object({
      params: z.object({
        listId: z.string({ message: "List ID is required" }),
      }),
    })
    .strict();

  // Get a single list by ID
  getList = z
    .object({
      params: z.object({
        listId: z.string({ message: "List ID is required" }),
      }),
    })
    .strict();

  // Add a book to a list
  addBookToList = z
    .object({
      params: z.object({
        listId: z.string({ message: "List ID is required" }),
      }),
      body: z
        .object({
          book_id: z.string({ message: "Book ID is required" }),
        })
        .strict(),
    })
    .strict();

  // Remove a book from a list
  removeBookFromList = z
    .object({
      params: z.object({
        listId: z.string({ message: "List ID is required" }),
        bookId: z.string({ message: "Book ID is required" }),
      }),
    })
    .strict();

  // Reorder books in a list
  reorderBooks = z
    .object({
      params: z.object({
        listId: z.string({ message: "List ID is required" }),
      }),
      body: z
        .object({
          bookIds: z
            .array(z.string())
            .min(1, "At least one book ID is required"),
        })
        .strict(),
    })
    .strict();
}

export default new ListValidationSchema();
