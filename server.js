const express = require("express");
const mysql = require("mysql2");
const path = require("path");
require("dotenv").config();
const nodemailer = require("nodemailer");
const crypto = require("crypto"); // token
const bcrypt = require("bcrypt"); // hash

const app = express();
app.use(express.json());

// serverar frontend
app.use(express.static(path.join(__dirname, "public")));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

function sendVerifyMail(toEmail, link) {
  return transporter.sendMail({
    from: process.env.MAIL_USER,
    to: toEmail,
    subject: "Verifiera ditt konto",
    html: `Klicka här för att verifiera ditt konto: <a href="${link}">${link}</a>`,
  });
}


// DB config
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASS || "Rama@20052005@",
  database: process.env.DB_NAME || "project1"
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

// verify konto via token
app.get("/verify", (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Token saknas");

  const sql = "SELECT user_id FROM email_tokens WHERE token=? AND type='verify' AND expires_at > NOW()";

  db.query(sql, [token], (err, rows) => {
    if (err) return res.status(500).send("Serverfel");
    if (rows.length === 0) return res.status(400).send("Ogiltig eller utgången länk");

    const userId = rows[0].user_id;

    db.query("UPDATE users SET is_verified=1 WHERE id=?", [userId], (err2) => {
      if (err2) return res.status(500).send("Serverfel");

      db.query("DELETE FROM email_tokens WHERE token=?", [token]);
      return res.redirect("/verified.html");
    });
  });
});

// register
app.post("/register", async (req, res) => {
  const { username,email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email och password krävs" });
  }

  // hash password
  const password_hash = await bcrypt.hash(password, 10);

  // skapa user
  const sqlUser =
    "INSERT INTO users (username, email, password_hash, is_verified) VALUES (?, ?, ?, 0)";


  db.query(sqlUser, [username, email, password_hash], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Username eller email is already exists" });
      }
      return res.status(500).json({ message: "Database error" });
    }

    // skapa token
    const userId = result.insertId;
    const token = crypto.randomBytes(32).toString("hex");

    const sqlToken =
      "INSERT INTO email_tokens (user_id, token, type, expires_at) VALUES (?, ?, 'verify', DATE_ADD(NOW(), INTERVAL 24 HOUR))";

    db.query(sqlToken, [userId, token], (err2) => {
      if (err2) return res.status(500).json({ message: "Database error (token)" });

      // visa verify-länk i terminal
      const link = `${process.env.BASE_URL}/verify?token=${token}`;

      console.log("REGISTER HIT:", req.body);

      

      sendVerifyMail(email, link)
        .then(() => {
          return res.status(201).json({ message: "Konto skapat! Kolla din email för verifiering." });
        })
        .catch((e) => {
          console.log("MAIL ERROR:", e);
          return res.status(500).json({ message: "Kunde inte skicka verifieringsmail" });
        });


    
    });
  });
});

// login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username och password krävs" });
  }

  const sql = "SELECT id, password_hash, is_verified FROM users WHERE username=?";

  db.query(sql, [username], async (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (rows.length === 0) {
      return res.status(401).json({ message: "Fel username eller lösenord" });
    }

    const user = rows[0];

    // måste vara verifierad
    if (user.is_verified !== 1) {
      return res.status(403).json({ message: "Verifiera konto först" });
    }

    // jämför hash
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Fel username eller lösenord" });

    return res.json({ message: "Login OK" });
  });
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
 