
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const db = require("../configs/db");

// Create a Gmail transporter for sending emails
function createTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        throw new Error("Email credentials are not configured.");
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });
}

// Hash a token before storing it in the database
function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

// Send an email
async function sendEmail(to, subject, text) {
    const transporter = createTransporter();

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    });
}

// 1. REGISTER
async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Name, email, and password are required."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanName.length < 2) {
            return res.status(400).json({
                message: "Name must contain at least 2 characters."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        const [existingUsers] = await db.promise().query(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenHash = hashToken(verificationToken);

        const verificationExpiresAt = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        );

        const [result] = await db.promise().query(
            `INSERT INTO users
                (name, email, password_hash, role, is_verified,
                 verification_token_hash, verification_expires_at)
             VALUES (?, ?, ?, 'USER', FALSE, ?, ?)`,
            [
                cleanName,
                cleanEmail,
                passwordHash,
                verificationTokenHash,
                verificationExpiresAt
            ]
        );

        const verificationUrl =
            `http://localhost:${process.env.PORT || 3000}` +
            `/api/auth/verify-email/${verificationToken}`;

        try {
            await sendEmail(
                cleanEmail,
                "Verify your Community Q&A Platform account",
                `Hello ${cleanName},\n\n` +
                `Please verify your email by opening this link:\n` +
                `${verificationUrl}\n\n` +
                "This link expires in 24 hours."
            );
        } catch (emailError) {
            // Keep the account, but do not expose the verification token.
            // Email delivery can be retried through a future resend feature.
            console.error("Verification email failed:", emailError.message);

            return res.status(201).json({
                message:
                    "Your account was created, but the verification email " +
                    "could not be sent. Please contact support."
            });
        }

        return res.status(201).json({
            message: "Registration successful. Check your email to verify your account.",
            userId: result.insertId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        next(error);
    }
}

// 2. LOGIN
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [users] = await db.promise().query(
            `SELECT id, name, email, password_hash, role, is_verified
             FROM users
             WHERE email = ? AND deleted_at IS NULL
             LIMIT 1`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (!user.is_verified) {
            return res.status(403).json({
                message: "Please verify your email before logging in."
            });
        }

        if (!process.env.JWT_SECRET ||
            process.env.JWT_SECRET === "replace_this_with_a_long_random_secret") {
            throw new Error("Set a strong JWT_SECRET in your .env file.");
        }

        const jti = crypto.randomUUID();

        const token = jwt.sign(
            {
                id: user.id,
                jti
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        return res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
}

// 3. VERIFY EMAIL
async function verifyEmail(req, res, next) {
    try {
        const { token } = req.params;

        if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
            return res.status(400).json({
                message: "Invalid verification token."
            });
        }

        const tokenHash = hashToken(token);

        const [result] = await db.promise().query(
            `UPDATE users
             SET is_verified = TRUE,
                 verification_token_hash = NULL,
                 verification_expires_at = NULL
             WHERE verification_token_hash = ?
               AND verification_expires_at > NOW()
               AND is_verified = FALSE
               AND deleted_at IS NULL`,
            [tokenHash]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Verification token is invalid, expired, or already used."
            });
        }

        return res.status(200).json({
            message: "Email verified successfully. You can now log in."
        });
    } catch (error) {
        next(error);
    }
}

// 4. FORGOT PASSWORD
async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [users] = await db.promise().query(
            `SELECT id, name, email
             FROM users
             WHERE email = ? AND deleted_at IS NULL
             LIMIT 1`,
            [cleanEmail]
        );

        // Use the same response whether or not the email exists.
        const responseMessage =
            "If an account exists for that email, password reset instructions will be sent.";

        if (users.length === 0) {
            return res.status(200).json({
                message: responseMessage
            });
        }

        const user = users[0];
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = hashToken(resetToken);

        const resetExpiresAt = new Date(
            Date.now() + 60 * 60 * 1000
        );

        await db.promise().query(
            `UPDATE users
             SET reset_token_hash = ?,
                 reset_expires_at = ?
             WHERE id = ?`,
            [resetTokenHash, resetExpiresAt, user.id]
        );

        const resetUrl =
            `http://localhost:${process.env.PORT || 3000}` +
            `/reset-password?token=${resetToken}`;

        try {
            await sendEmail(
                user.email,
                "Reset your Community Q&A Platform password",
                `Hello ${user.name},\n\n` +
                `Use this token to reset your password:\n${resetToken}\n\n` +
                `Reset link for your application:\n${resetUrl}\n\n` +
                "This token expires in one hour. If you did not request " +
                "a reset, you can ignore this email."
            );
        } catch (emailError) {
            console.error("Password reset email failed:", emailError.message);

            await db.promise().query(
                `UPDATE users
                 SET reset_token_hash = NULL,
                     reset_expires_at = NULL
                 WHERE id = ?`,
                [user.id]
            );

            return res.status(500).json({
                message: "Unable to send the password reset email. Please try again later."
            });
        }

        return res.status(200).json({
            message: responseMessage
        });
    } catch (error) {
        next(error);
    }
}

// 5. RESET PASSWORD
async function resetPassword(req, res, next) {
    try {
        const { token, password } = req.body;

        if (
            typeof token !== "string" ||
            !/^[a-f0-9]{64}$/i.test(token) ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "A valid reset token and new password are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        const tokenHash = hashToken(token);
        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await db.promise().query(
            `UPDATE users
             SET password_hash = ?,
                 reset_token_hash = NULL,
                 reset_expires_at = NULL
             WHERE reset_token_hash = ?
               AND reset_expires_at > NOW()
               AND deleted_at IS NULL`,
            [passwordHash, tokenHash]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Reset token is invalid, expired, or already used."
            });
        }

        return res.status(200).json({
            message: "Password reset successful. Please log in with your new password."
        });
    } catch (error) {
        next(error);
    }
}

// 6. LOGOUT
async function logout(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Please provide your login token."
            });
        }

        const token = authHeader.split(" ")[1];

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({
                message: "Invalid or expired token."
            });
        }

        if (!decoded.id || !decoded.jti || !decoded.exp) {
            return res.status(401).json({
                message: "Invalid authentication token."
            });
        }

        const expiresAt = new Date(decoded.exp * 1000);

        await db.promise().query(
            `INSERT INTO revoked_tokens (jti, user_id, expires_at, revoked_at)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE revoked_at = NOW()`,
            [decoded.jti, decoded.id, expiresAt]
        );

        return res.status(200).json({
            message: "Logout successful."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logout
};
