
const db = require("../configs/db");

function isValidId(id) {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
}

// 1. GET ALL USERS
async function getUsers(req, res, next) {
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
                message: "Invalid pagination values."
            });
        }

        const offset = (page - 1) * limit;
        const search = typeof req.query.search === "string"
            ? req.query.search.trim()
            : "";

        const searchTerm = `%${search}%`;

        const [users] = await db.promise().query(
            `SELECT id, name, email, role, is_verified, created_at
             FROM users
             WHERE deleted_at IS NULL
               AND (name LIKE ? OR email LIKE ?)
             ORDER BY id DESC
             LIMIT ? OFFSET ?`,
            [searchTerm, searchTerm, limit, offset]
        );

        const [countResult] = await db.promise().query(
            `SELECT COUNT(*) AS total
             FROM users
             WHERE deleted_at IS NULL
               AND (name LIKE ? OR email LIKE ?)`,
            [searchTerm, searchTerm]
        );

        const total = countResult[0].total;

        return res.status(200).json({
            message: "Users retrieved successfully.",
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            users
        });
    } catch (error) {
        next(error);
    }
}

// 2. CHANGE A USER'S ROLE
async function updateUserRole(req, res, next) {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        if (!isValidId(userId)) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        if (!["USER", "ADMIN"].includes(role)) {
            return res.status(400).json({
                message: "Role must be USER or ADMIN."
            });
        }

        if (Number(userId) === Number(req.user.id)) {
            return res.status(400).json({
                message: "You cannot change your own role."
            });
        }

        const [result] = await db.promise().query(
            `UPDATE users
             SET role = ?
             WHERE id = ? AND deleted_at IS NULL`,
            [role, Number(userId)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            message: "User role updated successfully."
        });
    } catch (error) {
        next(error);
    }
}

// 3. DEACTIVATE A USER ACCOUNT
async function deactivateUser(req, res, next) {
    try {
        const userId = req.params.id;

        if (!isValidId(userId)) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        if (Number(userId) === Number(req.user.id)) {
            return res.status(400).json({
                message: "You cannot deactivate your own account."
            });
        }

        const [result] = await db.promise().query(
            `UPDATE users
             SET deleted_at = CURRENT_TIMESTAMP
             WHERE id = ? AND deleted_at IS NULL`,
            [Number(userId)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found or already deactivated."
            });
        }

        return res.status(200).json({
            message: "User account deactivated successfully."
        });
    } catch (error) {
        next(error);
    }
}


 // . REACTIVATE A USER ACCOUNT
