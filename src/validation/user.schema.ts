import z from "zod";

class UserValidation {
  verifyOTP = z
    .object({
      body: z.object({
        email: z.email(),
        otp: z
          .string({ message: "OTP is required" })
          .min(6, "OTP must be 6 characters long")
          .max(6, "OTP must be 6 characters long"),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    })
    .strict();

  signUp = z
    .object({
      body: z.object({
        email: z.email(),
        userName: z
          .string({ message: "Username is required" })
          .min(3)
          .max(30)
          .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores",
          ),
        password: z
          .string({ message: "Password is required" })
          .min(8, "Password must be at least 8 characters long"),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    })
    .strict();

  signIn = z
    .object({
      body: z.object({
        email: z.email(),
        password: z
          .string({ message: "Password is required" })
          .min(8, "Password must be at least 8 characters long"),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    })
    .strict();

  refreshToken = z
    .object({
      cookies: z
        .object({
          refreshToken: z.string().optional(),
        })
        .optional(),
      body: z
        .object({
          refreshToken: z.string().optional(),
        })
        .optional(),
    })
    .refine((data) => data.cookies?.refreshToken || data.body?.refreshToken, {
      message: "Refresh token is required in either Cookies or Body",
      path: ["body", "refreshToken"], // Mark error on body for client visibility
    });

  forgotPassword = z
    .object({
      body: z.object({
        email: z.email(),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    })
    .strict();

  verifyOTPforPasswordChange = z
    .object({
      body: z.object({
        email: z.email(),
        code: z.string({ message: "OTP is required" }).min(6).max(6),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    })
    .strict();

  newPassword = z
    .object({
      body: z.object({
        resetToken: z.string({ message: "Reset token is required" }),
        password: z.string({ message: "Password is required" }).min(8),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    })
    .strict();

  changePassword = z
    .object({
      body: z.object({
        oldPassword: z.string({ message: "Old password is required" }).min(8),
        newPassword: z.string({ message: "New password is required" }).min(8),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    })
    .strict();

  updateProfile = z
    .object({
      body: z
        .object({
          bio: z
            .string()
            .max(300, "Bio cannot exceed 300 characters")
            .optional(),
          // Regex: Alphanumeric and underscores only, 3-30 chars
          userName: z
            .string()
            .min(3)
            .max(30)
            .regex(
              /^[a-zA-Z0-9_]+$/,
              "Username can only contain letters, numbers, and underscores",
            )
            .optional(),
        })
        .refine(
          (data) => data.bio !== undefined || data.userName !== undefined,
          {
            message:
              "At least one field (bio or userName) must be provided for update",
          },
        ),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    })
    .strict();

  userNameAvailability = z
    .object({
      body: z.object({}).optional(),
      query: z.object({
        userName: z.string({ message: "userName is required" }),
      }),
      params: z.object({}).optional(),
    })
    .strict();
}

export default new UserValidation();
