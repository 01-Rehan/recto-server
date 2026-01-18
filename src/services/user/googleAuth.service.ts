import axios from "axios";
import crypto from "crypto";
import ApiError from "../../utils/ApiError";
import User from "../../models/user.model";
import { jwtServices } from "./JWT.service";
class GoogleAuthentication {
  Redirect = async () => {
    const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

    // Define the parameters for the URL
    const state = crypto.randomBytes(16).toString("hex");
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    // Construct the full URL and return with state (controller will set cookie)
    return { url: `${GOOGLE_OAUTH_URL}?${params.toString()}`, state };
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
      const body = new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
        grant_type: "authorization_code",
      });
      const tokenResponse = await axios.post(GOOGLE_TOKEN_URL, body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
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
        timeout: 10000,
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

        const StockAvatarImg = googleUser.picture || "";
        const avatarImage = StockAvatarImg
          ? StockAvatarImg.replace(/=s\d+(-c)?/g, "") + "=s900"
          : undefined;

        // Generate a cryptographically strong random password (only if needed)
        const dummyPassword = crypto.randomBytes(32).toString("hex");

        user = await User.create({
          email: googleUser.email,
          fullName: googleUser.name,
          googleId: googleUser.id, // SAVE THIS!
          userName: googleUser.email.split("@")[0],
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
