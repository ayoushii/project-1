const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.log("MAIL VERIFY ERROR:", error);
  } else {
    console.log("Mail server is ready.");
  }
});

db.query("SELECT 1", (err) => {
  if (err) {
    console.log("DB ERROR:", err.message);
    return;
  }
  console.log("DB connected!");
});

function getAccessibleListSql() {
  return `
    SELECT l.*
    FROM lists l
    LEFT JOIN list_shares s ON l.id = s.list_id
    WHERE l.id = ?
      AND (l.owner_id = ? OR s.shared_with_user_id = ?)
    LIMIT 1
  `;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "PublicHome1.html"));
});

app.post("/register", async (req, res) => {
  const { fullName, username, email, password } = req.body;

  if (!fullName || !username || !email || !password) {
    return res.status(400).json({
      message: "Full name, username, email and password are required.",
    });
  }

  if (String(password).length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (full_name, username, email, password_hash, is_verified)
      VALUES (?, ?, ?, ?, 1)
    `;

    db.query(sql, [fullName, username, email, passwordHash], (err) => {
      if (err) {
        console.log("REGISTER ERROR:", err.code, err.message);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({
            message: "Username or email already exists.",
          });
        }

        return res.status(500).json({ message: "Database error." });
      }

      return res.status(201).json({
        message: "Account created successfully. You can log in now.",
      });
    });
  } catch (error) {
    console.log("REGISTER SERVER ERROR:", error.message);
    return res.status(500).json({ message: "Server error." });
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required.",
    });
  }

  const sql = `
    SELECT id, password_hash
    FROM users
    WHERE username = ?
    LIMIT 1
  `;

  db.query(sql, [username], async (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    return res.json({
      message: "Login successful.",
      userId: user.id,
    });
  });
});

app.get("/user/:id", (req, res) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  const sql = `
    SELECT id, full_name, username, email
    FROM users
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.log("GET USER ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json(rows[0]);
  });
});

app.get("/users/search", (req, res) => {
  const q = (req.query.q || "").trim();

  if (!q) {
    return res.status(400).json({ message: "Search query is required." });
  }

  const sql = `
    SELECT id, username, email
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
  `;

  db.query(sql, [q, q], (err, rows) => {
    if (err) {
      console.log("SEARCH USER ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user: rows[0] });
  });
});

app.get("/contacts", (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

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
      return res.status(500).json({ message: "Database error." });
    }

    return res.json({ contacts: rows });
  });
});

app.post("/contacts", (req, res) => {
  const userId = Number(req.body.userId);
  const q = (req.body.q || "").trim();

  if (!userId || !q) {
    return res.status(400).json({ message: "userId and q are required." });
  }

  const findSql = `
    SELECT id, username, email
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
  `;

  db.query(findSql, [q, q], (err, rows) => {
    if (err) {
      console.log("FIND CONTACT USER ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const contactUser = rows[0];

    if (contactUser.id === userId) {
      return res.status(400).json({
        message: "You cannot add yourself as a contact.",
      });
    }

    const insertSql = `
      INSERT INTO contacts (user_id, contact_user_id)
      VALUES (?, ?)
    `;

    db.query(insertSql, [userId, contactUser.id], (err2) => {
      if (err2) {
        if (err2.code === "ER_DUP_ENTRY") {
          return res.status(400).json({
            message: "This contact already exists.",
          });
        }

        console.log("INSERT CONTACT ERROR:", err2.message);
        return res.status(500).json({ message: "Database error." });
      }

      return res.status(201).json({
        message: "Contact added successfully.",
        contact: contactUser,
      });
    });
  });
});

app.delete("/contacts/:contactId", (req, res) => {
  const contactId = Number(req.params.contactId);
  const userId = Number(req.query.userId);

  if (!contactId || !userId) {
    return res.status(400).json({
      message: "contactId and userId are required.",
    });
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
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Contact not found." });
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
        return res.status(500).json({ message: "Database error." });
      }

      return res.json({ message: "Contact removed successfully." });
    });
  });
});

