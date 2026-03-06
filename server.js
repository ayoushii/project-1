const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const bcrypt = require("bcrypt");


require("dotenv").config();

const app = express();
app.use(express.json());

// Frontend-filer (HTML/CSS/JS/images) ligger i /public
app.use(express.static(path.join(__dirname, "public")));

// DB:
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
};

const db = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Kolla DB vid start (och logga snyggt)
db.query("SELECT 1", (err) => {
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

//Skapa konto 
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

// ===== Sök användare (för att lägga till som kontakt / eller skicka request) =====
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

// ===== Lägg till kontakt (din gamla route, behåller den) =====
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

  const findSql = `
    SELECT contact_user_id
    FROM contacts
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `;

  db.query(findSql, [contactId, userId], (err, rows) => {
    if (err) {
      console.log("DELETE CONTACT FIND ERROR:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Kontakt hittades inte." });
    }

    const otherUserId = rows[0].contact_user_id;

    const deleteSql = `
      DELETE FROM contacts
      WHERE (user_id = ? AND contact_user_id = ?)
         OR (user_id = ? AND contact_user_id = ?)
    `;

    db.query(deleteSql, [userId, otherUserId, otherUserId, userId], (err2) => {
      if (err2) {
        console.log("DELETE CONTACT ERROR:", err2.message);
        return res.status(500).json({ message: "Database error" });
      }

      return res.json({ message: "Kontakt borttagen." });
    });
  });
});


// FRIEND REQUESTS (nytt)

// Skicka request till någon som finns (via username eller email)
app.post("/friend-requests", (req, res) => {
  const fromUserId = Number(req.body.fromUserId);
  const q = (req.body.q || "").trim();

  if (!fromUserId || !q) {
    return res.status(400).json({ message: "fromUserId och q krävs" });
  }

  // Hitta mottagaren
  const findSql = `
    SELECT id, username, email
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
  `;

  db.query(findSql, [q, q], (err, rows) => {
    if (err) {
      console.log("FR FIND USER ERROR:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ingen användare hittades." });
    }

    const toUser = rows[0];

    if (toUser.id === fromUserId) {
      return res.status(400).json({ message: "Du kan inte skicka request till dig själv." });
    }


    const contactCheckSql = `
      SELECT 1 FROM contacts
      WHERE user_id=? AND contact_user_id=?
      LIMIT 1
    `;

    db.query(contactCheckSql, [fromUserId, toUser.id], (err2, rows2) => {
      if (err2) return res.status(500).json({ message: "Database error" });
      if (rows2.length > 0) return res.status(400).json({ message: "Ni är redan kontakter." });

      // Skapa request (unik key stoppar dubletter)
      const insertSql = `
        INSERT INTO friend_requests (from_user_id, to_user_id, status)
        VALUES (?, ?, 'pending')
      `;

      db.query(insertSql, [fromUserId, toUser.id], (err3) => {
        if (err3) {
          if (err3.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Request finns redan." });
          }
          console.log("FR INSERT ERROR:", err3.message);
          return res.status(500).json({ message: "Database error" });
        }

        return res.status(201).json({ message: "Request skickad!", toUser });
      });
    });
  });
});

// Hämta mina inkommande requests 
app.get("/friend-requests", (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ message: "Missing userId" });

  const sql = `
    SELECT fr.id, fr.from_user_id, u.username, u.email, fr.created_at
    FROM friend_requests fr
    JOIN users u ON u.id = fr.from_user_id
    WHERE fr.to_user_id = ? AND fr.status='pending'
    ORDER BY fr.created_at DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.log("FR GET ERROR:", err.message);
      return res.status(500).json({ message: "Database error" });
    }
    return res.json({ requests: rows });
  });
});

// Accept request och lägg till båda användarna i contacts
app.post("/friend-requests/:id/accept", (req, res) => {
  const requestId = Number(req.params.id);
  const userId = Number(req.body.userId);

  if (!requestId || !userId) {
    return res.status(400).json({ message: "requestId och userId krävs" });
  }

  const getSql = `
    SELECT id, from_user_id, to_user_id, status
    FROM friend_requests
    WHERE id = ?
    LIMIT 1
  `;

  db.query(getSql, [requestId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (rows.length === 0) {
      return res.status(404).json({ message: "Request hittades inte." });
    }

    const fr = rows[0];

    if (fr.to_user_id !== userId) {
      return res.status(403).json({ message: "Not allowed." });
    }

    if (fr.status !== "pending") {
      return res.status(400).json({ message: "Request är inte pending." });
    }

    const insertSql = `INSERT INTO contacts (user_id, contact_user_id) VALUES (?, ?)`;

    db.query(insertSql, [fr.to_user_id, fr.from_user_id], (err2) => {
      if (err2 && err2.code !== "ER_DUP_ENTRY") {
        return res.status(500).json({ message: "Database error" });
      }

      db.query(insertSql, [fr.from_user_id, fr.to_user_id], (err3) => {
        if (err3 && err3.code !== "ER_DUP_ENTRY") {
          return res.status(500).json({ message: "Database error" });
        }

        const deleteSql = `DELETE FROM friend_requests WHERE id = ?`;

        db.query(deleteSql, [requestId], (err4) => {
          if (err4) {
            return res.status(500).json({ message: "Database error" });
          }

          return res.json({ message: "Request accepted!" });
        });
      });
    });
  });
});

app.post("/friend-requests/:id/decline", (req, res) => {
  const requestId = Number(req.params.id);
  const userId = Number(req.body.userId);

  if (!requestId || !userId) {
    return res.status(400).json({ message: "requestId och userId krävs" });
  }

  const sql = `
    DELETE FROM friend_requests
    WHERE id = ? AND to_user_id = ? AND status = 'pending'
  `;

  db.query(sql, [requestId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Request hittades inte." });
    }

    return res.json({ message: "Request declined." });
  });
});

// Startar servern
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});