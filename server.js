const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

// serverar frontend
app.use(express.static(path.join(__dirname, "public")));

// DB config (HÅRDKODAT NU)
const dbConfig = {
  host: "localhost",
  user: "appuser",
  password: "Rama@20052005@",
  database: "project1",
};

// DB connect
const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.log("DB ERROR:", err.message);
    return;
  }
  console.log("DB connected!");
});

// start page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "PublicHome1.html"));
});

// REGISTER (utan mail/token/verifiering)
app.post("/register", async (req, res) => {
  console.log("REGISTER HIT:", req.body);

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email och password krävs" });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    //din tabell heter password_hash (inte password)
    const sqlUser =
      "INSERT INTO users (username, email, password_hash, is_verified) VALUES (?, ?, ?, 1)";

    db.query(sqlUser, [username, email, password_hash], (err) => {
      if (err) {
        console.log("SQL USER INSERT ERROR:", err.code, err.message);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Username eller email finns redan" });
        }
        return res.status(500).json({ message: "Database error" });
      }

      return res.status(201).json({ message: "Konto skapat! Du kan logga in nu." });
    });
  } catch (e) {
    console.log("REGISTER ERROR:", e);
    return res.status(500).json({ message: "Serverfel" });
  }
});

// LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username och password krävs" });
  }

  // password_hash finns i DB
  const sql = "SELECT id, password_hash FROM users WHERE username=?";

  db.query(sql, [username], async (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (rows.length === 0) {
      return res.status(401).json({ message: "Fel username eller lösenord" });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Fel username eller lösenord" });

    return res.json({ message: "Login OK" });
  });
});

// start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
