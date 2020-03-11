import { Router, Request, Response } from "express";
import { check, validationResult } from "express-validator";

import { authenticate } from "../../middleware/middleware";
import User from "../../models/User";
import Profile from "../../models/Profile";
import Post from "../../models/Post";
import { IGetUserAuthInfoRequest, IUserModel, IPostModel } from "../../interfaces/interfaces";

export const postsRouter = Router();

// @route   POST api/posts
// @desc    Create a post
// @access  Private
postsRouter.post("/", [
    authenticate,
    check("text", "Text is required").not().isEmpty(),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as IGetUserAuthInfoRequest).user.id;

    try {
        const user: IUserModel = await User.findById(userId).select("-password").lean();

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: userId,
        });

        const post = await newPost.save();

        res.json(post);
    } catch (err) {
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
postsRouter.get("/", authenticate, async (req: Request, res: Response) => {
    try {
        const offset = req.query.offset ? +req.query.offset : 0;
        const limit = req.query.limit ? +req.query.limit : 10;
        const [posts, count] = await Promise.all([
            Post.find()
                .sort({ date: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            Post.find().countDocuments(),
        ]);
        res.json({
            posts,
            count,
        });
    } catch (err) {
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
postsRouter.get("/:id", authenticate, async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ errors: [{ msg: "Post not found" }] });
        }
        res.json(post);
    } catch (err) {
        
        if (err.kind === "ObjectId") {
            return res.status(404).json({ errors: [{ msg: "Post not found" }] });
        }
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   DELETE api/posts/:id
// @desc    Get a post
// @access  Private
postsRouter.delete("/:id", authenticate, async (req: Request, res: Response) => {
    try {
        const post: IPostModel = await Post.findById(req.params.id).lean();

        if (!post) {
            return res.status(404).json({ errors: [{ msg: "Post not found" }] });
        }

        // Check user
        const userId = (req as IGetUserAuthInfoRequest).user.id;
        if (post.user.toString() !== userId) {
            return res.status(401).json({ errors: [{ msg: "User not authorized" }] });
        }
        await Post.findByIdAndRemove(post._id);
        res.json({ msg: "Post removed" });
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(404).json({ errors: [{ msg: "Post not found" }] });
        }
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private.
postsRouter.put("/like/:id", authenticate, async (req: Request, res: Response) => {
    const userId = (req as IGetUserAuthInfoRequest).user.id;
    try {
        const updated = await Post.updateOne(
            { _id: req.params.id },
            { $addToSet: { likes: { user: userId } } },
        );
        if (updated.nModified === 0) {
            return res.status(400).json({ errors: [{ msg: "Post already liked" }] });
        }
        const posts: IPostModel = await Post.findById(req.params.id).lean();
        res.json(posts.likes);
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(404).json({ errors: [{ msg: "Post not found" }] });
        }
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private.
postsRouter.put("/unlike/:id", authenticate, async (req: Request, res: Response) => {
    const userId = (req as IGetUserAuthInfoRequest).user.id;
    try {
        const updated = await Post.updateOne(
            { _id: req.params.id },
            { $pull: { likes: { user: userId } } },
        );
        if (updated.nModified === 0) {
            return res.status(400).json({ errors: [{ msg: "Post has not yet been liked" }] });
        }
        const posts: IPostModel = await Post.findById(req.params.id).lean();
        res.json(posts.likes);
    } catch (err) {
        
        if (err.kind === "ObjectId") {
            return res.status(404).json({ errors: [{ msg: "Post not found" }] });
        }
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   POST api/posts/comment/:id
// @desc    Create a comment on a post
// @access  Private
postsRouter.post("/comment/:id", [
    authenticate,
    check("text", "Text is required").not().isEmpty(),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as IGetUserAuthInfoRequest).user.id;

    try {
        const user: IUserModel = await User.findById(userId).select("-password").lean();
        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: userId,
        };

        const post: IPostModel = await Post.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    comments: {
                        $each: [newComment],
                        $position: 0,
                    },
                },
            },
            { new: true },
        ).lean();

        res.json(post.comments);
    } catch (err) {
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete a comment on a post
// @access  Private
postsRouter.delete("/comment/:id/:comment_id", authenticate, async (req: Request, res: Response) => {
    try {
        const updated = await Post.updateOne(
            { _id: req.params.id },
            { $pull: { comments: { _id: req.params.comment_id } } },
        );
        if (updated.nModified === 0) {
            return res.status(400).json({ errors: [{ msg: "Comment not found" }] });
        }
        const posts: IPostModel = await Post.findById(req.params.id).lean();
        res.json(posts.comments);
    } catch (err) {
        
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});