app.post("/friend-requests", (req, res) => {
  const fromUserId = Number(req.body.fromUserId);
  const q = (req.body.q || "").trim();

  if (!fromUserId || !q) {
    return res.status(400).json({
      message: "fromUserId and q are required.",
    });
  }

  const findSql = `
    SELECT id, username, email
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
  `;

  db.query(findSql, [q, q], (err, rows) => {
    if (err) {
      console.log("FR FIND USER ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const toUser = rows[0];

    if (toUser.id === fromUserId) {
      return res.status(400).json({
        message: "You cannot send a request to yourself.",
      });
    }

    const contactCheckSql = `
      SELECT 1
      FROM contacts
      WHERE user_id = ? AND contact_user_id = ?
      LIMIT 1
    `;

    db.query(contactCheckSql, [fromUserId, toUser.id], (err2, rows2) => {
      if (err2) {
        return res.status(500).json({ message: "Database error." });
      }

      if (rows2.length > 0) {
        return res.status(400).json({
          message: "You are already contacts.",
        });
      }

      const insertSql = `
        INSERT INTO friend_requests (from_user_id, to_user_id, status)
        VALUES (?, ?, 'pending')
      `;

      db.query(insertSql, [fromUserId, toUser.id], (err3) => {
        if (err3) {
          if (err3.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              message: "A request already exists.",
            });
          }

          console.log("FR INSERT ERROR:", err3.message);
          return res.status(500).json({ message: "Database error." });
        }

        return res.status(201).json({
          message: "Friend request sent successfully.",
          toUser,
        });
      });
    });
  });
});

app.get("/friend-requests", (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  const sql = `
    SELECT fr.id, fr.from_user_id, u.username, u.email, fr.created_at
    FROM friend_requests fr
    JOIN users u ON u.id = fr.from_user_id
    WHERE fr.to_user_id = ? AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.log("GET FRIEND REQUESTS ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    return res.json({ requests: rows });
  });
});

app.post("/friend-requests/:id/accept", (req, res) => {
  const requestId = Number(req.params.id);
  const userId = Number(req.body.userId);

  if (!requestId || !userId) {
    return res.status(400).json({
      message: "requestId and userId are required.",
    });
  }

  const getSql = `
    SELECT id, from_user_id, to_user_id, status
    FROM friend_requests
    WHERE id = ?
    LIMIT 1
  `;

  db.query(getSql, [requestId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    const fr = rows[0];

    if (fr.to_user_id !== userId) {
      return res.status(403).json({ message: "Not allowed." });
    }

    if (fr.status !== "pending") {
      return res.status(400).json({ message: "This request is not pending." });
    }

    const insertSql = `
      INSERT INTO contacts (user_id, contact_user_id)
      VALUES (?, ?)
    `;

    db.query(insertSql, [fr.to_user_id, fr.from_user_id], (err2) => {
      if (err2 && err2.code !== "ER_DUP_ENTRY") {
        return res.status(500).json({ message: "Database error." });
      }

      db.query(insertSql, [fr.from_user_id, fr.to_user_id], (err3) => {
        if (err3 && err3.code !== "ER_DUP_ENTRY") {
          return res.status(500).json({ message: "Database error." });
        }

        db.query(
          "DELETE FROM friend_requests WHERE id = ?",
          [requestId],
          (err4) => {
            if (err4) {
              return res.status(500).json({ message: "Database error." });
            }

            return res.json({ message: "Friend request accepted." });
          }
        );
      });
    });
  });
});

app.post("/friend-requests/:id/decline", (req, res) => {
  const requestId = Number(req.params.id);
  const userId = Number(req.body.userId);

  if (!requestId || !userId) {
    return res.status(400).json({
      message: "requestId and userId are required.",
    });
  }

  const sql = `
    DELETE FROM friend_requests
    WHERE id = ? AND to_user_id = ? AND status = 'pending'
  `;

  db.query(sql, [requestId, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    return res.json({ message: "Friend request declined." });
  });
});

app.post("/lists", (req, res) => {
  const userId = Number(req.body.userId);
  const title = (req.body.title || "").trim();
  const listType = (req.body.listType || "other").trim();

  if (!userId || !title) {
    return res.status(400).json({
      message: "userId and title are required.",
    });
  }

  const sql = `
    INSERT INTO lists (owner_id, title, list_type)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [userId, title, listType], (err, result) => {
    if (err) {
      console.log("CREATE LIST ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    return res.status(201).json({
      message: "List created successfully.",
      listId: result.insertId,
    });
  });
});
app.delete("/lists/:id/share/:sharedUserId", (req, res) => {
  const listId = Number(req.params.id);
  const sharedUserId = Number(req.params.sharedUserId);
  const userId = Number(req.query.userId);

  if (!listId || !sharedUserId || !userId) {
    return res.status(400).json({
      message: "listId, sharedUserId and userId are required.",
    });
  }

  const ownerSql = `
    SELECT id
    FROM lists
    WHERE id = ? AND owner_id = ?
    LIMIT 1
  `;

  db.query(ownerSql, [listId, userId], (err, ownerRows) => {
    if (err) {
      console.log("DELETE SHARE OWNER ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (ownerRows.length === 0) {
      return res.status(403).json({
        message: "Only the owner can remove members from this list.",
      });
    }

    const deleteSql = `
      DELETE FROM list_shares
      WHERE list_id = ? AND shared_with_user_id = ?
    `;

    db.query(deleteSql, [listId, sharedUserId], (err2, result) => {
      if (err2) {
        console.log("DELETE SHARE ERROR:", err2.message);
        return res.status(500).json({ message: "Database error." });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Shared member not found.",
        });
      }

      return res.json({
        message: "Member removed successfully.",
      });
    });
  });
});

