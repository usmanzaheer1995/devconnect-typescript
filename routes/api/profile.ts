import { Router, Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { Types } from "mongoose";

import { authenticate } from "../../middleware/middleware";
import Profile from "../../models/Profile";
import User from "../../models/Profile";
import { IGetUserAuthInfoRequest, IProfile } from "../../interfaces/interfaces";

export const profileRouter = Router();

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
profileRouter.get("/me", authenticate, async (req: Request, res: Response) => {
    try {
        const profile = await Profile
            .findOne({ user: (req as IGetUserAuthInfoRequest).user.id })
            .populate("user", ["name", "avatar"]);
        if (!profile) {
            return res.status(400).json({ errors: [{ msg: "There is no profile for this user" }] });
        }

        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
    res.send("Profile response");
});

// @route   POST api/profile
// @desc    Create or update user's profile
// @access  Private
profileRouter.post("/", [
    authenticate,
    check("status", "Status is required").not().isEmpty(),
    check("skills", "Status is required").not().isEmpty(),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as IGetUserAuthInfoRequest).user.id;

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin,
    } = req.body;

    // Build profile object
    const profileFields: IProfile = {
        user: userId,
        status,
        skills: skills.split(",").map((skill: string) => skill.trim()),
    };

    if (company) { profileFields.company = company; }
    if (website) { profileFields.website = website; }
    if (location) { profileFields.location = location; }
    if (bio) { profileFields.bio = bio; }
    if (githubusername) { profileFields.githubusername = githubusername; }

    profileFields.social = {};
    if (youtube) { profileFields.social.youtube = youtube; }
    if (twitter) { profileFields.social.twitter = twitter; }
    if (facebook) { profileFields.social.facebook = facebook; }
    if (linkedin) { profileFields.social.linkedin = linkedin; }
    if (instagram) { profileFields.social.instagram = instagram; }

    try {
        let profile = await Profile.findOne({ user: userId });

        if (profile) {
            // Update
            profile = await Profile.findOneAndUpdate(
                { user: userId },
                { $set: profileFields },
                { new: true },
            );

            return res.json(profile);
        }

        // Create
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
profileRouter.get("/", async (req: Request, res: Response) => {
    const offset = req.query.offset ? +req.query.offset : 0;
    const limit = req.query.limit ? +req.query.limit : 10;
    try {
        const [profiles, count] = await Promise.all([
            Profile.find().populate("user", ["name", "avatar"]).skip(offset).limit(limit).lean(),
            Profile.find().countDocuments(),
        ]);
        res.json({
            profiles,
            count,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user id
// @access  Public
profileRouter.get("/user/:user_id",
    async (req: Request, res: Response) => {
        try {
            const profile =
                await Profile
                    .findOne({ user: req.params.user_id })
                    .populate("user", ["name", "avatar"]).lean();
            if (!profile) {
                return res.status(400).json({ errors: [{ msg: "Profile not found" }] });
            }
            res.json(profile);
        } catch (error) {
            console.error(error.message);

            // error.kind is present on the error object
            if (error.kind === "ObjectId") {
                return res.status(400).json({ errors: [{ msg: "Profile not found" }] });
            }
            return res.status(400).json({ errors: [{ msg: "Server error" }] });
        }
    });
