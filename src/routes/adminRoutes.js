
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { body, param, query } = require("express-validator");
const validate = require("../middleware/validate");

const {
    getUsers,
    updateUserRole,
    deactivateUser,
    reactivateUser,
    deleteQuestion,
    deleteAnswer,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/adminController");

// All admin routes require login and the ADMIN role
router.use(authenticate, authorize("ADMIN"));

// View users with pagination and optional search
router.get(
    "/users",
    [
        query("page").optional().isInt({ min: 1 })
            .withMessage("Page must be a positive integer."),
        query("limit").optional().isInt({ min: 1, max: 100 })
            .withMessage("Limit must be between 1 and 100."),
        query("search").optional().isString()
            .withMessage("Search must be text.")
    ],
    validate,
    getUsers
);

// Change a user's role
router.patch(
    "/users/:id/role",
    [
        param("id").isInt({ min: 1 })
            .withMessage("Invalid user ID."),
        body("role").isIn(["USER", "ADMIN"])
            .withMessage("Role must be USER or ADMIN.")
    ],
    validate,
    updateUserRole
);

// Deactivate a user
router.delete(
    "/users/:id",
    [param("id").isInt({ min: 1 }).withMessage("Invalid user ID.")],
    validate,
    deactivateUser
);
// Reactivate a user
router.patch(
    "/users/:id/reactivate",
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid user ID.")
    ],
    validate,
    reactivateUser
);
// Delete a question
router.delete(
    "/questions/:id",
    [param("id").isInt({ min: 1 }).withMessage("Invalid question ID.")],
    validate,
    deleteQuestion
);

// Delete an answer
router.delete(
    "/answers/:id",
    [param("id").isInt({ min: 1 }).withMessage("Invalid answer ID.")],
    validate,
    deleteAnswer
);

// Create a category
router.post(
    "/categories",
    [
        body("name").isString().trim().isLength({ min: 2, max: 100 })
            .withMessage("Category name must contain 2 to 100 characters."),
        body("description").optional({ nullable: true }).isString()
            .withMessage("Description must be text.")
    ],
    validate,
    createCategory
);

// Update a category
router.patch(
    "/categories/:id",
    [
        param("id").isInt({ min: 1 }).withMessage("Invalid category ID."),
        body("name").optional().isString().trim()
            .isLength({ min: 2, max: 100 })
            .withMessage("Category name must contain 2 to 100 characters."),
        body("description").optional({ nullable: true }).isString()
            .withMessage("Description must be text.")
    ],
    validate,
    updateCategory
);

// Deactivate a category
router.delete(
    "/categories/:id",
    [param("id").isInt({ min: 1 }).withMessage("Invalid category ID.")],
    validate,
    deleteCategory
);

module.exports = router;
