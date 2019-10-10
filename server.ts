import express, { Application, urlencoded, json } from "express";
import { config } from "dotenv";

import ConnectToMongodb from "./config/mongoose";
import router from "./routes/routes";
import { NextFunction, Request, Response } from "express";

config();

const app: Application = express();

app.use(json());
app.use(urlencoded({ extended: true }));
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!!');
});

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
