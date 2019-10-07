import { Router, Request, Response } from "express";
export const postsRouter = Router();

// @route   GET api/posts
// @desc    Test route
// @access  Public
postsRouter.get("/", (req: Request, res: Response) => res.send("Posts response"));
