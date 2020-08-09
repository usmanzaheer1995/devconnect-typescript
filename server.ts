import ConnectToMongodb from "./config/mongoose";
import app from './app';

const initialize = async () => {
    try {
        const db: string = process.env.MONGO_URI!;
        await ConnectToMongodb(db);

        const port = process.env.PORT || 5000;

        app.listen(port, () => console.log(`Server running on port ${port}!`));
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

initialize();
