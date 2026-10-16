
require("dotenv").config();

const express = require("express");
const db = require("./configs/db");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

const authRoutes = require("./routes/authRoutes");
const questionRoutes = require("./routes/questionRoutes");
const answerRoutes = require("./routes/answerRoutes");
const voteRoutes = require("./routes/voteRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes = require("./routes/adminRoutes");


// Parse incoming JSON request bodies
app.use(express.json());
 
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api", answerRoutes);
app.use("/api", voteRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);

// Basic health-check route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Community Q&A Platform API is running"
    });
});

// Check the database connection
app.get("/api/health", async (req, res, next) => {
    try {
        await db.promise().query("SELECT 1");

        res.status(200).json({
            message: "API and database are working"
        });
    } catch (error) {
        next(error);
    }
});

// Handle unknown routes
app.use(notFound);

// Handle application errors
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
//{node .\node_modules\nodemon\bin\nodemon.js .\src\app.js}, use this command to run the server with nodemon for auto-restart on changes