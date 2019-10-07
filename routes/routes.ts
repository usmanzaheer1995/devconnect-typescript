import { Router } from "express";
import { authRouter, postsRouter, profileRouter, userRouter } from "./api/api";

const router = Router();

router.use("/users", userRouter);
router.use("/auth", authRouter);
router.use("/posts", postsRouter);
router.use("/profile", profileRouter);

export default router;
