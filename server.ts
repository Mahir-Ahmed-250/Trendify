import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs/promises";
import { MongoClient, Db } from "mongodb";

dotenv.config();

const DB_FILE = path.join(process.cwd(), "db.json");

const COLLECTION_KEYS = [
  "products",
  "faqs",
  "policies",
  "orders",
  "coupons",
  "slides",
  "categoryBanners",
  "lookbook",
  "subscribers",
  "contactMessages",
  "popupAds",
  "homeAds",
  "admins"
];

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let lastMongoError: string | null = null;

async function getMongoDb(): Promise<Db | null> {
  const envUri = process.env.MONGODB_URI;
  if (!envUri) {
    lastMongoError = "MONGODB_URI environment variable is missing entirely.";
    return null;
  }
  if (!mongoDb) {
    // Robustly clean angle brackets if the user kept them by mistake, e.g.:
    // mongodb+srv://<TShirt_Store>:<rtyfghcvb>@cluster0...
    let cleanUri = envUri;
    
    // Replace <username> and <password> formatting
    const regex = /^(mongodb\+srv:\/\/|mongodb:\/\/)([^/]+)/;
    const match = cleanUri.match(regex);
    if (match) {
      const scheme = match[1]; // mongodb+srv:// or mongodb://
      const rest = match[2];   // <TShirt_Store>:<rtyfghcvb>@cluster0.qnlpi.mongodb.net
      
      const parts = rest.split("@");
      if (parts.length >= 2) {
        const credentials = parts[0];
        const host = parts.slice(1).join("@");
        
        const credParts = credentials.split(":");
        if (credParts.length === 2) {
          let user = credParts[0];
          let pass = credParts[1];
          if (user.startsWith("<") && user.endsWith(">")) {
            user = user.slice(1, -1);
          }
          if (pass.startsWith("<") && pass.endsWith(">")) {
            pass = pass.slice(1, -1);
          }
          
          // Atlas username is case-sensitive and registered as 'Tshirt_Store' (lowercase 's').
          // If the user supplied 'TShirt_Store' or any other case variant, we map it correctly.
          if (user.toLowerCase() === "tshirt_store") {
            user = "Tshirt_Store";
          }
          
          cleanUri = cleanUri.replace(rest, `${user}:${pass}@${host}`);
        }
      }
    }

    try {
      console.log("Connecting to MongoDB...");
      mongoClient = new MongoClient(cleanUri, {
        serverSelectionTimeoutMS: 15000 // 5 seconds timeout before fallback so app doesn't hang
      });
      await mongoClient.connect();
      mongoDb = mongoClient.db("trendify_db");
      console.log("Connected successfully to MongoDB database: trendify_db!");
      lastMongoError = null;
    } catch (err: any) {
      lastMongoError = err.message || String(err);
      console.error("Failed to connect to MongoDB, falling back to local file DB. Error detail:", lastMongoError);
      return null;
    }
  }
  return mongoDb;
}

async function readDb() {
  const mongo = await getMongoDb();
  if (mongo) {
    try {
      const dbObj: any = {};
      
      // Load all collections in parallel for maximum speed
      await Promise.all(
        COLLECTION_KEYS.map(async (key) => {
          const docs = await mongo.collection(key).find({}).toArray();
          dbObj[key] = docs.map((doc: any) => {
            const item = { ...doc };
            if (doc._id && !doc.id) {
              item.id = doc._id.toString();
            }
            delete item._id;
            return item;
          });
        })
      );

      // Check if we retrieved actual data
      const hasData = COLLECTION_KEYS.some((key) => dbObj[key] && dbObj[key].length > 0);
      if (hasData) {
        return dbObj;
      } else {
        // Automatically migrate server-side local storage db.json to individual MongoDB collections
        console.log("MongoDB is connected but collections are empty. Migrating local db.json data...");
        const fileDb = await readDbFromFileOnly();
        if (fileDb && Object.keys(fileDb).length > 0) {
          await writeDb(fileDb);
          return fileDb;
        }
      }
      return dbObj;
    } catch (err) {
      console.error("Error reading from MongoDB individual collections, falling back to local file:", err);
    }
  }

  return readDbFromFileOnly();
}

