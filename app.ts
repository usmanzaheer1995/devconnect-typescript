import express, { Application, urlencoded, json } from "express";
import { NextFunction, Request, Response } from "express";
import { resolve, join } from 'path';
import { authRouter, postsRouter, profileRouter, userRouter } from "./routes/api/api";

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

// Define Routes
// app.use("/api", router);
app.use('/api/users', authRouter);
app.use('/api/auth', postsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/posts', userRouter);

if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(join(__dirname, 'client', 'build', 'index.html'));
  });
}

export { app as default };
