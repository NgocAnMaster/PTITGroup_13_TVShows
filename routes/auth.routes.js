const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { getUserCollection } = require("../models/User");


// 🔐 REGISTER
router.post("/register", async (req, res) => {
    try {
        const users = getUserCollection();
        const { username, email, password } = req.body;

        const existing = await users.findOne({ email });
        if (existing) return res.status(400).json({ error: "Email already exists" });

        const hashed = await bcrypt.hash(password, 10);

        const user = {
            username,
            email,
            password: hashed,
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
        const { email, password } = req.body;

        const user = await users.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;