async function readDbFromFileOnly() {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

async function writeDb(db: any) {
  const mongo = await getMongoDb();
  if (mongo) {
    try {
      await Promise.all(
        Object.keys(db).map(async (key) => {
          if (COLLECTION_KEYS.includes(key)) {
            await writeDbKey(key, db[key]);
          }
        })
      );
      return true;
    } catch (err) {
      console.error("Error writing to MongoDB individual collections, falling back to local file:", err);
    }
  }

  try {
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing database to local file:", err);
    return false;
  }
}

const writeLocks: Record<string, Promise<any>> = {};

async function writeDbKey(key: string, data: any): Promise<boolean> {
  const currentPromise = writeLocks[key] || Promise.resolve();
  
  const nextPromise = currentPromise.then(async () => {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const col = mongo.collection(key);
        // Clean target collection for pristine, error-free sync
        await col.deleteMany({});
        
        const array = Array.isArray(data) ? data : [];
        if (array.length > 0) {
          // De-duplicate items by id to ensure absolute uniqueness inside the array
          const seenIds = new Set<string>();
          const uniqueDocs: any[] = [];
          
          for (const item of array) {
            if (!item || typeof item !== "object") continue;
            const itemId = item.id || item.email || String(Math.random());
            if (!seenIds.has(itemId)) {
              seenIds.add(itemId);
              const doc = { ...item };
              if (item.id) {
                doc._id = item.id;
              }
              uniqueDocs.push(doc);
            }
          }
          
          if (uniqueDocs.length > 0) {
            await col.insertMany(uniqueDocs);
          }
        }
        return true;
      } catch (err: any) {
        console.error(`Error writing key '${key}' to MongoDB collection, falling back to local file:`, err.message || err);
      }
    }

    try {
      const db = (await readDbFromFileOnly()) || {};
      db[key] = data;
      await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      return true;
    } catch (err: any) {
      console.error(`Error writing key '${key}' to database file:`, err.message || err);
      return false;
    }
  }).catch((err) => {
    console.error(`Unhandled error inside writeDbKey lock chain for key '${key}':`, err);
    return false;
  });

  writeLocks[key] = nextPromise;
  return nextPromise;
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error('EMAIL_USER and EMAIL_APP_PASSWORD environment variables are required');
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return transporter;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/db", async (req, res) => {
    try {
      const db = await readDb();
      res.json(db || {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/db/status", async (req, res) => {
    try {
      const mongo = await getMongoDb();
      res.json({
        connected: mongo !== null,
        uri_configured: !!process.env.MONGODB_URI,
        database: "trendify_db",
        collection: "Multiple Dedicated Collections (13)",
        error: lastMongoError,
      });
    } catch (err: any) {
      res.status(500).json({ connected: false, error: err.message });
    }
  });

  app.post("/api/db/init", async (req, res) => {
    try {
      const db = req.body;
      await writeDb(db);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/save", async (req, res) => {
    try {
      const { key, data } = req.body;
      if (!key) {
        return res.status(400).json({ error: "Key is required" });
      }
      await writeDbKey(key, data);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/send-newsletter", async (req, res) => {
    try {
      const { target, subject, body, image, subscribers } = req.body;

      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
         return res.status(500).json({ 
            error: "Email credentials not configured. Please add EMAIL_USER and EMAIL_APP_PASSWORD in the Settings menu (use a Google App Password, not your regular password)." 
         });
      }

      if (!subject || !body) {
        return res.status(400).json({ error: "Subject and body are required." });
      }

      const emails = target === 'all' 
        ? subscribers || [] 
        : [target];

      if (emails.length === 0) {
        return res.status(400).json({ error: "No target emails provided." });
      }

      // Convert body text to basic HTML (paragraphs/breaks)
      const isBulk = target === 'all';
      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${image ? `<img src="${image}" alt="Newsletter Banner" style="width: 100%; border-radius: 8px; margin-bottom: 20px;" />` : ''}
          <h2 style="color: #111;">${subject}</h2>
          <div style="color: #444; line-height: 1.6; white-space: pre-wrap;">${body}</div>
          ${isBulk ? `<hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" /><p style="font-size: 12px; color: #888; text-align: center;">You are receiving this because you subscribed to our newsletter.</p>` : ''}
        </div>
      `;

      // Send emails using Nodemailer
      const mailOptions = {
        from: `"Shop Admin" <${process.env.EMAIL_USER || "admin@example.com"}>`,
        to: isBulk ? [] : emails,
        bcc: isBulk ? emails : [], // Use BCC for bulk to hide other recipients
        subject: subject,
        html: htmlBody,
      };

      const mailer = getTransporter();
      const info = await mailer.sendMail(mailOptions);
      
      res.status(200).json({ success: true, messageId: info.messageId });
    } catch (err: any) {
      console.error("Nodemailer API Error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.post("/api/send-invoice", async (req, res) => {
    try {
      const { email, order } = req.body;
      if (!email || !order) {
        return res.status(400).json({ error: "Email and order are required." });
      }

      const itemsHtml = order.items.map((item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" referrerPolicy="no-referrer" />
              <span>${item.name}</span>
            </div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">৳${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('');

      const hasDhaka = order.customer.address.includes('District: Dhaka') || order.customer.address.toLowerCase().includes('dhaka');
      const shippingCharge = hasDhaka ? 70 : 120;

      const invoiceHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #fff;">
          <div style="border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; display: table; width: 100%;">
            <div style="display: table-cell; vertical-align: middle;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; color: #000;">TRENDIFY</h1>
            </div>
            <div style="display: table-cell; text-align: right; vertical-align: middle;">
              <span style="font-size: 14px; color: #888; font-weight: bold;">INVOICE</span>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <p style="margin: 3px 0; font-size: 13px; color: #555;"><strong>Order ID:</strong> ${order.id}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #555;"><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
          </div>

          <div style="margin-bottom: 25px; background: #f9f9f9; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #999;">Shipping Address</h3>
            <p style="margin: 3px 0; font-size: 14px; font-weight: bold; color: #111;">${order.customer.name}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #444;"><strong>Phone:</strong> ${order.customer.phone}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #444;"><strong>Email:</strong> ${order.customer.email}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #444;"><strong>Address:</strong> ${order.customer.address}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #000; color: #fff;">
                <th style="padding: 10px; font-size: 12px; text-align: left; text-transform: uppercase;">Product</th>
                <th style="padding: 10px; font-size: 12px; text-align: center; text-transform: uppercase;">Qty</th>
                <th style="padding: 10px; font-size: 12px; text-align: right; text-transform: uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="width: 250px; margin-left: auto; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666;">Subtotal:</span>
              <strong style="color: #111;">৳${order.subtotal.toFixed(2)}</strong>
            </div>
            ${order.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #22c55e;">
                <span>Discount:</span>
                <strong>- ৳${order.discount.toFixed(2)}</strong>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666;">Shipping:</span>
              <strong style="color: #111;">৳${shippingCharge.toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px; font-size: 15px;">
              <span style="font-weight: bold; color: #000;">Total:</span>
              <strong style="font-weight: 950; color: #000;">৳${order.total.toFixed(2)}</strong>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 11px; color: #aaa; text-align: center; margin: 0;">Thank you for shopping with TRENDIFY! This is a system-generated invoice.</p>
        </div>
      `;

      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.warn("EMAIL_USER or EMAIL_APP_PASSWORD not set. Logging email content or returning successful mocked email send.");
        return res.status(200).json({ 
          success: true, 
          mocked: true,
          message: "Email credentials not configured on server settings, but invoice payload received successfully!"
        });
      }

      // Send the email using Nodemailer
      const mailOptions = {
        from: `"TRENDIFY" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Your Invoice for Order #${order.id} - TRENDIFY`,
        html: invoiceHtml,
      };

      const mailer = getTransporter();
      const info = await mailer.sendMail(mailOptions);
      res.status(200).json({ success: true, messageId: info.messageId });
    } catch (err: any) {
      console.error("Nodemailer invoice error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Notice how we use '*' for Express v4 to serve SPA!
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
