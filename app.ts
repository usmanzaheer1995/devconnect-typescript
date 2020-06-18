import express, { Application, urlencoded, json } from "express";
import { NextFunction, Request, Response } from "express";

import { config } from "dotenv";
import router from "./routes/routes";

if (process.env.NODE_ENV === 'testing') {
  config({ path: './config/.test.env' });

} else if (process.env.NODE_ENV === 'development') {
  config({ path: './config/.env' });
}

const app: Application = express();

app.use(json());
app.use(urlencoded({ extended: true }));
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!!');
});

app.use("/api", router);

export { app as default };
