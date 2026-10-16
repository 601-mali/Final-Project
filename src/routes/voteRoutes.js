
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");

const {
    voteOnQuestion,
    removeQuestionVote,
    voteOnAnswer,
    removeAnswerVote
} = require("../controllers/voteController");

// Vote on a question
router.post(
    "/questions/:id/vote",
    authenticate,
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid question ID."),
        body("vote_type")
            .isIn(["up", "down"])
            .withMessage("vote_type must be either 'up' or 'down'.")
    ],
    validate,
    voteOnQuestion
);

// Remove a question vote
router.delete(
    "/questions/:id/vote",
    authenticate,
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid question ID.")
    ],
    validate,
    removeQuestionVote
);

// Vote on an answer
router.post(
    "/answers/:id/vote",
    authenticate,
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid answer ID."),
        body("vote_type")
            .isIn(["up", "down"])
            .withMessage("vote_type must be either 'up' or 'down'.")
    ],
    validate,
    voteOnAnswer
);

// Remove an answer vote
router.delete(
    "/answers/:id/vote",
    authenticate,
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid answer ID.")
    ],
    validate,
    removeAnswerVote
);

module.exports = router;
