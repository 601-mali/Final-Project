
const db = require("../configs/db");

// GET ALL ACTIVE CATEGORIES
async function getCategories(req, res, next) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                message: "Page must be at least 1, and limit must be between 1 and 100."
            });
        }

        const offset = (page - 1) * limit;

        const [categories] = await db.promise().query(
            `SELECT id, name, description
             FROM categories
             WHERE is_active = TRUE
             ORDER BY name ASC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [countResult] = await db.promise().query(
            `SELECT COUNT(*) AS total
             FROM categories
             WHERE is_active = TRUE`
        );

        const total = countResult[0].total;

        return res.status(200).json({
            message: "Categories retrieved successfully.",
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            categories
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getCategories
};
