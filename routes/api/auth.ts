import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/middleware";
import { check, validationResult } from "express-validator";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";

import { IGetUserAuthInfoRequest, IUserModel } from "../../interfaces/interfaces";
import User from "../../models/User";

export const authRouter = Router();

// @route   GET api/auth
// @desc    Test route
// @access  Private
authRouter.get("/", authenticate, async (req: Request, res: Response) => {
    try {
        const user = await User.findById((req as IGetUserAuthInfoRequest).user.id).select("-password");
        res.json(user);
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user and get token
// @access  Public
authRouter.post("/login", [
    check("email", "Email is required").not().isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Password is required").not().isEmpty(),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const jwtSecret: string = process.env.JWT_SECRET!;
    const jwtExpiryTime: number = parseInt(process.env.JWT_EXPIRY!, 10);

    const { email, password } = req.body;

    try {
        if (!jwtSecret || !jwtExpiryTime) {
            throw { message: "Environment variables not found" };
        }

        // See if user exists
        const user: IUserModel = await User.findOne({ email }).lean();
        if (!user) {
            return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
        }

        // Match and compare password
        const isMatch = await compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
        }

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user._id.toString(),
            },
        };

        sign(
            payload,
            jwtSecret,
            { expiresIn: jwtExpiryTime },
            (err, token) => {
                if (err) {
                    throw err;
                }
                res.json({ token, id: user._id, name: user.name, email: user.email });
            },
        );
    } catch (error) {
        console.error(error.message);
        const msg = error.message || "Server error";
        return res.status(400).json({ errors: [{ msg }] });
    }
});