import express, { Router, Request, Response } from "express";
import { resolve } from 'path';

import { authRouter, postsRouter, profileRouter, userRouter } from "./api/api";

const router = Router();

router.use("/users", userRouter);
router.use("/auth", authRouter);
router.use("/posts", postsRouter);
router.use("/profile", profileRouter);

if (process.env.NODE_ENV === 'production') {
  // Set static folder
  router.use(express.static('client/build'));

  router.get('*', (req: Request, res: Response) => {
    res.sendFile(resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

export default router;
