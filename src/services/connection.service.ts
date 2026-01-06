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

  // Consolidated method for fetching followers/following
  private fetchConnections = async (
    userId: string,
    type: 'followers' | 'following'
  ): Promise<IFollowerDocument[] | any> => {
    const query = type === 'followers' 
      ? { followingId: userId }
      : { followerId: userId };
    
    const populateField = type === 'followers' ? 'followerId' : 'followingId';
    
    return await FollowerModel.find(query)
      .populate(populateField, "userName fullName avatarImage")
      .lean();
  };

  fetchFollowers = async (userId: string): Promise<IFollowerDocument[] | any> => {
    return this.fetchConnections(userId, 'followers');
  };

  fetchFollowings = async (userId: string): Promise<IFollowerDocument[] | any> => {
    return this.fetchConnections(userId, 'following');
  };
}

export const connectionServices = new ConnectionServices();
