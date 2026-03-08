import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("finance.db");
console.log("Database initialized at finance.db");

// Initialize database
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS planning (
      month TEXT PRIMARY KEY,
      budget_limit REAL DEFAULT 0,
      savings_goal REAL DEFAULT 0
    );
  `);
  console.log("Tables 'transactions' and 'planning' checked/created");
} catch (err) {
  console.error("Database initialization error:", err);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/planning/:month", (req, res) => {
    const { month } = req.params;
    try {
      let plan = db.prepare("SELECT * FROM planning WHERE month = ?").get(month);
      if (!plan) {
        // Create default plan for the month if it doesn't exist
        db.prepare("INSERT INTO planning (month, budget_limit, savings_goal) VALUES (?, 0, 0)").run(month);
        plan = { month, budget_limit: 0, savings_goal: 0 };
      }
      res.json(plan);
    } catch (error) {
      console.error("Failed to fetch planning:", error);
      res.status(500).json({ error: "Failed to fetch planning" });
    }
  });

  app.post("/api/planning", (req, res) => {
    const { month, budget_limit, savings_goal } = req.body;
    if (!month) return res.status(400).json({ error: "Month is required" });

    try {
      db.prepare(`
        INSERT INTO planning (month, budget_limit, savings_goal) 
        VALUES (?, ?, ?)
        ON CONFLICT(month) DO UPDATE SET 
          budget_limit = excluded.budget_limit,
          savings_goal = excluded.savings_goal
      `).run(month, budget_limit || 0, savings_goal || 0);
      
      const updatedPlan = db.prepare("SELECT * FROM planning WHERE month = ?").get(month);
      res.json(updatedPlan);
    } catch (error) {
      console.error("Failed to save planning:", error);
      res.status(500).json({ error: "Failed to save planning" });
    }
  });

  app.get("/api/transactions", (req, res) => {
    console.log("GET /api/transactions called");
    try {
      const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC, id DESC").all();
      console.log(`Returning ${transactions.length} transactions`);
      res.json(transactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", (req, res) => {
    console.log("POST /api/transactions called", req.body);
    const { description, amount, type, date } = req.body;
    if (!description || !amount || !type || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const info = db.prepare(
        "INSERT INTO transactions (description, amount, type, date) VALUES (?, ?, ?, ?)"
      ).run(description, amount, type, date);
      
      const newTransaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(info.lastInsertRowid);
      console.log("Transaction created:", newTransaction);
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error("Failed to create transaction:", error);
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.delete("/api/transactions", (req, res) => {
    try {
      db.prepare("DELETE FROM transactions").run();
      res.status(204).send();
    } catch (error) {
      console.error("Failed to clear transactions:", error);
      res.status(500).json({ error: "Failed to clear transactions" });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  app.put("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    const { description, amount, type, date } = req.body;
    
    if (!description || !amount || !type || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const result = db.prepare(
        "UPDATE transactions SET description = ?, amount = ?, type = ?, date = ? WHERE id = ?"
      ).run(description, amount, type, date, id);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const updatedTransaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Failed to update transaction:", error);
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
