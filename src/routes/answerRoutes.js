
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");

const {
    createAnswer,
    getAnswers,
    updateAnswer,
    deleteAnswer
} = require("../controllers/answerController");

// Public route: anyone can view answers
router.get(
    "/questions/:id/answers",
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid question ID.")
    ],
    validate,
    getAnswers
);

// Create an answer: login required
router.post(
    "/questions/:id/answers",
    authenticate,
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid question ID."),
        body("content")
            .isString()
            .withMessage("Answer content must be text.")
            .trim()
            .isLength({ min: 10, max: 2000 })
            .withMessage("Answer content must contain 10 to 2000 characters.")
    ],
    validate,
    createAnswer
);

// Update an answer: login required
router.patch(
    "/answers/:id",
    authenticate,
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid answer ID."),
        body("content")
            .isString()
            .withMessage("Answer content must be text.")
            .trim()
            .isLength({ min: 10, max: 2000 })
            .withMessage("Answer content must contain 10 to 2000 characters.")
    ],
    validate,
    updateAnswer
);

// Delete an answer: login required
router.delete(
    "/answers/:id",
    authenticate,
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid answer ID.")
    ],
    validate,
    deleteAnswer
);

module.exports = router;
