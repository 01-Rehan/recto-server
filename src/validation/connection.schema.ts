import z from "zod";

class ConnectionValidation {
  followUser = z.object({
    body: z.object({}).optional(),
    query: z.object({}).optional(),
    params: z.object({
      userId: z.string({ message: "userId is required" }),
    }),
  });

  unfollowUser = z.object({
    body: z.object({}).optional(),
    query: z.object({}).optional(),
    params: z.object({
      userId: z.string({ message: "userId is required" }),
    }),
  });

  fetchFollowers = z.object({
    body: z.object({}).optional(),
    query: z.object({ userId: z.string({ message: "userId is required" }) }),
    params: z.object().optional(),
  });

  fetchFollowing = z.object({
    body: z.object({}).optional(),
    query: z.object({
      userId: z.string({ message: "userId is required" }),
    }),
    params: z.object({}).optional(),
  });

}

export default new ConnectionValidation();