async function reactivateUser(req, res, next) {
    try {
        const userId = req.params.id;

        if (!isValidId(userId)) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        // Check whether the user exists
        const [users] = await db.promise().query(
            "SELECT id, deleted_at FROM users WHERE id = ?",
            [Number(userId)]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Check whether the account is already active
        if (users[0].deleted_at === null) {
            return res.status(400).json({
                message: "User account is already active."
            });
        }

        // Reactivate the account
        await db.promise().query(
            `UPDATE users
             SET deleted_at = NULL
             WHERE id = ?`,
            [Number(userId)]
        );

        return res.status(200).json({
            message: "User account reactivated successfully."
        });
    } catch (error) {
        next(error);
    }
}

// 4. ADMIN DELETES A QUESTION
async function deleteQuestion(req, res, next) {
    try {
        const questionId = req.params.id;

        if (!isValidId(questionId)) {
            return res.status(400).json({
                message: "Invalid question ID."
            });
        }

        const [result] = await db.promise().query(
            `UPDATE questions
             SET deleted_at = CURRENT_TIMESTAMP
             WHERE id = ? AND deleted_at IS NULL`,
            [Number(questionId)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Question not found or already deleted."
            });
        }

        return res.status(200).json({
            message: "Question deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}

// 5. ADMIN DELETES AN ANSWER
async function deleteAnswer(req, res, next) {
    try {
        const answerId = req.params.id;

        if (!isValidId(answerId)) {
            return res.status(400).json({
                message: "Invalid answer ID."
            });
        }

        const [result] = await db.promise().query(
            `UPDATE answers
             SET deleted_at = CURRENT_TIMESTAMP
             WHERE id = ? AND deleted_at IS NULL`,
            [Number(answerId)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Answer not found or already deleted."
            });
        }

        return res.status(200).json({
            message: "Answer deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}

// 6. CREATE A CATEGORY
async function createCategory(req, res, next) {
    try {
        const { name, description } = req.body;

        if (
            typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 100
        ) {
            return res.status(400).json({
                message: "Category name must contain 2 to 100 characters."
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                message: "Description must be text."
            });
        }

        const cleanName = name.trim();
        const cleanDescription = description ? description.trim() : null;

        const [existing] = await db.promise().query(
            `SELECT id FROM categories WHERE name = ?`,
            [cleanName]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "A category with this name already exists."
            });
        }

        const [result] = await db.promise().query(
            `INSERT INTO categories (name, description, is_active)
             VALUES (?, ?, TRUE)`,
            [cleanName, cleanDescription]
        );

        return res.status(201).json({
            message: "Category created successfully.",
            category: {
                id: result.insertId,
                name: cleanName,
                description: cleanDescription
            }
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "A category with this name already exists."
            });
        }

        next(error);
    }
}

// 7. UPDATE A CATEGORY
async function updateCategory(req, res, next) {
    try {
        const categoryId = req.params.id;
        const { name, description } = req.body;

        if (!isValidId(categoryId)) {
            return res.status(400).json({
                message: "Invalid category ID."
            });
        }

        if (name === undefined && description === undefined) {
            return res.status(400).json({
                message: "Provide a name or description to update."
            });
        }

        if (
            name !== undefined &&
            (typeof name !== "string" ||
                name.trim().length < 2 ||
                name.trim().length > 100)
        ) {
            return res.status(400).json({
                message: "Category name must contain 2 to 100 characters."
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                message: "Description must be text."
            });
        }

        const [categories] = await db.promise().query(
            `SELECT id FROM categories
             WHERE id = ? AND is_active = TRUE`,
            [Number(categoryId)]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                message: "Active category not found."
            });
        }

        if (name !== undefined) {
            const [existing] = await db.promise().query(
                `SELECT id FROM categories
                 WHERE name = ? AND id <> ?`,
                [name.trim(), Number(categoryId)]
            );

            if (existing.length > 0) {
                return res.status(409).json({
                    message: "A category with this name already exists."
                });
            }
        }

        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push("name = ?");
            values.push(name.trim());
        }

        if (description !== undefined) {
            updates.push("description = ?");
            values.push(description === null ? null : description.trim());
        }

        values.push(Number(categoryId));

        await db.promise().query(
            `UPDATE categories
             SET ${updates.join(", ")}
             WHERE id = ? AND is_active = TRUE`,
            values
        );

        return res.status(200).json({
            message: "Category updated successfully."
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "A category with this name already exists."
            });
        }

        next(error);
    }
}

// 8. DEACTIVATE A CATEGORY
async function deleteCategory(req, res, next) {
    try {
        const categoryId = req.params.id;

        if (!isValidId(categoryId)) {
            return res.status(400).json({
                message: "Invalid category ID."
            });
        }

        const [result] = await db.promise().query(
            `UPDATE categories
             SET is_active = FALSE
             WHERE id = ? AND is_active = TRUE`,
            [Number(categoryId)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Category not found or already deactivated."
            });
        }

        return res.status(200).json({
            message: "Category deactivated successfully."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getUsers,
    updateUserRole,
    deactivateUser,
    reactivateUser,
    deleteQuestion,
    deleteAnswer,
    createCategory,
    updateCategory,
    deleteCategory
};