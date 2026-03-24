const jwt = require("jsonwebtoken");

// function auth(requiredRole = null) {
//     return (req, res, next) => {
//         const header = req.headers.authorization;

//         if (!header) return res.status(401).json({ error: "No token" });

//         const token = header.split(" ")[1];

//         try {
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);

//             if (requiredRole && decoded.role !== requiredRole) {
//                 return res.status(403).json({ error: "Forbidden" });
//             }

//             req.user = decoded;
//             next();

//         } catch (err) {
//             res.status(401).json({ error: "Invalid token" });
//         }
//     };
// }

function auth(roles = []) {
    return (req, res, next) => {
        const header = req.headers.authorization;

        if (!header) return res.status(401).json({ error: "No token" });

        const token = header.split(" ")[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // ✅ Allow multiple roles
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ error: "Forbidden" });
            }

            req.user = decoded;
            next();

        } catch (err) {
            res.status(401).json({ error: "Invalid token" });
        }
    };
}

module.exports = auth;