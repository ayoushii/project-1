const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

// Frontend-filer (HTML/CSS/JS/images) ligger i /public
app.use(express.static(path.join(__dirname, "public")));

// ===== DB: läser från .env =====
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
};

const db = mysql.createConnection(dbConfig);

// Kollar att vi får kontakt med databasen när servern startar
db.connect((err) => {
  if (err) {
    console.log("DB ERROR:", err.message);
    return;
  }
  console.log("DB connected!");
});

// Startsidan (när man går in på domänen)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "PublicHome1.html"));
});

// ===== Skapa konto =====
app.post("/register", async (req, res) => {
  console.log("REGISTER HIT:", req.body);

  const { username, email, password } = req.body;

  // Snabb input-check så vi slipper trasiga inserts
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email och password krävs" });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: "Lösenordet måste vara minst 6 tecken." });
  }

  try {
    // Hashar lösenordet innan vi sparar (aldrig plain text i DB)
    const password_hash = await bcrypt.hash(password, 10);

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

// ===== Logga in =====
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username och password krävs" });
  }

  // Vi hämtar bara det vi behöver: id + hash
  const sql = "SELECT id, password_hash FROM users WHERE username=? LIMIT 1";

  db.query(sql, [username], async (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (rows.length === 0) {
      return res.status(401).json({ message: "Fel username eller lösenord" });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Fel username eller lösenord" });

    // Frontend sparar userId i localStorage (behövs för contacts)
    return res.json({ message: "Login OK", userId: user.id });
  });
});

// ===== Sök användare (för att lägga till som kontakt) =====
app.get("/users/search", (req, res) => {
  const q = (req.query.q || "").trim();

  if (!q) return res.status(400).json({ message: "Missing search query" });

  const sql = `
    SELECT id, username, email
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
  `;

  db.query(sql, [q, q], (err, rows) => {
    if (err) {
      console.log("SEARCH USER ERROR:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ingen användare hittades." });
    }

    return res.json({ user: rows[0] });
  });
});

// ===== Hämta kontakter =====
app.get("/contacts", (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) return res.status(400).json({ message: "Missing userId" });

  const sql = `
    SELECT c.id AS contactId, u.id AS userId, u.username, u.email
    FROM contacts c
    JOIN users u ON u.id = c.contact_user_id
    WHERE c.user_id = ?
    ORDER BY u.username ASC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.log("GET CONTACTS ERROR:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    return res.json({ contacts: rows });
  });
});

// ===== Lägg till kontakt =====
app.post("/contacts", (req, res) => {
  const userId = Number(req.body.userId);
  const q = (req.body.q || "").trim();

  if (!userId || !q) {
    return res.status(400).json({ message: "userId och q krävs" });
  }

  const findSql = `
    SELECT id, username, email
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
  `;

  db.query(findSql, [q, q], (err, rows) => {
    if (err) {
      console.log("FIND USER ERROR:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ingen användare hittades." });
    }

    const contactUser = rows[0];

    if (contactUser.id === userId) {
      return res.status(400).json({ message: "Du kan inte lägga till dig själv." });
    }

    const insertSql = `INSERT INTO contacts (user_id, contact_user_id) VALUES (?, ?)`;

    db.query(insertSql, [userId, contactUser.id], (err2) => {
      if (err2) {
        if (err2.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Den här kontakten finns redan." });
        }
        console.log("INSERT CONTACT ERROR:", err2.message);
        return res.status(500).json({ message: "Database error" });
      }

      return res.status(201).json({ message: "Kontakt sparad!", contact: contactUser });
    });
  });
});

// ===== Ta bort kontakt =====
app.delete("/contacts/:contactId", (req, res) => {
  const contactId = Number(req.params.contactId);
  const userId = Number(req.query.userId);

  if (!contactId || !userId) {
    return res.status(400).json({ message: "contactId och userId krävs" });
  }

  const sql = `DELETE FROM contacts WHERE id = ? AND user_id = ?`;

  db.query(sql, [contactId, userId], (err, result) => {
    if (err) {
      console.log("DELETE CONTACT ERROR:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Kontakt hittades inte." });
    }

    return res.json({ message: "Kontakt borttagen." });
  });
});

// Startar servern
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});