import { Router, Request, Response } from "express";
export const authRouter = Router();

// @route   GET api/auth
// @desc    Test route
// @access  Public
authRouter.get("/", (req: Request, res: Response) => res.send("Auth response"));
