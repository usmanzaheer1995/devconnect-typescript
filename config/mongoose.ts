import { connect } from "mongoose";

export default async (mongoDbUri: string) => {
    try {
        await connect(mongoDbUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB Connected');
    } catch (error) {
        throw error;
    }
};
