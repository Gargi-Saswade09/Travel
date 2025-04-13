import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        console.log("No Authorization header found");
        return res.sendStatus(401); // Unauthorized
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        console.log("Token not found in Authorization header");
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log("JWT verification failed:", err);
            return res.sendStatus(401); // Unauthorized
        }

        // Log the user info for debugging
        console.log("JWT Verified, user:", user);

        req.user = user;
        next();
    });
}

export default authenticateToken;