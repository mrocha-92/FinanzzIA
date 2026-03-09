import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("finance.db");
console.log("Database initialized at finance.db");

const JWT_SECRET = process.env.JWT_SECRET || "finanzzia-secret-key-2026";

// Initialize database
try {
  // Check if migration is needed
  const tableInfo = db.prepare("PRAGMA table_info(transactions)").all() as any[];
  const hasUserId = tableInfo.some(col => col.name === 'user_id');

  if (!hasUserId) {
    console.log("Migrating database to multi-user schema...");
    // Drop existing tables to recreate with new schema
    // In a production app, we would use ALTER TABLE or a temporary table to preserve data
    db.exec(`
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS planning;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS planning (
      user_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      budget_limit REAL DEFAULT 0,
      savings_goal REAL DEFAULT 0,
      PRIMARY KEY (user_id, month),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  console.log("Tables 'users', 'transactions' and 'planning' checked/created");
} catch (err) {
  console.error("Database initialization error:", err);
}

// Middleware to verify JWT
const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { full_name, birth_date, email, username, password } = req.body;
    if (!full_name || !birth_date || !email || !username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare(
        "INSERT INTO users (full_name, birth_date, email, username, password) VALUES (?, ?, ?, ?, ?)"
      ).run(full_name, birth_date, email, username, hashedPassword);
      
      const user = { id: info.lastInsertRowid, full_name, username, email };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
      
      res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });
      res.status(201).json(user);
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email or username already exists" });
      }
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const user = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(username, username);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const userPayload = { id: user.id, full_name: user.full_name, username: user.username, email: user.email };
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });
      
      res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });
      res.json(userPayload);
    } catch (error) {
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user) {
        // For security, don't reveal if user exists
        return res.json({ message: "If an account exists with this email, the password has been sent." });
      }

      // In a real app, you'd send an email here.
      // Since we can't send real emails, we'll log it and return success.
      console.log(`[MOCK EMAIL] To: ${email} - Your password recovery request was received. (In a real app, we'd send a reset link or the password if requested)`);
      
      res.json({ message: "Password recovery email sent (Mocked in console)" });
    } catch (error) {
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  // Protected API Routes
  app.get("/api/planning/:month", authenticateToken, (req: any, res) => {
    const { month } = req.params;
    const userId = req.user.id;
    try {
      let plan = db.prepare("SELECT * FROM planning WHERE month = ? AND user_id = ?").get(month, userId);
      if (!plan) {
        db.prepare("INSERT INTO planning (user_id, month, budget_limit, savings_goal) VALUES (?, ?, 0, 0)").run(userId, month);
        plan = { user_id: userId, month, budget_limit: 0, savings_goal: 0 };
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch planning" });
    }
  });

  app.post("/api/planning", authenticateToken, (req: any, res) => {
    const { month, budget_limit, savings_goal } = req.body;
    const userId = req.user.id;
    if (!month) return res.status(400).json({ error: "Month is required" });

    try {
      db.prepare(`
        INSERT INTO planning (user_id, month, budget_limit, savings_goal) 
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, month) DO UPDATE SET 
          budget_limit = excluded.budget_limit,
          savings_goal = excluded.savings_goal
      `).run(userId, month, budget_limit || 0, savings_goal || 0);
      
      const updatedPlan = db.prepare("SELECT * FROM planning WHERE user_id = ? AND month = ?").get(userId, month);
      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ error: "Failed to save planning" });
    }
  });

  app.get("/api/transactions", authenticateToken, (req: any, res) => {
    const userId = req.user.id;
    try {
      const transactions = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC").all(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", authenticateToken, (req: any, res) => {
    const { description, amount, type, date } = req.body;
    const userId = req.user.id;
    if (!description || !amount || !type || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const info = db.prepare(
        "INSERT INTO transactions (user_id, description, amount, type, date) VALUES (?, ?, ?, ?, ?)"
      ).run(userId, description, amount, type, date);
      
      const newTransaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(info.lastInsertRowid);
      res.status(201).json(newTransaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.delete("/api/transactions", authenticateToken, (req: any, res) => {
    const userId = req.user.id;
    try {
      db.prepare("DELETE FROM transactions WHERE user_id = ?").run(userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear transactions" });
    }
  });

  app.delete("/api/transactions/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
      db.prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?").run(id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  app.put("/api/transactions/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { description, amount, type, date } = req.body;
    
    if (!description || !amount || !type || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const result = db.prepare(
        "UPDATE transactions SET description = ?, amount = ?, type = ?, date = ? WHERE id = ? AND user_id = ?"
      ).run(description, amount, type, date, id, userId);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const updatedTransaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
      res.json(updatedTransaction);
    } catch (error) {
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
