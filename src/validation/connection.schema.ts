import z from "zod";

class ConnectionValidation {
  followUser = z
    .object({
      params: z.object({
        userId: z.string({ message: "userId is required" }),
      }),
    })
    .strict();

  unfollowUser = z
    .object({
      params: z.object({
        userId: z.string({ message: "userId is required" }),
      }),
    })
    .strict();

  fetchFollowers = z
    .object({
      query: z.object({ userId: z.string({ message: "userId is required" }) }),
    })
    .strict();

  fetchFollowing = z
    .object({
      query: z.object({
        userId: z.string({ message: "userId is required" }),
      }),
    })
    .strict();

  myFollowers = z.object({}).strict();

  myFollowing = z.object({}).strict();
}

export default new ConnectionValidation();
