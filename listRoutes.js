const express = require("express");
const db = require("./db");

const router = express.Router();

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

router.post("/lists", (req, res) => {
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

router.delete("/lists/:id/share/:sharedUserId", (req, res) => {
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

router.get("/lists", (req, res) => {
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

router.get("/lists/:id", (req, res) => {
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

router.get("/lists/:id/members", (req, res) => {
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

router.delete("/lists/:id", (req, res) => {
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

router.get("/lists/:id/items", (req, res) => {
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

router.post("/lists/:id/items", (req, res) => {
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

router.put("/items/:itemId", (req, res) => {
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

router.delete("/items/:itemId", (req, res) => {
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

router.post("/lists/:id/share", (req, res) => {
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

router.post("/lists/:id/share-request", (req, res) => {
  const listId = Number(req.params.id);
  const userId = Number(req.body.userId);
  const q = (req.body.q || "").trim();

  if (!listId || !userId || !q) {
    return res.status(400).json({
      message: "listId, userId and q are required.",
    });
  }

  db.query(getAccessibleListSql(), [listId, userId, userId], (err, accessRows) => {
    if (err) {
      console.log("SHARE REQUEST ACCESS ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (accessRows.length === 0) {
      return res.status(404).json({ message: "List not found." });
    }

    const list = accessRows[0];

    if (list.owner_id === userId) {
      return res.status(400).json({
        message: "Owner can share directly.",
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
        console.log("SHARE REQUEST FIND USER ERROR:", err2.message);
        return res.status(500).json({ message: "Database error." });
      }

      if (userRows.length === 0) {
        return res.status(404).json({ message: "User not found." });
      }

      const targetUser = userRows[0];

      if (targetUser.id === userId) {
        return res.status(400).json({
          message: "You cannot request yourself.",
        });
      }

      if (targetUser.id === list.owner_id) {
        return res.status(400).json({
          message: "That user already owns this list.",
        });
      }

      const sharedSql = `
        SELECT id
        FROM list_shares
        WHERE list_id = ? AND shared_with_user_id = ?
        LIMIT 1
      `;

      db.query(sharedSql, [listId, targetUser.id], (err3, sharedRows) => {
        if (err3) {
          console.log("SHARE REQUEST CHECK SHARED ERROR:", err3.message);
          return res.status(500).json({ message: "Database error." });
        }

        if (sharedRows.length > 0) {
          return res.status(400).json({
            message: "That user is already a member of this list.",
          });
        }

        const pendingSql = `
          SELECT id
          FROM list_share_requests
          WHERE list_id = ?
            AND requested_by_user_id = ?
            AND target_user_id = ?
            AND status = 'pending'
          LIMIT 1
        `;

        db.query(pendingSql, [listId, userId, targetUser.id], (err4, pendingRows) => {
          if (err4) {
            console.log("SHARE REQUEST PENDING CHECK ERROR:", err4.message);
            return res.status(500).json({ message: "Database error." });
          }

          if (pendingRows.length > 0) {
            return res.status(400).json({
              message: "A request is already pending for this user.",
            });
          }

          const insertSql = `
            INSERT INTO list_share_requests (list_id, requested_by_user_id, target_user_id, status)
            VALUES (?, ?, ?, 'pending')
          `;

          db.query(insertSql, [listId, userId, targetUser.id], (err5, result) => {
            if (err5) {
              console.log("SHARE REQUEST INSERT ERROR:", err5.message);
              return res.status(500).json({ message: "Database error." });
            }

            return res.status(201).json({
              message: "Request sent to owner.",
              requestId: result.insertId,
            });
          });
        });
      });
    });
  });
});

router.get("/lists/:id/role", (req, res) => {
  const listId = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!listId || !userId) {
    return res.status(400).json({
      message: "listId and userId are required.",
    });
  }

  const sql = `
    SELECT
      l.id,
      l.owner_id,
      CASE
        WHEN l.owner_id = ? THEN 'owner'
        WHEN s.shared_with_user_id IS NOT NULL THEN 'member'
        ELSE 'none'
      END AS role,
      s.permission
    FROM lists l
    LEFT JOIN list_shares s
      ON s.list_id = l.id AND s.shared_with_user_id = ?
    WHERE l.id = ?
    LIMIT 1
  `;

  db.query(sql, [userId, userId, listId], (err, rows) => {
    if (err) {
      console.log("GET LIST ROLE ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0 || rows[0].role === "none") {
      return res.status(404).json({ message: "List not found." });
    }

    return res.json({
      role: rows[0].role,
      permission: rows[0].permission || null,
      ownerId: rows[0].owner_id,
    });
  });
});

router.post("/list-share-requests/:id/accept", (req, res) => {
  const requestId = Number(req.params.id);
  const userId = Number(req.body.userId);

  if (!requestId || !userId) {
    return res.status(400).json({
      message: "requestId and userId are required.",
    });
  }

  const sql = `
    SELECT
      lsr.id,
      lsr.list_id,
      lsr.requested_by_user_id,
      lsr.target_user_id,
      lsr.status,
      l.owner_id
    FROM list_share_requests lsr
    JOIN lists l ON l.id = lsr.list_id
    WHERE lsr.id = ?
    LIMIT 1
  `;

  db.query(sql, [requestId], (err, rows) => {
    if (err) {
      console.log("ACCEPT LIST SHARE REQUEST FIND ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Request not found." });
    }

    const requestRow = rows[0];

    if (requestRow.owner_id !== userId) {
      return res.status(403).json({ message: "Only the owner can accept this request." });
    }

    if (requestRow.status !== "pending") {
      return res.status(400).json({ message: "This request is not pending." });
    }

    const checkShareSql = `
      SELECT id
      FROM list_shares
      WHERE list_id = ? AND shared_with_user_id = ?
      LIMIT 1
    `;

    db.query(
      checkShareSql,
      [requestRow.list_id, requestRow.target_user_id],
      (err2, shareRows) => {
        if (err2) {
          console.log("ACCEPT LIST SHARE REQUEST CHECK ERROR:", err2.message);
          return res.status(500).json({ message: "Database error." });
        }

        const finishAccepted = () => {
          db.query(
            `UPDATE list_share_requests SET status = 'accepted' WHERE id = ?`,
            [requestId],
            (err4) => {
              if (err4) {
                console.log("ACCEPT LIST SHARE REQUEST UPDATE ERROR:", err4.message);
                return res.status(500).json({ message: "Database error." });
              }

              return res.json({ message: "Request accepted successfully." });
            }
          );
        };

        if (shareRows.length > 0) {
          return finishAccepted();
        }

        const insertShareSql = `
          INSERT INTO list_shares (list_id, shared_with_user_id, permission)
          VALUES (?, ?, 'edit')
        `;

        db.query(
          insertShareSql,
          [requestRow.list_id, requestRow.target_user_id],
          (err3) => {
            if (err3) {
              console.log("ACCEPT LIST SHARE REQUEST INSERT ERROR:", err3.message);
              return res.status(500).json({ message: "Database error." });
            }

            return finishAccepted();
          }
        );
      }
    );
  });
});

router.get("/list-share-requests", (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  const sql = `
    SELECT
      lsr.id,
      lsr.list_id,
      lsr.requested_by_user_id,
      lsr.target_user_id,
      lsr.status,
      lsr.created_at,
      l.title AS list_title,
      owner.username AS owner_username,
      requester.username AS requester_username,
      target.username AS target_username
    FROM list_share_requests lsr
    JOIN lists l ON l.id = lsr.list_id
    JOIN users owner ON owner.id = l.owner_id
    JOIN users requester ON requester.id = lsr.requested_by_user_id
    JOIN users target ON target.id = lsr.target_user_id
    WHERE l.owner_id = ?
      AND lsr.status = 'pending'
    ORDER BY lsr.created_at DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.log("GET LIST SHARE REQUESTS ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    return res.json({ requests: rows });
  });
});

router.post("/list-share-requests/:id/decline", (req, res) => {
  const requestId = Number(req.params.id);
  const userId = Number(req.body.userId);

  if (!requestId || !userId) {
    return res.status(400).json({
      message: "requestId and userId are required.",
    });
  }

  const sql = `
    SELECT
      lsr.id,
      lsr.status,
      l.owner_id
    FROM list_share_requests lsr
    JOIN lists l ON l.id = lsr.list_id
    WHERE lsr.id = ?
    LIMIT 1
  `;

  db.query(sql, [requestId], (err, rows) => {
    if (err) {
      console.log("DECLINE LIST SHARE REQUEST FIND ERROR:", err.message);
      return res.status(500).json({ message: "Database error." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Request not found." });
    }

    const requestRow = rows[0];

    if (requestRow.owner_id !== userId) {
      return res.status(403).json({ message: "Only the owner can decline this request." });
    }

    if (requestRow.status !== "pending") {
      return res.status(400).json({ message: "This request is not pending." });
    }

    db.query(
      `UPDATE list_share_requests SET status = 'declined' WHERE id = ?`,
      [requestId],
      (err2) => {
        if (err2) {
          console.log("DECLINE LIST SHARE REQUEST UPDATE ERROR:", err2.message);
          return res.status(500).json({ message: "Database error." });
        }

        return res.json({ message: "Request declined successfully." });
      }
    );
  });
});

module.exports = router;