import z from "zod";

class SearchValidation{

  searchUsers = z.object({
    body: z.object({}).optional(),
    query: z.object({
      userName: z.string({ message: "userName is required" }).min(1, "userName cannot be empty"),
    }),
    params: z.object({}).optional(),
  }).strict();

  getUser = z.object({
    body: z.object({}).optional(),
    query: z.object({
      userName: z.string({ message: "userName is required" }).min(1, "userName cannot be empty"),
    }),
    params: z.object({}).optional(),
  }).strict();

}

export default new SearchValidation();