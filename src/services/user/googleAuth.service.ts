import axios from "axios";
import ApiError from "../../utils/ApiError";
import User from "../../models/user.model";
import { jwtServices } from "./JWT.service";
class GoogleAuthentication {
  Redirect = async () => {
    const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

    // Define the parameters for the URL
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
      response_type: "code", // Important: We want a CODE, not a token directly (security)
      scope: "profile email", // We are asking for their name and email
      access_type: "offline", // Gets us a refresh token (optional, but good practice)
      prompt: "consent", // Forces the "Allow" screen to show every time
    });

    // 3. Construct the full URL and redirect the user
    return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
  };

  CallBack = async (code: string) => {
    const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

    if (!code) {
      throw new ApiError(
        400,
        "Authorization code missing from Google callback",
      );
    }

    // ACTION 2: Exchange the "code" for "tokens"
    // We make a server-to-server POST request to Google.
    // We send the code + our client secret. Google verifies it and gives us an Access Token.
    let googleTokens;
    try {
      const tokenResponse = await axios.post(GOOGLE_TOKEN_URL, {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      });
      googleTokens = tokenResponse.data;
    } catch (error) {
      throw new ApiError(500, "Failed to exchange code for tokens with Google");
    }

    const { access_token: googleAccessToken } = googleTokens;

    // ACTION 3: Get User Profile
    // Now we use that Google Access Token to ask Google: "Who is this user?"
    let googleUser;
    try {
      const userProfileResponse = await axios.get(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
        },
      });
      googleUser = userProfileResponse.data;
    } catch (error) {
      throw new ApiError(500, "Failed to fetch user profile from Google");
    }

    // ACTION 4: Database Logic (The Waterfall)

    // STEP A: Check if this Google Account is already linked
    let user = await User.findOne({ googleId: googleUser.id });

    if (user) {
      // User found via Google ID - Great!
      // Just ensure they are verified (optional, but good practice)
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    } else {
      // STEP B: User not found by Google ID. Check by Email.
      // This handles the case where a user signed up with Email/Password
      // but is now trying to log in with Google for the first time.
      user = await User.findOne({ email: googleUser.email });

      if (user) {
        // User exists, but 'googleId' was missing. LINK THEM NOW.
        user.googleId = googleUser.id;

        if (!user.avatarImage && googleUser.picture)
          user.avatarImage =
            googleUser.picture.replace(/=s\d+(-c)?/g, "") + "=s400";

        await user.save({ validateBeforeSave: false });
      } else {
        // STEP C: New User entirely. Create account.

        const StockAvatarImg = googleUser.picture;
        const avatarImage = StockAvatarImg.replace(/=s\d+(-c)?/g, "") + "=s400";

        // Generate a random secure : process.env.NODE_ENC === "production", DB requirement is met
        // (Use a library like crypto or uuid)
        const dummyPassword = Math.random().toString(36).slice(-16);

        user = await User.create({
          email: googleUser.email,
          fullName: googleUser.name,
          googleId: googleUser.id, // SAVE THIS!
          avatarImage,
          isVerified: true,
          hashedPassword: dummyPassword,
        });
      }
    }
    // ... continue to Action 5 (Generate Tokens) ...

    // ACTION 5: Generate OUR Local Tokens (JWT)
    // This is the most important part. We stop caring about Google's token
    // and issue our OWN App Token (Access/Refresh) so the frontend works normally.

    const { accessToken, refreshToken: newRefreshToken } =
      await jwtServices.generateAccessAndRefreshTokens(user._id.toString());

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // ACTION 6: Set Cookies and Redirect
    // Instead of sending JSON, we usually set cookies and redirect the browser
    // to the Frontend Homepage (or a generic success page).

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  };
}
export const googleAuth = new GoogleAuthentication();
