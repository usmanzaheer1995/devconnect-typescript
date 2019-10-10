import { Router, Request, Response } from "express";
import { check, validationResult } from "express-validator";
import request, { Options, Response as response } from "request";

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
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
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
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
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
            return res.status(500).json({ errors: [{ msg: "Server error" }] });
        }
    });

// @route   DELETE api/profile
// @desc    Delete profile, user & posts
// @access  Private
profileRouter.delete("/", authenticate, async (req: Request, res: Response) => {
    const userId = (req as IGetUserAuthInfoRequest).user.id;
    try {
        // TODO: Remove user's posts

        // Remove profile
        await Profile.findOneAndRemove({ user: userId });

        // Remove user
        await User.findOneAndRemove({ _id: userId });

        res.json({ msg: "User deleted" });

    } catch (error) {
        console.error(error.message);

        // error.kind is present on the error object
        if (error.kind === "ObjectId") {
            return res.status(400).json({ errors: [{ msg: "Profile not found" }] });
        }
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
profileRouter.put("/experience", [
    authenticate,
    check("title", "Title is required").not().isEmpty(),
    check("company", "Company is required").not().isEmpty(),
    check("from", "From date is required").not().isEmpty(),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as IGetUserAuthInfoRequest).user.id;
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
    };

    try {
        const profile = await Profile.findOneAndUpdate(
            { user: userId },
            {
                $push: {
                    experiences: {
                        $each: [newExp],
                        $position: 0,
                    }
                }
            },
            { new: true },
        ).lean();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete profile experience
// @access  Private
profileRouter.delete("/experience/:exp_id", authenticate, async (req: Request, res: Response) => {
    const userId = (req as IGetUserAuthInfoRequest).user.id;
    try {
        const profile = await Profile.findOneAndUpdate(
            { user: userId },
            { $pull: { "experiences": { _id: req.params.exp_id } } },
            { new: true },
        );

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(400).json({ errors: [{ msg: "Experience not found" }] });
        }
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
profileRouter.put("/education", [
    authenticate,
    check("school", "School is required").not().isEmpty(),
    check("degree", "Degree is required").not().isEmpty(),
    check("fieldofstudy", "Field of study is required").not().isEmpty(),
    check("from", "From date is required").not().isEmpty(),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as IGetUserAuthInfoRequest).user.id;
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
    };

    try {
        const profile = await Profile.findOneAndUpdate(
            { user: userId },
            {
                $push: {
                    education: {
                        $each: [newEdu],
                        $position: 0
                    }
                }
            },
            { new: true },
        ).lean();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete profile education
// @access  Private
profileRouter.delete("/education/:edu_id", authenticate, async (req: Request, res: Response) => {
    const userId = (req as IGetUserAuthInfoRequest).user.id;
    try {
        const profile = await Profile.findOneAndUpdate(
            { user: userId },
            { $pull: { "education": { _id: req.params.edu_id } } },
            { new: true },
        );

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(400).json({ errors: [{ msg: "Experience not found" }] });
        }
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});

// @route   GET api/profile/github/:username
// @desc    Get user repos from github
// @access  Public
profileRouter.get("/github/:username", async (req: Request, res: Response) => {
    const githubClientId = process.env.GITHUB_CLIENT_ID;
    const githubSecret = process.env.GITHUB_SECRET;
    try {
        if (!githubClientId || !githubSecret) {
            throw { message: "Missing environment variables" };
        }
        const options: Options = {
            uri: `https://api.github.com/users/${
                req.params.username
                }/repos?per_page=5&sort=created:asc&client_id=${
                githubClientId
                }&client_secret=${
                githubSecret
                }`,
            method: "GET",
            headers: { "user-agent": "node.js" },
        };

        request(options, (error, response: response, body) => {
            if (error) {
                throw error;
            }
            if (response.statusCode !== 200) {
                return res.status(404).json({ msg: "No github profile found" });
            }
            res.json(JSON.parse(body));
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
});
