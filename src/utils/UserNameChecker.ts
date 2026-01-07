import ApiError from "./ApiError"; // Assuming ApiError is defined in your project

/**
 * Executes a series of synchronous checks for username validity based on business rules.
 *
 * @param userName The username string to validate.
 * @param existingUserName The current username of the user (to prevent updating to the same name).
 * @returns void - throws ApiError on failure.
 */
export function validateUsername(userName: string): void {
  // Define all synchronous validation rules in a structured array
  const validationRules = [
    {
      condition: userName.trim() === "",
      message: "Username cannot be empty",
    },
    {
      condition: userName.includes(" "),
      message: "Username cannot contain spaces",
    },
    {
      condition: userName.length < 3,
      message: "Username must be at least 3 characters long",
    },
    {
      condition: userName.length > 20,
      message: "Username cannot be more than 20 characters long",
    },
    {
      condition: !/^[a-zA-Z0-9_.]+$/.test(userName),
      message:
        "Username can only contain letters, numbers, underscores, and periods",
    },
  ];

  for (const rule of validationRules) {
    if (rule.condition) {
      // Throw error on the first rule failure
      throw new ApiError(400, rule.message);
    }
  }
}
