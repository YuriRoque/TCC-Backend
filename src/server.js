import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';

import connectDB from './config/DB.js';
import { TSVRouter } from './routes/ImportTSVRoute.js';
import PictureRouter from './routes/PictureRoute.js';

dotenv.config();

const app = express();

await connectDB();

const SERVER_PORT = process.env.SERVER_PORT;

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());
app.use(PictureRouter);
app.use(TSVRouter);

app.listen(SERVER_PORT, () =>
  console.log(`Server is running on PORT ${SERVER_PORT}`),
);
