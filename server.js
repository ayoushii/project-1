const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
app.use(express.json());

// DB
const dbConfig = {
  host: "localhost",
  user: "appuser",
  password: "Rama@20052005@",
  database: "project1"
};

const db = mysql.createConnection(dbConfig);

// Frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "1.html"));
});

// Register
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(sql, [username, password], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Username already exists" });
      }
      return res.status(500).json({ message: "Database error" });
    }

    res.status(201).json({ message: "User created successfully" });
  });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
