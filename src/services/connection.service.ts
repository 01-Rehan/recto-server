import { FollowerModel, IFollowerDocument } from "../models/follower.model";

class ConnectionServices {
  followUser = async (
    userIdToFollow: string,
    CurrentUser: string,
  ): Promise<IFollowerDocument> => {
    return await FollowerModel.create({
      followerId: CurrentUser,
      followingId: userIdToFollow,
    });
  };
  unfollowUser = async (
    userIdToUnfollow: string,
    CurrentUser: string,
  ): Promise<IFollowerDocument | null> => {
    return await FollowerModel.findOneAndDelete({
      followerId: CurrentUser,
      followingId: userIdToUnfollow,
    });
  };
  fetchFollowers = async (userId: string): Promise<IFollowerDocument[] | any> => {
    return await FollowerModel.find({
      followingId: userId,
    })
      .populate("followerId", "userName fullName avatarImage")
      .lean();
  };
  fetchFollowings = async (userId: string): Promise<IFollowerDocument[] | any> => {
    return await FollowerModel.find({
      followerId: userId,
    })
      .populate("followingId", "userName fullName avatarImage")
      .lean();
  };
}

export const connectionServices = new ConnectionServices();
