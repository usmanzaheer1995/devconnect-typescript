import { Router, Request, Response } from "express";
import { check, validationResult } from "express-validator";
export const userRouter = Router();

// @route   POST api/users
// @desc    Register route
// @access  Public
userRouter.post("/", [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Email is required").not().isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please add a password with 6 or more characters").not().isEmpty().isLength({ min: 6 }),
], (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    res.send("User response");
});
