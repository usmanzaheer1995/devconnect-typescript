import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { IGetUserAuthInfoRequest, IDecodedToken } from "../interfaces/interfaces";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    // Get token from header
    let token = req.header("Authorization") || req.header("x-auth-token");

    // Check if not token
    if (!token) {
        return res.status(401).json({ errors: [{ msg: "No token, authorization denied" }] });
    }

    token = token.replace('Bearer ', '');

    // verify token
    try {
        const decoded = verify(token, process.env.JWT_SECRET!);

        (req as IGetUserAuthInfoRequest).user = (decoded as IDecodedToken).user;
        next();
    } catch (error) {
        res.status(401).json({ errors: [{ msg: "Token is not valid" }] });
    }
}