app.get("/lists", (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  const sql = `
    SELECT DISTINCT
      l.id,
      l.title,
      l.list_type,
      l.owner_id,
      l.created_at,
      l.updated_at,
      CASE
        WHEN l.owner_id = ? THEN 'owner'
        ELSE 'shared'
      END AS relation_type
    FROM lists l
    LEFT JOIN list_shares s ON l.id = s.list_id
    WHERE l.owner_id = ? OR s.shared_with_user_id = ?
    ORDER BY l.updated_at DESC, l.id DESC
  `;

  db.query(sql, [userId, userId, userId], (err, rows) => {
    if (err) {
      console.log("GET LISTS ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    return res.json({ lists: rows });
  });
});

app.get("/lists/:id", (req, res) => {
  const listId = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!listId || !userId) {
    return res.status(400).json({
      message: "listId and userId are required.",
    });
  }

  db.query(getAccessibleListSql(), [listId, userId, userId], (err, rows) => {
    if (err) {
      console.log("GET LIST ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "List not found." });
    }

    return res.json({ list: rows[0] });
  });
});

app.get("/lists/:id/members", (req, res) => {
  const listId = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!listId || !userId) {
    return res.status(400).json({
      message: "listId and userId are required.",
    });
  }

  db.query(getAccessibleListSql(), [listId, userId, userId], (err, rows) => {
    if (err) {
      console.log("GET LIST MEMBERS ACCESS ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "List not found." });
    }

    const sql = `
      SELECT ls.id, u.id AS user_id, u.username, u.email, ls.permission
      FROM list_shares ls
      JOIN users u ON u.id = ls.shared_with_user_id
      WHERE ls.list_id = ?
      ORDER BY u.username ASC
    `;

    db.query(sql, [listId], (err2, memberRows) => {
      if (err2) {
        console.log("GET LIST MEMBERS ERROR:", err2.message);
        return res.status(500).json({ message: "Database error." });
      }

      return res.json({ members: memberRows });
    });
  });
});

app.delete("/lists/:id", (req, res) => {
  const listId = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!listId || !userId) {
    return res.status(400).json({
      message: "listId and userId are required.",
    });
  }

  const sql = `
    SELECT id
    FROM lists
    WHERE id = ? AND owner_id = ?
    LIMIT 1
  `;

  db.query(sql, [listId, userId], (err, rows) => {
    if (err) {
      console.log("DELETE LIST ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "List not found or access denied.",
      });
    }

    db.query("DELETE FROM lists WHERE id = ?", [listId], (err2) => {
      if (err2) {
        return res.status(500).json({ message: "Database error." });
      }

      return res.json({ message: "List deleted successfully." });
    });
  });
});

