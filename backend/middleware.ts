import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {

    const token = req.cookies.accessToken;

    if(!token) {
        return res.status(401).json({error: "Unauthorized"});
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY!);
        (req as any).user = decoded;
        next();
    } catch(err) {
        return res.status(403).json({error: "Invalid or expired token"});
    }

}
