
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");

const {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion
} = require("../controllers/questionController");

// Public routes: anyone can view questions
router.get("/", getQuestions);
router.get("/:id", getQuestionById);

// Create a question: login required
router.post(
    "/",
    authenticate,
    [
        body("title")
            .isString().withMessage("Title must be text.")
            .trim()
            .isLength({ min: 10, max: 150 })
            .withMessage("Title must contain 10 to 150 characters."),

        body("content")
            .isString().withMessage("Content must be text.")
            .trim()
            .isLength({ min: 20, max: 5000 })
            .withMessage("Content must contain 20 to 5000 characters."),

        body("category_id")
            .isInt({ min: 1 })
            .withMessage("category_id must be a positive integer.")
    ],
    validate,
    createQuestion
);

// Update a question: login required
router.patch(
    "/:id",
    authenticate,
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid question ID."),

        body("title")
            .optional()
            .isString().withMessage("Title must be text.")
            .trim()
            .isLength({ min: 10, max: 150 })
            .withMessage("Title must contain 10 to 150 characters."),

        body("content")
            .optional()
            .isString().withMessage("Content must be text.")
            .trim()
            .isLength({ min: 20, max: 5000 })
            .withMessage("Content must contain 20 to 5000 characters."),

        body("category_id")
            .optional()
            .isInt({ min: 1 })
            .withMessage("category_id must be a positive integer.")
    ],
    validate,
    updateQuestion
);

// Delete a question: login required
router.delete(
    "/:id",
    authenticate,
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid question ID.")
    ],
    validate,
    deleteQuestion
);

module.exports = router;
