import { Types,Schema,model,HydratedDocument } from "mongoose";
import { IUser } from "../types/user";

interface IFollower {
    followerId: Types.ObjectId | IUser;
    followingId: Types.ObjectId | IUser;
}

export type IFollowerDocument = HydratedDocument<IFollower>;

const FollowerSchema = new Schema<IFollower>({
    followerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    followingId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
}
);

// 1. Prevent Duplicate Follows
// A user (followerId) can only follow a specific person (followingId) ONCE.
FollowerSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// 2. Optimize "Get My Followers"
// When someone visits your profile, we need to find all docs where followingId == YOU.
FollowerSchema.index({ followingId: 1 });

export const FollowerModel = model<IFollower>("Follower", FollowerSchema);