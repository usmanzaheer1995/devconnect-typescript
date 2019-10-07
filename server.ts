import express, { Application, urlencoded, json } from "express";
import { config } from "dotenv";

import ConnectToMongodb from "./config/mongoose";
import router from "./routes/routes";

config();

const app: Application = express();

app.use(json());
app.use(urlencoded({ extended: true }));

const initialize = async () => {
    try {
        const db: string = process.env.MONGO_URI!;
        await ConnectToMongodb(db);

        app.use("/api", router);

        const port = process.env.PORT || 5000;

        app.listen(port, () => console.log(`Server running on port ${port}`));

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

initialize();
