import { ObjectID } from "mongodb";

export interface IPostModel {
    _id: ObjectID;
    id?: string;
    user: string;
    text: string;
    name?: string;
    avatar?: string;
    likes?: [{
        user: string;
    }];
    comments?: [{
        user: string;
        text: string;
        name?: string;
        avatar?: string;
        date?: Date,
    }];
    date?: Date;
}
