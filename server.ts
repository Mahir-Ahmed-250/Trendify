import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs/promises";
import { MongoClient, Db } from "mongodb";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "neonthread_secure_fallback_secret_key";

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
  "admins",
  "otps",
  "categories",
  "maintenance_mode",
  "contactInfo",
  "wishlist",
  "comparison",
  "reviews",
  "announcements",
  "socialLinks"
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
        serverSelectionTimeoutMS: 3000 // 3 seconds timeout before fallback so app doesn't hang
      });
      await mongoClient.connect();
      mongoDb = mongoClient.db("neonthread_db");
      console.log("Connected successfully to MongoDB database: neonthread_db!");
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
          if (["maintenance_mode", "contactInfo", "wishlist", "comparison"].includes(key)) {
            const doc = await mongo.collection(key).findOne({ _id: "singleton" as any });
            if (doc && doc.value !== undefined) {
              dbObj[key] = doc.value;
            }
          } else {
            const docs = await mongo.collection(key).find({}).toArray();
            dbObj[key] = docs.map((doc: any) => {
              const item = { ...doc };
              if (doc._id && !doc.id) {
                item.id = doc._id.toString();
              }
              delete item._id;
              return item;
            });
          }
        })
      );

      // Check if we retrieved actual data
      const hasData = COLLECTION_KEYS.some((key) => dbObj[key] && dbObj[key].length > 0);
      
      // Cleanup specifically requested by user: remove admin@tbari.com
      if (hasData && dbObj.admins) {
        const initialCount = dbObj.admins.length;
        dbObj.admins = dbObj.admins.filter((a: any) => a.email !== 'admin@tbari.com');
        if (dbObj.admins.length < initialCount) {
          console.log("Cleanup: Removed forbidden admin email. Syncing to MongoDB...");
          const mongo = await getMongoDb();
          if (mongo) {
             await mongo.collection('admins').deleteMany({ email: 'admin@tbari.com' });
          }
        }
      }

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

        if (["maintenance_mode", "contactInfo", "wishlist", "comparison"].includes(key)) {
          await col.updateOne({ _id: "singleton" as any }, { $set: { value: data } }, { upsert: true });
          return true;
        }

        const array = Array.isArray(data) ? data : [];
        
        // 1. Get all existing IDs in the collection
        const existingDocs = await col.find({}, { projection: { _id: 1 } }).toArray();
        const existingIds = existingDocs.map(d => d._id.toString());
        
        // 2. Prepare bulk operations
        const newDocIds = new Set<string>();
        const bulkOps: any[] = [];
        
        if (array.length > 0) {
          for (const item of array) {
            if (!item || typeof item !== "object") continue;
            const itemId = item.id || item.email || item._id || String(Math.random());
            const doc = { ...item };
            
            let targetId = item.id || doc._id || itemId;
            doc._id = targetId;
            newDocIds.add(targetId.toString());

            const setPayload = { ...doc };
            delete setPayload._id;
            
            bulkOps.push({
              updateOne: {
                filter: { _id: targetId },
                update: { $set: setPayload },
                upsert: true
              }
            });
          }
        }

        // 3. Identify and add delete operations for missing documents
        const idsToDelete = existingIds.filter(id => !newDocIds.has(id));
        if (idsToDelete.length > 0) {
          bulkOps.push({
            deleteMany: {
              filter: { _id: { $in: idsToDelete as any } }
            }
          });
        }

        // 4. Execute all operations in a single bulk request
        if (bulkOps.length > 0) {
          await col.bulkWrite(bulkOps, { ordered: false });
        }
        
        return true;
      } catch (err: any) {
        console.error(`Error writing key '${key}' to MongoDB collection via bulkWrite:`, err.message || err);
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

const app = express();

let viteInstance: any = null;
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  console.log("Initializing Vite dev server asynchronously...");
  import("vite").then(({ createServer }) => {
    createServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((v) => {
      viteInstance = v;
      console.log("Vite dev server initialized.");
    }).catch((err) => {
      console.error("Failed to initialize Vite:", err);
    });
  }).catch((err) => {
    console.error("Failed to dynamically import Vite package:", err);
  });
}

  // API routes FIRST - even before middleware for debugging
  app.get("/api/health", (req, res) => {
    console.log("GET /api/health requested");
    res.json({ status: "ok" });
  });

  app.get("/api/ping", (req, res) => {
    res.send("pong");
  });

  // IMPORTANT: Trust the first proxy (required for accurate rate limiting in our cloud environment)
  app.set("trust proxy", 1);

  // Security Hardening: Apply Helmet for secure headers and Rate Limiting
  app.use(helmet({
    contentSecurityPolicy: false, // Maintain compatibility with external assets
    crossOriginEmbedderPolicy: false,
  }));

  // Rate limit for all API requests
  /*
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
  });
  app.use("/api/", apiLimiter);
  */

  // Stricter limiter for email/OTP routes to prevent abuse
  const sensitiveRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { error: "Sensitive action limit reached. Please try again in an hour." }
  });
  app.use("/api/send-newsletter", sensitiveRateLimiter);
  app.use("/api/send-otp-email", sensitiveRateLimiter);
  app.use("/api/send-invoice", sensitiveRateLimiter);

  const authenticateAdminRequest = async (req: express.Request) => {
    // 1. Check if token matches static secret (header)
    const adminSecret = process.env.ADMIN_API_SECRET;
    const secretToken = req.headers['x-admin-secret'] || req.headers['authorization'];
    if (adminSecret && secretToken === adminSecret) {
        return true;
    }
    
    // 2. Check if token is a valid JWT admin token (body)
    const { token } = req.body;
    if (token) {
       try {
         jwt.verify(token, JWT_SECRET);
         return true;
       } catch (e) {
         // Invalid JWT
       }
    }
    return false;
  };

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  console.log("Middleware configured, starting Vite if needed...");

  // Vite middleware is handled asynchronously at the end of routing

  // Health check was moved to top, but let's keep the others here or after basic middleware
  // app.get("/api/health" ...) was moved to top
  
  // --- Dynamic OG Tag Injection for Product Sharing ---
  app.get("/product/:id", async (req, res, next) => {
    try {
      const db = await readDb();
      const product = db.products?.find((p: any) => p.id === req.params.id);
      
      if (!product) return next();

      let htmlFile = (process.env.NODE_ENV === "production" || !viteInstance)
        ? path.join(process.cwd(), "dist", "index.html")
        : path.join(process.cwd(), "index.html");

      // Fallback if production file doesn't exist yet
      try {
        await fs.access(htmlFile);
      } catch (e) {
        if (process.env.NODE_ENV === "production") {
          return next();
        }
        htmlFile = path.join(process.cwd(), "index.html");
      }

      let html = await fs.readFile(htmlFile, "utf-8");

      const title = `${product.name} | NeonThread`;
      const description = product.description || `Premium quality ${product.name} available at NeonThread. Shop now for the best deals.`;
      const image = (product.images && product.images.length > 0) ? product.images[0] : "";

      const ogTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${req.protocol}://${req.get('host')}/product/${product.id}" />
    <meta property="og:type" content="product" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
      `;

      // Replace existing title and meta description if any, then insert new ones
      if (html.includes("<title>")) {
        html = html.replace(/<title>.*?<\/title>/, ogTags);
      } else {
        html = html.replace("<head>", `<head>${ogTags}`);
      }

      if (viteInstance) {
        html = await viteInstance.transformIndexHtml(req.originalUrl, html);
      }

      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (err) {
      console.error("Meta injection error:", err);
      next();
    }
  });

  app.get("/api/db", async (req, res) => {
    try {
      const db = await readDb();
      // SECURITY: Sanitize admins to remove passwords and products to remove cost prices from general fetch
      if (db) {
        if (db.admins) {
          db.admins = db.admins.map((admin: any) => {
            const { password, ...rest } = admin;
            return rest;
          });
        }
        if (db.products) {
          db.products = db.products.map((product: any) => {
            const { costPrice, ...rest } = product;
            return rest;
          });
        }
      }
      res.json(db || {});
    } catch (err: any) {
      console.error("Error in GET /api/db:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/db", async (req, res) => {
    try {
      const isAdmin = await authenticateAdminRequest(req);
      if (!isAdmin) {
        return res.status(401).json({ error: "Unauthorized access" });
      }
      const db = await readDb();
      res.json(db || {});
    } catch (err: any) {
      console.error("Error in POST /api/admin/db:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });
      const normalizedEmail = email.trim().toLowerCase();
      const db = await readDb(); // Use readDb() to check live MongoDB data
      const admins = db?.admins || [];
      const admin = admins.find((a: any) => a.email && a.email.trim().toLowerCase() === normalizedEmail && a.isActive !== false);

      if (!admin) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if password matches (handling both plain text for legacy and hashed for new)
      let isMatch = false;
      if (admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$")) {
        isMatch = await bcrypt.compare(password, admin.password);
      } else {
        isMatch = admin.password === password;
      }

      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const { password: _, ...adminWithoutPassword } = admin;
      res.json({ success: true, token, admin: adminWithoutPassword });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/update-profile", async (req, res) => {
    try {
      const { id, updates, token } = req.body;
      if (!token) return res.status(401).json({ error: "Authentication token required" });
      
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded.id !== id && decoded.role !== 'super') {
        return res.status(403).json({ error: "Permission denied" });
      }

      const db = await readDb();
      const adminIndex = db.admins?.findIndex((a: any) => a.id === id);
      
      if (adminIndex === -1) return res.status(404).json({ error: "Admin not found" });

      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const updatedAdmin = { ...db.admins[adminIndex], ...updates };
      db.admins[adminIndex] = updatedAdmin;
      
      await writeDbKey("admins", db.admins);
      
      const { password: _, ...safeAdmin } = updatedAdmin;
      res.json({ success: true, admin: safeAdmin });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });
      const normalizedEmail = email.trim().toLowerCase();
      const db = await readDb();
      const admin = db?.admins?.find((a: any) => a.email && a.email.trim().toLowerCase() === normalizedEmail);
      
      if (!admin) {
        return res.status(404).json({ error: "Admin with this email not found." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      const otps = db.otps || [];
      const newOtp = {
        id: `forgot_${Date.now()}`,
        email: normalizedEmail,
        otp,
        createdAt: new Date().toISOString(),
        verified: false,
        purpose: 'reset_password'
      };
      
      // Keep only last 100 OTPs to prevent db bloat
      const updatedOtps = [newOtp, ...(otps.slice(0, 99))];
      await writeDbKey('otps', updatedOtps);

      const mailer = getTransporter();
      await mailer.sendMail({
        from: `"NEONTHREAD" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `[${otp}] Reset your Password - NEONTHREAD Admin`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #000;">Reset Admin Password</h2>
            <p>You requested a password reset for your NeonThread admin account.</p>
            <p>Use the following 6-digit verification code:</p>
            <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `
      });

      res.json({ success: true, message: "Verification code sent to your email." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, otp: rawOtp, newPassword } = req.body;
      if (!email || !rawOtp) return res.status(400).json({ error: "Email and verification code are required" });
      
      const normalizedEmail = email.trim().toLowerCase();
      const otp = String(rawOtp).trim();
      
      const db = await readDb();
      
      const otpRecord = (db.otps || []).find((o: any) => 
        o.email && o.email.trim().toLowerCase() === normalizedEmail && 
        String(o.otp).trim() === otp && 
        !o.verified && 
        o.purpose === 'reset_password'
      );
      
      if (!otpRecord) {
        return res.status(400).json({ error: "Invalid or expired verification code." });
      }

      const createdAt = new Date(otpRecord.createdAt).getTime();
      if (Date.now() - createdAt > 10 * 60 * 1000) {
        return res.status(400).json({ error: "Verification code expired." });
      }

      const adminIndex = db.admins?.findIndex((a: any) => a.email && a.email.trim().toLowerCase() === normalizedEmail);
      if (adminIndex === -1) return res.status(404).json({ error: "Admin not found." });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.admins[adminIndex].password = hashedPassword;
      
      const updatedOtps = db.otps.map((o: any) => o.id === otpRecord.id ? { ...o, verified: true } : o);
      
      await writeDbKey('admins', db.admins);
      await writeDbKey('otps', updatedOtps);

      res.json({ success: true, message: "Password reset successful. You can now login." });
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
        database: "neonthread_db",
        collection: "Multiple Dedicated Collections (13)",
        error: lastMongoError,
      });
    } catch (err: any) {
      res.status(500).json({ connected: false, error: err.message });
    }
  });

  app.post("/api/db/init", async (req, res) => {
    try {
      if (!(await authenticateAdminRequest(req))) {
        return res.status(401).json({ error: "Unauthorized: Admin API Secret or Token required." });
      }
      const db = req.body;
      await writeDb(db);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

const PUBLIC_WRITABLE_KEYS = ["orders", "subscribers", "contactMessages", "reviews", "otps"];

  app.post("/api/db/public-add", async (req, res) => {
    try {
      const { key, data } = req.body;
      if (!key || !data) {
        return res.status(400).json({ error: "Key and data are required" });
      }

      if (!PUBLIC_WRITABLE_KEYS.includes(key)) {
        return res.status(403).json({ error: "Forbidden: Key is not publicly writable" });
      }

      const db = await readDb();
      const collection = db[key] || [];
      
      // If it's an object, we append it. If it's an array, we merge? 
      // Usually it's a single item.
      const updatedCollection = [data, ...collection];
      await writeDbKey(key, updatedCollection);
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/save", async (req, res) => {
    try {
      if (!(await authenticateAdminRequest(req))) {
        return res.status(401).json({ error: "Unauthorized: Admin API Secret or Token required." });
      }
      const { key, data } = req.body;
      if (!key) {
        return res.status(400).json({ error: "Key is required" });
      }

      // SECURITY: If we are saving the admins collection, ensure passwords are preserved and hashed if plaintext
      if (key === 'admins' && Array.isArray(data)) {
        const db = await readDb(); // Get existing admins to preserve passwords if missing in payload
        const existingAdmins = db?.admins || [];
        
        const processedAdmins = await Promise.all(data.map(async (admin: any) => {
          const existing = existingAdmins.find((a: any) => a.id === admin.id);
          const finalAdmin = { ...admin };
          
          // Preserve existing password if not provided in the update
          if (!finalAdmin.password && existing?.password) {
            finalAdmin.password = existing.password;
          }
          
          // Hash password if it's plaintext
          if (finalAdmin.password && !finalAdmin.password.startsWith("$2a$") && !finalAdmin.password.startsWith("$2b$")) {
             finalAdmin.password = await bcrypt.hash(finalAdmin.password, 10);
          }
          
          return finalAdmin;
        }));
        await writeDbKey(key, processedAdmins);
      } else {
        await writeDbKey(key, data);
      }
      
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

      // Send individual emails to ensure each is treated as a "new direct mail"
      // preventing them from being grouped or flagged as hidden list/bulk mail.
      const mailer = getTransporter();
      const messageIds: string[] = [];

      if (isBulk) {
        // Send individually in a loop (sequential is safer for standard Gmail service limits)
        for (const email of emails) {
          const info = await mailer.sendMail({
            from: `"NEONTHREAD" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: htmlBody,
            // Header to help prevent threading in some clients if the subject stays constant
            headers: {
              'X-Entity-Ref-ID': Date.now().toString() + Math.random().toString(36).substring(7)
            }
          });
          messageIds.push(info.messageId);
        }
      } else {
        const info = await mailer.sendMail({
          from: `"NEONTHREAD" <${process.env.EMAIL_USER}>`,
          to: emails[0],
          subject: subject,
          html: htmlBody,
        });
        messageIds.push(info.messageId);
      }
      
      res.status(200).json({ success: true, count: messageIds.length, messageId: messageIds[0] });
    } catch (err: any) {
      console.error("Nodemailer API Error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.post("/api/send-invoice", async (req, res) => {
    try {
      let { email, order } = req.body;
      if (!email && order?.customer?.email) {
        email = order.customer.email;
      }
      if (!email || !order) {
        return res.status(400).json({ error: "Email and order are required. If customer email is missing, please update it." });
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
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; color: #000;">NEONTHREAD</h1>
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
          <p style="font-size: 11px; color: #aaa; text-align: center; margin: 0;">Thank you for shopping with NEONTHREAD! This is a system-generated invoice.</p>
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
        from: `"NEONTHREAD" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Your Invoice for Order #${order.id} - NEONTHREAD`,
        html: invoiceHtml,
      };

      const mailer = getTransporter();
      // Await email sending to guarantee success in serverless/Vercel environments before response is closed
      await mailer.sendMail(mailOptions);
      
      res.status(200).json({ success: true, message: "Invoice email sent successfully" });
    } catch (err: any) {
      console.error("Nodemailer invoice error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.post("/api/send-otp-email", async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required." });
      }

      const otpHtml = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; display: table; width: 100%;">
            <div style="display: table-cell; vertical-align: middle;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; color: #000;">NEONTHREAD</h1>
            </div>
            <div style="display: table-cell; text-align: right; vertical-align: middle;">
              <span style="font-size: 13px; color: #666; font-weight: bold;">ORDER TRACKING VERIFICATION</span>
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <p style="font-size: 15px; color: #333; line-height: 1.5; margin: 0 0 15px 0;">আপনার NeonThread অর্ডারের বর্তমান অবস্থা ট্র্যাক করতে নিচে দেওয়া সিকিউরিটি কোড (OTP) ব্যবহার করুন:</p>
            <div style="background-color: #f0f7ff; border: 1px solid #e0f2fe; padding: 20px 10px; border-radius: 12px; text-align: center; margin: 25px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 900; color: #2563eb; letter-spacing: 5px;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #e11d48; line-height: 1.5; font-weight: bold; margin: 15px 0 0 0;">⚠️ নিরাপত্তা স্বার্থে কোডটি কাউকে শেয়ার করবেন না।</p>
          </div>

          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 25px 0;" />
          <p style="font-size: 11px; color: #aaac; text-align: center; margin: 0;">NEONTHREAD | Bangladesh's Premium T-Shirt Store</p>
        </div>
      `;

      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.warn("EMAIL_USER or EMAIL_APP_PASSWORD not set. Logging tracking OTP email content.");
        return res.status(200).json({ 
          success: true, 
          mocked: true,
          message: "Email credentials not configured on server settings, but OTP was successfully logged."
        });
      }

      const mailOptions = {
        from: `"NEONTHREAD" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `[${otp}] NeonThread Order Tracking OTP Code`,
        html: otpHtml,
      };

      const mailer = getTransporter();
      // Await email sending to guarantee success in serverless/Vercel environments before response is closed
      await mailer.sendMail(mailOptions);
      
      res.status(200).json({ success: true, message: "OTP email sent successfully" });
    } catch (err: any) {
      console.error("Nodemailer OTP sending error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  app.use((req, res, next) => {
    if (viteInstance) {
      viteInstance.middlewares(req, res, next);
    } else if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      const checkVite = setInterval(() => {
        if (viteInstance) {
          clearInterval(checkVite);
          viteInstance.middlewares(req, res, next);
        }
      }, 50);
    } else {
      next();
    }
  });

  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res, next) => {
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      if (viteInstance) {
        viteInstance.middlewares(req, res, next);
      } else {
        res.send("Loading Vite dev server...");
      }
    } else {
      res.sendFile(path.join(distPath, "index.html"));
    }
  });

  if (!process.env.VERCEL) {
    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export { app };
export default app;
