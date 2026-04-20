const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { getUserCollection } = require("../models/User");


// 🔐 REGISTER
router.post("/register", async (req, res) => {
    try {
        const users = getUserCollection();
        const { username, email, password, country } = req.body;

        const existing = await users.findOne({ username });
        if (existing) return res.status(400).json({ error: "Username already exists" });

        const hashed = await bcrypt.hash(password, 10);

        const user = {
            username,
            email,
            password: hashed,
            country,
            role: "user",
            createdAt: new Date(),
            history: []
        };

        await users.insertOne(user);

        res.json({ message: "User registered successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 🔐 LOGIN
router.post("/login", async (req, res) => {
    try {
        const users = getUserCollection();
        const { username, password } = req.body;

        const user = await users.findOne({ username });
        if (!user) return res.status(400).json({ error: "Invalid username" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: "Wrong password" });

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing in .env");
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: {
                id: user._id.toString(),
                role: user.role,
                username: user.username
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;