
const db = require("../configs/db");

function isValidId(id) {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
}

// 1. CREATE AN ANSWER
async function createAnswer(req, res, next) {
    try {
        const questionId = req.params.id;
        const { content } = req.body;

        if (!isValidId(questionId)) {
            return res.status(400).json({
                message: "Invalid question ID."
            });
        }

        if (
            typeof content !== "string" ||
            content.trim().length < 10 ||
            content.trim().length > 2000
        ) {
            return res.status(400).json({
                message: "Answer content must contain between 10 and 2000 characters."
            });
        }

        const [questions] = await db.promise().query(
            `SELECT id FROM questions
             WHERE id = ? AND deleted_at IS NULL`,
            [Number(questionId)]
        );

        if (questions.length === 0) {
            return res.status(404).json({
                message: "Question not found or deleted."
            });
        }

        const [result] = await db.promise().query(
            `INSERT INTO answers (question_id, user_id, content)
             VALUES (?, ?, ?)`,
            [Number(questionId), req.user.id, content.trim()]
        );

        return res.status(201).json({
            message: "Answer created successfully.",
            answer: {
                id: result.insertId,
                question_id: Number(questionId),
                user_id: req.user.id,
                content: content.trim()
            }
        });
    } catch (error) {
        next(error);
    }
}

// 2. GET ANSWERS FOR A QUESTION
async function getAnswers(req, res, next) {
    try {
        const questionId = req.params.id;
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);

        if (!isValidId(questionId)) {
            return res.status(400).json({
                message: "Invalid question ID."
            });
        }

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

        const [questions] = await db.promise().query(
            `SELECT id FROM questions
             WHERE id = ? AND deleted_at IS NULL`,
            [Number(questionId)]
        );

        if (questions.length === 0) {
            return res.status(404).json({
                message: "Question not found."
            });
        }

        const [countRows] = await db.promise().query(
            `SELECT COUNT(*) AS total
             FROM answers
             WHERE question_id = ? AND deleted_at IS NULL`,
            [Number(questionId)]
        );

        const total = countRows[0].total;
        const offset = (page - 1) * limit;

        const [answers] = await db.promise().query(
            `SELECT
                a.id,
                a.question_id,
                a.user_id,
                a.content,
                a.created_at,
                a.updated_at,
                u.name AS author_name
             FROM answers a
             LEFT JOIN users u ON a.user_id = u.id
             WHERE a.question_id = ? AND a.deleted_at IS NULL
             ORDER BY a.created_at ASC
             LIMIT ? OFFSET ?`,
            [Number(questionId), limit, offset]
        );

        return res.status(200).json({
            answers,
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

// 3. UPDATE AN ANSWER
async function updateAnswer(req, res, next) {
    try {
        const answerId = req.params.id;
        const { content } = req.body;

        if (!isValidId(answerId)) {
            return res.status(400).json({
                message: "Invalid answer ID."
            });
        }

        if (
            typeof content !== "string" ||
            content.trim().length < 10 ||
            content.trim().length > 2000
        ) {
            return res.status(400).json({
                message: "Answer content must contain between 10 and 2000 characters."
            });
        }

        const [answers] = await db.promise().query(
            `SELECT id, user_id FROM answers
             WHERE id = ? AND deleted_at IS NULL`,
            [Number(answerId)]
        );

        if (answers.length === 0) {
            return res.status(404).json({
                message: "Answer not found."
            });
        }

        const answer = answers[0];

        if (
            !req.user ||
            (req.user.id !== answer.user_id && req.user.role !== "ADMIN")
        ) {
            return res.status(403).json({
                message: "You cannot update another user's answer."
            });
        }

        await db.promise().query(
            `UPDATE answers
             SET content = ?
             WHERE id = ? AND deleted_at IS NULL`,
            [content.trim(), Number(answerId)]
        );

        return res.status(200).json({
            message: "Answer updated successfully."
        });
    } catch (error) {
        next(error);
    }
}

// 4. DELETE AN ANSWER (SOFT DELETE)
async function deleteAnswer(req, res, next) {
    try {
        const answerId = req.params.id;

        if (!isValidId(answerId)) {
            return res.status(400).json({
                message: "Invalid answer ID."
            });
        }

        const [answers] = await db.promise().query(
            `SELECT id, user_id FROM answers
             WHERE id = ? AND deleted_at IS NULL`,
            [Number(answerId)]
        );

        if (answers.length === 0) {
            return res.status(404).json({
                message: "Answer not found."
            });
        }

        const answer = answers[0];

        if (
            !req.user ||
            (req.user.id !== answer.user_id && req.user.role !== "ADMIN")
        ) {
            return res.status(403).json({
                message: "You cannot delete another user's answer."
            });
        }

        await db.promise().query(
            `UPDATE answers
             SET deleted_at = NOW()
             WHERE id = ? AND deleted_at IS NULL`,
            [Number(answerId)]
        );

        return res.status(200).json({
            message: "Answer deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createAnswer,
    getAnswers,
    updateAnswer,
    deleteAnswer
};
