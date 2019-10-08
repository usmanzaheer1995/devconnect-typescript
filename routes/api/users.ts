import { Router, Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { url } from "gravatar";
import { genSalt, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

import User from "../../models/User";

export const userRouter = Router();

// @route   POST api/users
// @desc    Register route
// @access  Public
userRouter.post("/register", [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Email is required").not().isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please add a password with 6 or more characters").not().isEmpty().isLength({ min: 6 }),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const jwtSecret: string = process.env.JWT_SECRET!;
    const jwtExpiryTime: number = parseInt(process.env.JWT_EXPIRY!, 10);

    const { name, email, password } = req.body;

    try {
        if (!jwtSecret || !jwtExpiryTime) {
            throw { message: "Environment variables not found" };
        }

        // See if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ errors: [{ msg: "User already exists" }] });
        }

        // Get users gravatar
        const avatar = url(email, {
            size: "200",
            rating: "pg",
            default: "mm",
        });

        // Encrypt password
        const salt = await genSalt(10);

        const newPassword = await hash(password, salt);

        user = new User({
            name,
            email,
            avatar,
            password: newPassword,
        });

        await user.save();

        // Return jsonwebtoken

        const payload = {
            user: {
                id: user.id,
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
                res.json({ token });
            },
        );
    } catch (error) {
        console.error(error.message);
        const msg = error.message || "Server error";
        return res.status(400).json({ errors: [{ msg }] });
    }
});