app.get("/lists/:id/items", (req, res) => {
  const listId = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!listId || !userId) {
    return res.status(400).json({
      message: "listId and userId are required.",
    });
  }

  db.query(getAccessibleListSql(), [listId, userId, userId], (err, rows) => {
    if (err) {
      console.log("GET LIST ITEMS ACCESS ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "List not found." });
    }

    const sql = `
      SELECT id, text, quantity, unit, is_completed, position_index, created_at
      FROM list_items
      WHERE list_id = ?
      ORDER BY position_index ASC, id ASC
    `;

    db.query(sql, [listId], (err2, items) => {
      if (err2) {
        console.log("GET LIST ITEMS ERROR:", err2.message);
        return res.status(500).json({ message: "Database error." });
      }

      return res.json({ items });
    });
  });
});

app.post("/lists/:id/items", (req, res) => {
  const listId = Number(req.params.id);
  const userId = Number(req.body.userId);
  const text = (req.body.text || "").trim();
  const quantity = (req.body.quantity || "1").toString().trim();
  const unit = (req.body.unit || "pcs").toString().trim();

  if (!listId || !userId || !text) {
    return res.status(400).json({
      message: "listId, userId and text are required.",
    });
  }

  db.query(getAccessibleListSql(), [listId, userId, userId], (err, rows) => {
    if (err) {
      console.log("ADD ITEM ACCESS ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "List not found." });
    }

    const list = rows[0];

    if (list.owner_id !== userId) {
      const permissionSql = `
        SELECT permission
        FROM list_shares
        WHERE list_id = ? AND shared_with_user_id = ?
        LIMIT 1
      `;

      db.query(permissionSql, [listId, userId], (err2, shareRows) => {
        if (err2) {
          console.log("ADD ITEM PERMISSION ERROR:", err2.message);
          return res.status(500).json({ message: "Database error." });
        }

        if (shareRows.length === 0 || shareRows[0].permission !== "edit") {
          return res.status(403).json({
            message: "You do not have permission to edit this list.",
          });
        }

        insertItem();
      });
    } else {
      insertItem();
    }

    function insertItem() {
      const posSql = `
        SELECT COALESCE(MAX(position_index), -1) AS maxPos
        FROM list_items
        WHERE list_id = ?
      `;

      db.query(posSql, [listId], (err3, posRows) => {
        if (err3) {
          console.log("ITEM POSITION ERROR:", err3.message);
          return res.status(500).json({ message: "Database error." });
        }

        const nextPos = Number(posRows[0].maxPos) + 1;

        const insertSql = `
          INSERT INTO list_items (list_id, text, quantity, unit, position_index)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
          insertSql,
          [listId, text, quantity, unit, nextPos],
          (err4, result) => {
            if (err4) {
              console.log("ADD ITEM ERROR:", err4.message);
              return res.status(500).json({ message: "Database error." });
            }

            return res.status(201).json({
              message: "Item added successfully.",
              itemId: result.insertId,
            });
          }
        );
      });
    }
  });
});

app.put("/items/:itemId", (req, res) => {
  const itemId = Number(req.params.itemId);
  const userId = Number(req.body.userId);
  const text = req.body.text;
  const isCompleted = req.body.is_completed;

  if (!itemId || !userId) {
    return res.status(400).json({
      message: "itemId and userId are required.",
    });
  }

  const findSql = `
    SELECT li.id, li.list_id, l.owner_id
    FROM list_items li
    JOIN lists l ON l.id = li.list_id
    LEFT JOIN list_shares s ON s.list_id = l.id AND s.shared_with_user_id = ?
    WHERE li.id = ?
      AND (l.owner_id = ? OR s.shared_with_user_id = ?)
    LIMIT 1
  `;

  db.query(findSql, [userId, itemId, userId, userId], (err, rows) => {
    if (err) {
      console.log("UPDATE ITEM FIND ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Item not found." });
    }

    const itemRow = rows[0];

    function doUpdate() {
      const fields = [];
      const values = [];

      if (typeof text === "string") {
        fields.push("text = ?");
        values.push(text.trim());
      }

      if (typeof isCompleted !== "undefined") {
        fields.push("is_completed = ?");
        values.push(isCompleted ? 1 : 0);
      }

      if (fields.length === 0) {
        return res.status(400).json({ message: "Nothing to update." });
      }

      const sql = `
        UPDATE list_items
        SET ${fields.join(", ")}
        WHERE id = ?
      `;

      values.push(itemId);

      db.query(sql, values, (err2) => {
        if (err2) {
          console.log("UPDATE ITEM ERROR:", err2.message);
          return res.status(500).json({ message: "Database error." });
        }

        return res.json({ message: "Item updated successfully." });
      });
    }

    if (itemRow.owner_id === userId) {
      return doUpdate();
    }

    const permissionSql = `
      SELECT permission
      FROM list_shares
      WHERE list_id = ? AND shared_with_user_id = ?
      LIMIT 1
    `;

    db.query(permissionSql, [itemRow.list_id, userId], (err3, shareRows) => {
      if (err3) {
        console.log("UPDATE ITEM PERMISSION ERROR:", err3.message);
        return res.status(500).json({ message: "Database error." });
      }

      if (shareRows.length === 0 || shareRows[0].permission !== "edit") {
        return res.status(403).json({
          message: "You do not have permission to edit this list.",
        });
      }

      return doUpdate();
    });
  });
});

app.delete("/items/:itemId", (req, res) => {
  const itemId = Number(req.params.itemId);
  const userId = Number(req.query.userId);

  if (!itemId || !userId) {
    return res.status(400).json({
      message: "itemId and userId are required.",
    });
  }

  const findSql = `
    SELECT li.id, li.list_id, l.owner_id
    FROM list_items li
    JOIN lists l ON l.id = li.list_id
    LEFT JOIN list_shares s ON s.list_id = l.id AND s.shared_with_user_id = ?
    WHERE li.id = ?
      AND (l.owner_id = ? OR s.shared_with_user_id = ?)
    LIMIT 1
  `;

  db.query(findSql, [userId, itemId, userId, userId], (err, rows) => {
    if (err) {
      console.log("DELETE ITEM FIND ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Item not found." });
    }

    const itemRow = rows[0];

    function doDelete() {
      db.query("DELETE FROM list_items WHERE id = ?", [itemId], (err2) => {
        if (err2) {
          console.log("DELETE ITEM ERROR:", err2.message);
          return res.status(500).json({ message: "Database error." });
        }

        return res.json({ message: "Item deleted successfully." });
      });
    }

    if (itemRow.owner_id === userId) {
      return doDelete();
    }

    const permissionSql = `
      SELECT permission
      FROM list_shares
      WHERE list_id = ? AND shared_with_user_id = ?
      LIMIT 1
    `;

    db.query(permissionSql, [itemRow.list_id, userId], (err3, shareRows) => {
      if (err3) {
        console.log("DELETE ITEM PERMISSION ERROR:", err3.message);
        return res.status(500).json({ message: "Database error." });
      }

      if (shareRows.length === 0 || shareRows[0].permission !== "edit") {
        return res.status(403).json({
          message: "You do not have permission to edit this list.",
        });
      }

      return doDelete();
    });
  });
});

app.post("/lists/:id/share", (req, res) => {
  const listId = Number(req.params.id);
  const userId = Number(req.body.userId);
  const q = (req.body.q || "").trim();
  const permission = req.body.permission === "edit" ? "edit" : "view";

  if (!listId || !userId || !q) {
    return res.status(400).json({
      message: "listId, userId and q are required.",
    });
  }

  const ownerSql = `
    SELECT id
    FROM lists
    WHERE id = ? AND owner_id = ?
    LIMIT 1
  `;

  db.query(ownerSql, [listId, userId], (err, ownerRows) => {
    if (err) {
      console.log("SHARE LIST OWNER ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (ownerRows.length === 0) {
      return res.status(403).json({
        message: "Only the owner can share this list.",
      });
    }

    const findUserSql = `
      SELECT id, username, email
      FROM users
      WHERE username = ? OR email = ?
      LIMIT 1
    `;

    db.query(findUserSql, [q, q], (err2, userRows) => {
      if (err2) {
        console.log("SHARE LIST FIND USER ERROR:", err2.message);
        return res.status(500).json({ message: "Database error." });
      }

      if (userRows.length === 0) {
        return res.status(404).json({ message: "User not found." });
      }

      const targetUser = userRows[0];

      if (targetUser.id === userId) {
        return res.status(400).json({
          message: "You cannot share a list with yourself.",
        });
      }

      const insertSql = `
        INSERT INTO list_shares (list_id, shared_with_user_id, permission)
        VALUES (?, ?, ?)
      `;

      db.query(insertSql, [listId, targetUser.id, permission], (err3) => {
        if (err3) {
          if (err3.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              message: "This list is already shared with that user.",
            });
          }

          console.log("SHARE LIST INSERT ERROR:", err3.message);
          return res.status(500).json({ message: "Database error." });
        }

        return res.status(201).json({
          message: "List shared successfully.",
          user: targetUser,
        });
      });
    });
  });
});

app.post("/forgot-password", (req, res) => {
  const username = (req.body.username || "").trim();
  const email = (req.body.email || "").trim();

  if (!username || !email) {
    return res.status(400).json({
      message: "Username and email are required."
    });
  }

  const findUserSql = `
    SELECT id, username, email
    FROM users
    WHERE username = ? AND email = ?
    LIMIT 1
  `;

  db.query(findUserSql, [username, email], (err, rows) => {
    if (err) {
      console.log("FORGOT PASSWORD ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "No matching user was found."
      });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    db.query("DELETE FROM password_resets WHERE user_id = ?", [user.id], (err2) => {
      if (err2) {
        console.log("DELETE OLD TOKEN ERROR:", err2.message);
        return res.status(500).json({ message: "Database error." });
      }

      const insertSql = `
        INSERT INTO password_resets (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `;

      db.query(insertSql, [user.id, token, expiresAt], async (err3) => {
        if (err3) {
          console.log("INSERT RESET TOKEN ERROR:", err3.message);
          return res.status(500).json({ message: "Database error." });
        }

        const resetLink = `${process.env.BASE_URL}/ResetPassword.html?token=${token}`;

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Reset your password - RayaListly",
          html: `
            <h2>Password Reset</h2>
            <p>You requested to reset your password.</p>
            <p>Click the link below:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>This link expires in 30 minutes.</p>
          `
        };

        transporter.sendMail(mailOptions, (error) => {
          if (error) {
            console.log("MAIL ERROR:", error);
            return res.status(500).json({ message: "Could not send email." });
          }

          return res.json({ message: "Check your email for the reset link." });
        });
      });
    });
  });
});

app.post("/reset-password", async (req, res) => {
  const token = (req.body.token || "").trim();
  const password = req.body.password;

  if (!token || !password) {
    return res.status(400).json({
      message: "Token and password are required.",
    });
  }

  if (String(password).length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long.",
    });
  }

  const sql = `
    SELECT user_id, expires_at
    FROM password_resets
    WHERE token = ?
    LIMIT 1
  `;

  db.query(sql, [token], async (err, rows) => {
    if (err) {
      console.log("RESET PASSWORD ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(400).json({
        message: "Invalid or expired reset link.",
      });
    }

    const resetRow = rows[0];

    if (new Date() > new Date(resetRow.expires_at)) {
      return res.status(400).json({
        message: "This reset link has expired.",
      });
    }

    try {
      const passwordHash = await bcrypt.hash(password, 10);

      db.query(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        [passwordHash, resetRow.user_id],
        (err2) => {
          if (err2) {
            return res.status(500).json({ message: "Database error." });
          }

          db.query(
            "DELETE FROM password_resets WHERE user_id = ?",
            [resetRow.user_id],
            (err3) => {
              if (err3) {
                return res.status(500).json({ message: "Database error." });
              }

              return res.json({ message: "Password updated successfully." });
            }
          );
        }
      );
    } catch (error) {
      console.log("RESET PASSWORD HASH ERROR:", error.message);
      return res.status(500).json({ message: "Server error." });
    }
  });
});

app.post("/change-password", async (req, res) => {
  const userId = Number(req.body.userId);
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({
      message: "userId, currentPassword and newPassword are required.",
    });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({
      message: "New password must be at least 6 characters long.",
    });
  }

  const sql = `
    SELECT password_hash
    FROM users
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [userId], async (err, rows) => {
    if (err) {
      console.log("CHANGE PASSWORD ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    try {
      const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);

      if (!ok) {
        return res.status(401).json({
          message: "Current password is incorrect.",
        });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      db.query(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        [newPasswordHash, userId],
        (err2) => {
          if (err2) {
            return res.status(500).json({ message: "Database error." });
          }

          return res.json({ message: "Password changed successfully." });
        }
      );
    } catch (error) {
      console.log("CHANGE PASSWORD HASH ERROR:", error.message);
      return res.status(500).json({ message: "Server error." });
    }
  });
});

// Start server

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});