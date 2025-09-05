const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET||"SVNIT2028";

function verifyToken(req, res, next) {
  const token = req.cookies.auth_token; 
  if (!token) return res.status(403).json({ msg: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ msg: "Invalid token" });

    req.user = decoded; 
    next();
  });
}

module.exports = verifyToken;
