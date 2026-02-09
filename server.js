const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
app.use(express.json());

// 1) Servera frontend-filer (HTML/CSS/JS/bilder) från /public
app.use(express.static(path.join(__dirname, "public")));

// 2) DB-inställningar (OBS: detta är ett vanligt objekt)
const dbConfig = {
  host: "localhost",
  user: "appuser",
  password: "Rama@20052005@",
  database: "project1"
};

// 3) Skapa DB-anslutning
const db = mysql.createConnection(dbConfig);

// 4) Koppla DB och skriv ut om det funkar
db.connect((err) => {
  if (err) {
    console.log("DB ERROR:", err.message);
    return;
  }
  console.log("DB connected!");
});

// 5) När någon går till "/", visa 1.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "PublicHome1.html"));
});

// 6) REGISTER (skapa konto)
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  // enkel kontroll
  if (!username || !password) {
    return res.status(400).json({ message: "Username och password krävs" });
  }

  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";

  db.query(sql, [username, password], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Username already exists" });
      }
      return res.status(500).json({ message: "Database error" });
    } 
    return res.status(201).json({ message: "User created successfully" });
  });
});

// 7) LOGIN (logga in)
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username och password krävs" });
  }

  const sql = "SELECT id, username FROM users WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (rows.length === 0) {
      return res.status(401).json({ message: "Fel username eller lösenord" });
    }

    return res.json({ message: "Login OK" });
  });
});

// 8) Starta server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

