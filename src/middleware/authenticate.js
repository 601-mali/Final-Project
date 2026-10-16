
const jwt = require("jsonwebtoken");
const db = require("../configs/db");

async function authenticate(req, res, next) {
    // 1. Get the token from the request header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access denied. Please log in."
        });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify the token
    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please log in again."
        });
    }

    // 3. Ensure the token contains the required information
    if (!decoded.id || !decoded.jti) {
        return res.status(401).json({
            message: "Invalid authentication token."
        });
    }

    try {
        // 4. Check whether the token has been revoked
        const [revokedTokens] = await db.promise().query(
            `SELECT jti
             FROM revoked_tokens
             WHERE jti = ? AND expires_at > NOW()
             LIMIT 1`,
            [decoded.jti]
        );

        if (revokedTokens.length > 0) {
            return res.status(401).json({
                message: "This token has been revoked. Please log in again."
            });
        }

        // 5. Check whether the user still exists and is active
        const [users] = await db.promise().query(
            `SELECT id, name, email, role, is_verified
             FROM users
             WHERE id = ? AND deleted_at IS NULL
             LIMIT 1`,
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "User account not found or inactive."
            });
        }

        // 6. Attach the user to the request
        req.user = users[0];

        next();

    } catch (error) {
        next(error);
    }
}

module.exports = authenticate;
