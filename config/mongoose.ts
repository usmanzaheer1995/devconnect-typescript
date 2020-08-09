import { connect } from "mongoose";

const connectToDB = async (mongoDbUri: string) => {
    try {
        await connect(
            mongoDbUri,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useCreateIndex: true,
                useFindAndModify: false,
            },
        );
        console.log('MongoDB Connected');
    } catch (error) {
        throw error;
    }
};

export default connectToDB;
