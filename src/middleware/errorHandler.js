
function errorHandler(err, req, res, next) {
    console.error(err.stack || err.message);

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        message:
            statusCode === 500
                ? "An internal server error occurred."
                : err.message
    });
}

module.exports = errorHandler;
