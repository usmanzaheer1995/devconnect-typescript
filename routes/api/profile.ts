import { Router, Request, Response } from "express";
export const profileRouter = Router();

// @route   GET api/profile
// @desc    Test route
// @access  Public
profileRouter.get("/", (req: Request, res: Response) => res.send("Profile response"));
