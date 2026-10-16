
function authorize(...allowedRoles) {
    return (req, res, next) => {
        // Authenticate middleware must run first
        if (!req.user) {
            return res.status(401).json({
                message: "Please log in first."
            });
        }

        // Check whether the user's role is permitted
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to perform this action."
            });
        }

        next();
    };
}

module.exports = authorize;