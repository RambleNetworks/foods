var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);

// src/firebase.ts
var import_app = require("firebase/app");
var import_database = require("firebase/database");
var import_auth = require("firebase/auth");
var motherFirebaseConfig = {
  apiKey: "AIzaSyAHEABrZhwSs2OyZ81zWqhlxEy8o9FzDlU",
  authDomain: "ecat-publish.firebaseapp.com",
  databaseURL: "https://ecat-publish-default-rtdb.firebaseio.com",
  projectId: "ecat-publish",
  storageBucket: "ecat-publish.firebasestorage.app",
  messagingSenderId: "601754198547",
  appId: "1:601754198547:web:5d02eb56cce040b6c415e6",
  measurementId: "G-YB7EVFP07C"
};
var motherApp = (0, import_app.getApps)().find((a) => a.name === "[DEFAULT]") || (0, import_app.initializeApp)(motherFirebaseConfig);
var motherDatabase = (0, import_database.getDatabase)(motherApp);
var auth = (0, import_auth.getAuth)(motherApp);
var currentDatabase = motherDatabase;
var database = new Proxy({}, {
  get(_, prop) {
    return currentDatabase[prop];
  }
});
var rootRef = (0, import_database.ref)(currentDatabase, "/");
var cookedRef = (0, import_database.ref)(currentDatabase, "kitchen_cooked_items");
var deliveredRef = (0, import_database.ref)(currentDatabase, "delivered_orders");
var undeliveredRef = (0, import_database.ref)(currentDatabase, "undelivered_orders");
var receivedPaymentsRef = (0, import_database.ref)(currentDatabase, "admin_received_payments");
var lossOrdersRef = (0, import_database.ref)(currentDatabase, "admin_loss_orders");

// server.ts
var import_database2 = require("firebase/database");
import_dotenv.default.config();
async function performHuggingFaceKeepAlive() {
  const token = process.env.HF_TOKEN || "";
  const targetRepo = process.env.HF_REPO_ID || "ramblenetworks/ramblenjp";
  const deepasKitchenRepo = "ramblenetworks/DeepasKitchen";
  try {
    const urls = [
      "https://ramblenetworks-ramblenjp.hf.space",
      `https://huggingface.co/api/spaces/${targetRepo}`,
      "https://ramblenetworks-deepaskitchen.hf.space",
      `https://huggingface.co/api/spaces/${deepasKitchenRepo}`
    ];
    await Promise.all(urls.map((url) => fetch(url, { method: "GET" }).catch(() => {
    })));
    if (token) {
      await fetch(`https://huggingface.co/api/spaces/${targetRepo}/restart`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      }).catch(() => {
      });
      await fetch(`https://huggingface.co/api/spaces/${deepasKitchenRepo}/restart`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      }).catch(() => {
      });
    }
  } catch (e) {
  }
}
function setupFirebaseNormalizationWatcher() {
  console.log("[Phone Normalizer] Starting background Firebase database normalization watcher...");
  const ordersRef = (0, import_database2.ref)(database, "ORDERS001");
  const processOrder = (orderId, orderData) => {
    if (!orderData || typeof orderData !== "object") return;
    const phone = orderData.phone;
    const mobile = orderData.mobile;
    const customerMobile = orderData.customerMobile;
    const customerNumber = orderData.customerNumber;
    const customer_mobile = orderData.customer_mobile;
    const Phone_Number = orderData.Phone_Number;
    const candidates = [phone, mobile, customerMobile, customerNumber, customer_mobile, Phone_Number].map((val) => String(val || "").trim()).filter((val) => val.length > 0);
    if (candidates.length === 0) return;
    let bestPhone = "";
    for (const cand of candidates) {
      const clean = cand.replace(/\D/g, "");
      if (clean.length >= 10) {
        bestPhone = clean;
        break;
      }
    }
    if (!bestPhone && candidates.length > 0) {
      bestPhone = candidates[0].replace(/\D/g, "");
    }
    if (!bestPhone) return;
    const updates = {};
    if (phone !== bestPhone) updates.phone = bestPhone;
    if (mobile !== bestPhone) updates.mobile = bestPhone;
    if (customerMobile !== bestPhone) updates.customerMobile = bestPhone;
    if (customerNumber !== bestPhone) updates.customerNumber = bestPhone;
    if (customer_mobile !== bestPhone && customer_mobile !== void 0) updates.customer_mobile = bestPhone;
    if (Phone_Number !== bestPhone && Phone_Number !== void 0) updates.Phone_Number = bestPhone;
    if (Object.keys(updates).length > 0) {
      console.log(`[Phone Normalizer] Normalizing order ${orderId}`);
      const orderPathRef = (0, import_database2.ref)(database, `ORDERS001/${orderId}`);
      (0, import_database2.update)(orderPathRef, updates).catch(() => {
      });
    }
  };
  (0, import_database2.onChildAdded)(ordersRef, (snapshot) => {
    const orderId = snapshot.key;
    const orderData = snapshot.val();
    if (orderId && orderData) processOrder(orderId, orderData);
  }, () => {
  });
  (0, import_database2.onChildChanged)(ordersRef, (snapshot) => {
    const orderId = snapshot.key;
    const orderData = snapshot.val();
    if (orderId && orderData) processOrder(orderId, orderData);
  }, () => {
  });
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/api/refresh-hf", async (req, res) => {
    await performHuggingFaceKeepAlive();
    res.json({ success: true, message: "Hugging Face keep-alive checks successfully executed." });
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  try {
    setupFirebaseNormalizationWatcher();
  } catch (e) {
    console.error("Error setting up Firebase watchers:", e);
  }
  setInterval(() => {
    performHuggingFaceKeepAlive().catch(() => {
    });
  }, 10 * 60 * 1e3);
  setTimeout(() => {
    performHuggingFaceKeepAlive().catch(() => {
    });
  }, 5e3);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
