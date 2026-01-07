import z from "zod";

class SearchValidation {
  searchUsers = z
    .object({
      query: z.object({
        userName: z
          .string({ message: "userName is required" })
          .min(1, "userName cannot be empty"),
      }),
    })
    .strict();

  getUser = z
    .object({
      query: z.object({
        userName: z
          .string({ message: "userName is required" })
          .min(1, "userName cannot be empty"),
      }),
    })
    .strict();
}

export default new SearchValidation();
