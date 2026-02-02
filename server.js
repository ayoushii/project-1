const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
app.use(express.json());

// =========================
// DATABASE CONNECTION
// =========================
const db = mysql.createConnection({
  host: "localhost",
  user: "appuser",
  password: "Rama@20052005@",
  database: "project1"
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("Connected to MySQL database ✅");
});

// =========================
// FRONTEND (STATIC FILES)
// =========================
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "1.html"));
});

// =========================
// REGISTER USER
// =========================
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required"
    });
  }

  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";

  db.query(sql, [username, password], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          message: "Username already exists"
        });
      }

      return res.status(500).json({
        message: "Database error"
      });
    }

    res.status(201).json({
      message: "User created successfully"
    });
  });
});

// =========================
// START SERVER
// =========================
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000 🚀");
});
