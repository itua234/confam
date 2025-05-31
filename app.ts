import express, { Application, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import csrf from 'csurf';
dotenv.config();
import 'module-alias/register';
// import './app/services/queues';
const user = require("./user.json");

import db from './models'
import api from './routes/api';
import web from './routes/web';
// import jwt from 'jsonwebtoken';
import AppError from '@util/appError';
import globalErrorHandler from '@util/errorHandler';

const app: Application = express();

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',')
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

// Security middleware
app.use(helmet());

// app.use(csrf());
// app.use((req, res, next) => {
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });

// Rate limiting
// const limiter = rateLimit({
//   max: 5, // limit each IP to 5 requests per windowMs
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   message: 'Too many verification attempts, please try again later'
// });

const { PORT, NODE_ENV } = process.env;

// Error handling for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error: Error) => {
  console.error('FATAL ERROR 💥', error);
});
process.on('unhandledRejection', (error: Error) => {
  console.error('UNHANDLED REJECTION 💥', error);
});
// Add this for graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED.');
});

// Start the server
async function startServer() {
  try {   
    // Always authenticate first
    await db.sequelize.authenticate();
    console.log('Connection has been established successfully.');
    // Only authenticate on first start, not on every reload
    // if (!db.sequelize.connectionManager.hasOwnProperty('getConnection')) {
    //   if (process.env.FORCE_DB_SYNC === 'true') {
    //     const syncOptions = NODE_ENV == "development" ? {} : { alter: false };
    //     await db.sequelize.sync(syncOptions);
    //     console.log('Connection has been established successfully.');
    //   }
    // }
  } catch (err) {
    console.log('Unable to connect to the database:', err);
  }
}

useRoutes();
app.listen(PORT, () => {
  console.log(`[START] Server running on Port: ${PORT}`);
});
startServer().catch(console.log);

// Routes configuration
function useRoutes(): void {
  // Apply rate limiter to API routes
  //app.use('/api', limiter);

  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' http://127.0.0.1:8080 'unsafe-inline'"
    );
    next();
  });

  // Route to render test page
  app.get('/', async (req: Request, res: Response) => {
    //await client.set("foo", "bar");
    res.render('allow', {
      user: user,
    });
  });
  // Main routes
  app.use('/', web);
  app.use('/api/v1', api);

  // Handling unhandled routes for all HTTP methods
  app.all("*", (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
  });

  // Global error handler
  app.use(globalErrorHandler);
}
export default app;