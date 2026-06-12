const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { getUserCollection } = require("../models/User");

function auth(roles = []) {
    return async (req, res, next) => {
        const header = req.headers.authorization || req.headers["Authorization"];
        if (!header || !header.toLowerCase().startsWith("bearer ")) {
            return res.status(401).json({ error: "No token or invalid format" });
        }

        const token = header.split(" ")[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Extract the user record directly using the database utility
            const users = getUserCollection();
            const user = await users.findOne({ _id: new ObjectId(decoded.id) });

            if (!user) {
                return res.status(401).json({ error: "User profile no longer exists" });
            }

            // Check roles allowance matrix securely
            if (roles.length && !roles.includes(user.role)) {
                return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
            }

            // Attach everything to req object safely
            req.user = user;
            req.user.id = user._id.toString(); // Backwards compatibility for req.user.id route dependencies

            next();
        } catch (err) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
    };
}

module.exports = auth;