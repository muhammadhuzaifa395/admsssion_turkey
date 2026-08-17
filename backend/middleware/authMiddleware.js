const jwt = require("jsonwebtoken");


// ========================================
// VERIFY LOGIN TOKEN
// ========================================

const verifyToken = (
  req,
  res,
  next
) => {

  try {

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {

      return res.status(401).json({
        message:
          "Access denied. Please login first."
      });

    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET ||
        "secretkey"
      );

    req.user = decoded;

    next();

  } catch (error) {

    console.error(
      "Token Verification Error:",
      error
    );

    return res.status(401).json({
      message:
        "Invalid or expired login session."
    });

  }

};


// ========================================
// ADMIN ONLY
// ========================================

const isAdmin = (
  req,
  res,
  next
) => {

  if (
    !req.user ||
    req.user.role !== "admin"
  ) {

    return res.status(403).json({
      message:
        "Access denied. Admins only."
    });

  }

  next();

};


module.exports = {
  verifyToken,
  isAdmin
};