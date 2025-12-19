import User from "../models/user.model";

class SearchServices {
  searchUsers = async (userName: string) => {
    return await User.find({userName: { $regex: userName, $options: "i" },
    }).select("fullName userName avatarImage"); 
  };
  getUser = async (userName: string) => {
    return await User.findOne({ userName }).select(
      "-email -googleId -isVerified",
    );
  };

}

export const searchServices = new SearchServices();