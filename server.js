const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
app.use(express.json());

// ====== 1) Servera frontend från /public ======
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "1.html"));
});

// ====== 2) Koppla till MySQL ======
const db = mysql.createConnection({
  host: "127.0.0.1",          // viktigt
  user: "appuser",
  password: "Rama@20052005@", // exakt samma som i Workbench
  database: "project1",
});

// Testa DB direkt när servern startar
db.connect((err) => {
  if (err) {
    console.error("DB ERROR:", err.message);
    return;
  }
  console.log("✅ Connected to MySQL!");
});

// ====== 3) Register endpoint ======
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "username och password krävs" });
  }

  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      // Duplicate username (UNIQUE)
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Username already exists" });
      }
      return res.status(500).json({ message: "Database error" });
    }

    res.status(201).json({ message: "User created successfully" });
  });
});

// test-route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ====== 4) Starta server ======
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
