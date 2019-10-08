import { ObjectID } from "mongodb";

export interface IUserModel {
    _id: ObjectID;
    id?: string;
    name: string;
    email: string;
    password: string;
    avatar: string;
    date: Date;
}
