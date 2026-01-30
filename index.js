const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const DB_FILE = "./licenses.json";

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= AUTH UTILISATEUR =================
app.post("/auth", (req, res) => {
  const { key, hwid } = req.body;
  const db = loadDB();
  const lic = db.licenses.find(l => l.key === key);

  if (!lic) return res.json({ success: false, reason: "invalid_key" });
  if (new Date() > new Date(lic.expires)) return res.json({ success: false, reason: "expired" });
  if (lic.hwid && lic.hwid !== "" && lic.hwid !== hwid) return res.json({ success: false, reason: "hwid_locked" });

  if (!lic.hwid || lic.hwid === "") {
    lic.hwid = hwid;
    saveDB(db);
  }
  res.json({ success: true, expires_on: lic.expires });
});

// ================= PARTIE ADMIN (Pour ton code C++) =================

// 1. Login Admin
app.post("/admin/login", (req, res) => {
  const { admin_key } = req.body;
  const db = loadDB();

  if (admin_key === db.admin_key) {
    res.json({ success: true });
  } else {
    res.json({ success: false, reason: "wrong_key" });
  }
});

// 2. Récupérer toutes les licences
app.get("/admin/licenses", (req, res) => {
  // Note: En production, il faudrait vérifier un token ici pour la sécurité
  const db = loadDB();
  res.json(db.licenses);
});

// 3. Mettre à jour une licence (HWID ou Date)
app.post("/admin/update", (req, res) => {
  const { key, hwid, expires } = req.body;
  const db = loadDB();
  
  const index = db.licenses.findIndex(l => l.key === key);
  if (index !== -1) {
    db.licenses[index].hwid = hwid;
    db.licenses[index].expires = expires;
    saveDB(db);
    res.json({ success: true });
  } else {
    res.json({ success: false, reason: "key_not_found" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000 (Auth + Admin)");
});
