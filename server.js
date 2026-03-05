const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

// Serverar frontend från /public
app.use(express.static(path.join(__dirname, "public")));

// reCAPTCHA verify helper
async function verifyRecaptcha(token) {
  const RECAPTCHA_SECRET_KEY = "6LeUJ4AsAAAAAN2prpEs8VvjiuI_d4zdtKSoFMNm";

  try {
    const form = new URLSearchParams();
    form.append("secret", RECAPTCHA_SECRET_KEY);
    form.append("response", token);

    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: form,
    });

    return await r.json(); // { success: true/false, ... }
  } catch (e) {
    console.log("reCAPTCHA verify error:", e.message);
    return { success: false };
  }
}
const dbConfig = {
  host: "project1-db.c3oom6q4ag16.eu-north-1.rds.amazonaws.com",
  user: "admin",
  password: "MyStrongPass123!",
  database: "project1",
  port: 3306,
};

// Kopplar upp mot DB
const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.log("DB ERROR:", err.message);
    return;
  }
  console.log("DB connected!");
});

// Start page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "PublicHome1.html"));
});

// REGISTER
app.post("/register", async (req, res) => {
  console.log("REGISTER HIT:", req.body);

  const { username, email, password, recaptchaToken } = req.body;

   if (!recaptchaToken) {
    return res.status(400).json({ message: "Verify reCAPTCHA." });
  }
  const check = await verifyRecaptcha(recaptchaToken);
  if (!check.success) {
    return res.status(403).json({ message: "reCAPTCHA failed." });
  }

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email och password krävs" });
  }

  try {
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

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password, recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ message: "Verify reCAPTCHA." });
  }
  const check = await verifyRecaptcha(recaptchaToken);
  if (!check.success) {
    return res.status(403).json({ message: "reCAPTCHA failed." });
  }

  if (!username || !password) {
    return res.status(400).json({ message: "Username och password krävs" });
  }

  // password_hash finns i DB
  const sql = "SELECT id, password_hash FROM users WHERE username=? LIMIT 1";

  db.query(sql, [username], async (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (rows.length === 0) {
      return res.status(401).json({ message: "Fel username eller lösenord" });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Fel username eller lösenord" });

    // Skickar tillbaka userId så frontend kan spara den i localStorage
    return res.json({ message: "Login OK", userId: user.id });
  });
});

// Sök användare i DB (username eller email)
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

// Hämta alla kontakter för en user
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

// Lägg till kontakt
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

// Ta bort kontakt
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});