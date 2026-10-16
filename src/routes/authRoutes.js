
const express = require("express");
const router = express.Router();

const { body, param } = require("express-validator");
const validate = require("../middleware/validate");

const {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logout
} = require("../controllers/authController");

// Register a new account
router.post(
    "/register",
    [
        body("name")
            .isString().withMessage("Name must be text.")
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage("Name must contain 2 to 100 characters."),
        body("email")
            .isEmail()
            .withMessage("Enter a valid email address.")
            .normalizeEmail(),
        body("password")
            .isString().withMessage("Password must be text.")
            .isLength({ min: 8 })
            .withMessage("Password must contain at least 8 characters.")
    ],
    validate,
    register
);

// Log in
router.post(
    "/login",
    [
        body("email")
            .isEmail()
            .withMessage("Enter a valid email address.")
            .normalizeEmail(),
        body("password")
            .isString().withMessage("Password is required.")
            .notEmpty()
            .withMessage("Password is required.")
    ],
    validate,
    login
);

// Verify email address
router.get(
    "/verify-email/:token",
    [
        param("token")
            .isHexadecimal()
            .isLength({ min: 64, max: 64 })
            .withMessage("Invalid verification token.")
    ],
    validate,
    verifyEmail
);

// Request a password reset
router.post(
    "/forgot-password",
    [
        body("email")
            .isEmail()
            .withMessage("Enter a valid email address.")
            .normalizeEmail()
    ],
    validate,
    forgotPassword
);

// Set a new password
router.post(
    "/reset-password",
    [
        body("token")
            .isHexadecimal()
            .isLength({ min: 64, max: 64 })
            .withMessage("Invalid reset token."),
        body("password")
            .isString().withMessage("Password must be text.")
            .isLength({ min: 8 })
            .withMessage("New password must contain at least 8 characters.")
    ],
    validate,
    resetPassword
);

// Log out
router.post("/logout", logout);

module.exports = router;
