import { Schema, model } from "mongoose";

const PostScheme = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "user" },
    text: { type: String, required: true },
    name: { type: String },
    avatar: { type: String },
    likes: [{
        user: { type: Schema.Types.ObjectId, ref: "user" },
        _id: false,
    }],
    comments: [{
        user: { type: Schema.Types.ObjectId, ref: "user" },
        text: { type: String, required: true },
        name: { type: String },
        avatar: { type: String },
        date: { type: Date, default: Date.now },
    }],
    date: { type: Date, default: Date.now },
});

const Post = model("post", PostScheme);
export default Post;
