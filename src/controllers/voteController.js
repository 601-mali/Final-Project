
const db = require("../configs/db");

function isValidId(id) {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
}

// 1. VOTE ON A QUESTION
async function voteOnQuestion(req, res, next) {
    try {
        const questionId = req.params.id;
        const { vote_type } = req.body;

        if (!isValidId(questionId)) {
            return res.status(400).json({
                message: "Invalid question ID."
            });
        }

        if (!["up", "down"].includes(vote_type)) {
            return res.status(400).json({
                message: "vote_type must be either 'up' or 'down'."
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

        await db.promise().query(
            `INSERT INTO votes (user_id, question_id, answer_id, vote_type)
             VALUES (?, ?, NULL, ?)`,
            [req.user.id, Number(questionId), vote_type]
        );

        return res.status(201).json({
            message: "Vote recorded successfully."
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "You have already voted on this question."
            });
        }

        next(error);
    }
}

// 2. REMOVE A QUESTION VOTE
async function removeQuestionVote(req, res, next) {
    try {
        const questionId = req.params.id;

        if (!isValidId(questionId)) {
            return res.status(400).json({
                message: "Invalid question ID."
            });
        }

        const [result] = await db.promise().query(
            `DELETE FROM votes
             WHERE user_id = ? AND question_id = ?`,
            [req.user.id, Number(questionId)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "You have not voted on this question."
            });
        }

        return res.status(200).json({
            message: "Question vote removed successfully."
        });
    } catch (error) {
        next(error);
    }
}

// 3. VOTE ON AN ANSWER
async function voteOnAnswer(req, res, next) {
    try {
        const answerId = req.params.id;
        const { vote_type } = req.body;

        if (!isValidId(answerId)) {
            return res.status(400).json({
                message: "Invalid answer ID."
            });
        }

        if (!["up", "down"].includes(vote_type)) {
            return res.status(400).json({
                message: "vote_type must be either 'up' or 'down'."
            });
        }

        const [answers] = await db.promise().query(
            `SELECT a.id
             FROM answers a
             INNER JOIN questions q ON q.id = a.question_id
             WHERE a.id = ?
               AND a.deleted_at IS NULL
               AND q.deleted_at IS NULL`,
            [Number(answerId)]
        );

        if (answers.length === 0) {
            return res.status(404).json({
                message: "Answer not found or its question has been deleted."
            });
        }

        await db.promise().query(
            `INSERT INTO votes (user_id, question_id, answer_id, vote_type)
             VALUES (?, NULL, ?, ?)`,
            [req.user.id, Number(answerId), vote_type]
        );

        return res.status(201).json({
            message: "Vote recorded successfully."
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "You have already voted on this answer."
            });
        }

        next(error);
    }
}

// 4. REMOVE AN ANSWER VOTE
async function removeAnswerVote(req, res, next) {
    try {
        const answerId = req.params.id;

        if (!isValidId(answerId)) {
            return res.status(400).json({
                message: "Invalid answer ID."
            });
        }

        const [result] = await db.promise().query(
            `DELETE FROM votes
             WHERE user_id = ? AND answer_id = ?`,
            [req.user.id, Number(answerId)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "You have not voted on this answer."
            });
        }

        return res.status(200).json({
            message: "Answer vote removed successfully."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    voteOnQuestion,
    removeQuestionVote,
    voteOnAnswer,
    removeAnswerVote
};
