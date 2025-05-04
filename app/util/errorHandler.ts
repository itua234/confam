import { Request, Response, NextFunction } from 'express';
import AppError from './appError';

const { PORT, NODE_ENV } = process.env; 

const sendErrorDev = (err: AppError, res: Response) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrorProd = (err: AppError, res: Response) => {
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }else{
        // Programming or unknown errors
        console.error('ERROR 💥', err);
        res.status(500).json({
            status: "error",
            message: "Something went very wrong!"
        });
    }
}

export default (err: AppError, req: Request, res: Response, _next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    if(NODE_ENV === "development"){
        sendErrorDev(err, res);
    }else{
        let error = { ...err };
        sendErrorProd(error, res);
    }
};