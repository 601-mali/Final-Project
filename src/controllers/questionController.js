
const db = require("../configs/db");

// Check that an ID is a positive integer
function isValidId(id) {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
}

// 1. CREATE A QUESTION
async function createQuestion(req, res, next) {
    try {
        const { title, content, category_id } = req.body;

        if (
            typeof title !== "string" ||
            typeof content !== "string" ||
            title.trim().length < 10 ||
            title.trim().length > 150 ||
            content.trim().length < 20 ||
            content.trim().length > 5000 ||
            !isValidId(category_id)
        ) {
            return res.status(400).json({
                message:
                    "Title must be 10-150 characters, content 20-5000 characters, and category_id must be a positive integer."
            });
        }

        const [categories] = await db.promise().query(
            "SELECT id FROM categories WHERE id = ? AND is_active = TRUE",
            [Number(category_id)]
        );

        if (categories.length === 0) {
            return res.status(400).json({
                message: "The selected category does not exist or is inactive."
            });
        }

        const [result] = await db.promise().query(
            `INSERT INTO questions (user_id, category_id, title, content)
             VALUES (?, ?, ?, ?)`,
            [
                req.user.id,
                Number(category_id),
                title.trim(),
                content.trim()
            ]
        );

        return res.status(201).json({
            message: "Question created successfully.",
            question: {
                id: result.insertId,
                user_id: req.user.id,
                category_id: Number(category_id),
                title: title.trim(),
                content: content.trim()
            }
        });
    } catch (error) {
        next(error);
    }
}

// 2. GET ALL QUESTIONS WITH FILTERING AND PAGINATION
async function getQuestions(req, res, next) {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);

        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                message: "Page must be positive and limit must be between 1 and 100."
            });
        }

        const conditions = ["q.deleted_at IS NULL"];
        const params = [];

        if (req.query.category_id !== undefined) {
            if (!isValidId(req.query.category_id)) {
                return res.status(400).json({
                    message: "category_id must be a positive integer."
                });
            }

            conditions.push("q.category_id = ?");
            params.push(Number(req.query.category_id));
        }

        if (req.query.search !== undefined) {
            if (typeof req.query.search !== "string") {
                return res.status(400).json({
                    message: "Search must be a text value."
                });
            }

            conditions.push("(q.title LIKE ? OR q.content LIKE ?)");
            const searchTerm = `%${req.query.search.trim()}%`;
            params.push(searchTerm, searchTerm);
        }

        const whereClause = conditions.join(" AND ");

        const [countRows] = await db.promise().query(
            `SELECT COUNT(*) AS total
             FROM questions q
             WHERE ${whereClause}`,
            params
        );

        const total = countRows[0].total;
        const offset = (page - 1) * limit;

        const [questions] = await db.promise().query(
            `SELECT
                q.id,
                q.title,
                q.content,
                q.category_id,
                q.user_id,
                q.created_at,
                q.updated_at,
                c.name AS category_name,
                u.name AS author_name
             FROM questions q
             LEFT JOIN categories c ON q.category_id = c.id
             LEFT JOIN users u ON q.user_id = u.id
             WHERE ${whereClause}
             ORDER BY q.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return res.status(200).json({
            questions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
}

// 3. GET ONE QUESTION BY ID
async function getQuestionById(req, res, next) {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid question ID."
            });
        }

        const [questions] = await db.promise().query(
            `SELECT
                q.id,
                q.title,
                q.content,
                q.category_id,
                q.user_id,
                q.created_at,
                q.updated_at,
                c.name AS category_name,
                u.name AS author_name
             FROM questions q
             LEFT JOIN categories c ON q.category_id = c.id
             LEFT JOIN users u ON q.user_id = u.id
             WHERE q.id = ? AND q.deleted_at IS NULL
             LIMIT 1`,
            [Number(id)]
        );

        if (questions.length === 0) {
            return res.status(404).json({
                message: "Question not found."
            });
        }

        return res.status(200).json({
            question: questions[0]
        });
    } catch (error) {
        next(error);
    }
}

// 4. UPDATE A QUESTION
async function updateQuestion(req, res, next) {
    try {
        const { id } = req.params;
        const { title, content, category_id } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid question ID."
            });
        }

        const [questions] = await db.promise().query(
            `SELECT id, user_id, category_id, title, content
             FROM questions
             WHERE id = ? AND deleted_at IS NULL
             LIMIT 1`,
            [Number(id)]
        );

        if (questions.length === 0) {
            return res.status(404).json({
                message: "Question not found."
            });
        }

        const question = questions[0];

        if (
            !req.user ||
            (req.user.id !== question.user_id && req.user.role !== "ADMIN")
        ) {
            return res.status(403).json({
                message: "You cannot update another user's question."
            });
        }

        if (
            title === undefined &&
            content === undefined &&
            category_id === undefined
        ) {
            return res.status(400).json({
                message: "Provide at least one field to update."
            });
        }

        const newTitle = title === undefined ? question.title : title;
        const newContent = content === undefined ? question.content : content;
        const newCategoryId =
            category_id === undefined
                ? question.category_id
                : Number(category_id);

        if (
            typeof newTitle !== "string" ||
            newTitle.trim().length < 10 ||
            newTitle.trim().length > 150
        ) {
            return res.status(400).json({
                message: "Title must contain between 10 and 150 characters."
            });
        }

        if (
            typeof newContent !== "string" ||
            newContent.trim().length < 20 ||
            newContent.trim().length > 5000
        ) {
            return res.status(400).json({
                message: "Content must contain between 20 and 5000 characters."
            });
        }

        if (category_id !== undefined) {
            if (!isValidId(category_id)) {
                return res.status(400).json({
                    message: "category_id must be a positive integer."
                });
            }

            const [categories] = await db.promise().query(
                "SELECT id FROM categories WHERE id = ? AND is_active = TRUE",
                [newCategoryId]
            );

            if (categories.length === 0) {
                return res.status(400).json({
                    message: "The selected category does not exist or is inactive."
                });
            }
        }

        await db.promise().query(
            `UPDATE questions
             SET title = ?, content = ?, category_id = ?
             WHERE id = ? AND deleted_at IS NULL`,
            [
                newTitle.trim(),
                newContent.trim(),
                newCategoryId,
                Number(id)
            ]
        );

        return res.status(200).json({
            message: "Question updated successfully."
        });
    } catch (error) {
        next(error);
    }
}

// 5. DELETE A QUESTION (SOFT DELETE)
async function deleteQuestion(req, res, next) {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid question ID."
            });
        }

        const [questions] = await db.promise().query(
            `SELECT id, user_id
             FROM questions
             WHERE id = ? AND deleted_at IS NULL
             LIMIT 1`,
            [Number(id)]
        );

        if (questions.length === 0) {
            return res.status(404).json({
                message: "Question not found."
            });
        }

        const question = questions[0];

        if (
            !req.user ||
            (req.user.id !== question.user_id && req.user.role !== "ADMIN")
        ) {
            return res.status(403).json({
                message: "You cannot delete another user's question."
            });
        }

        await db.promise().query(
            "UPDATE questions SET deleted_at = NOW() WHERE id = ?",
            [Number(id)]
        );

        return res.status(200).json({
            message: "Question deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion
};
