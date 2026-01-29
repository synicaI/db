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

app.post("/auth", (req, res) => {
  const { key, hwid } = req.body;
  const db = loadDB();

  const lic = db.licenses.find(l => l.key === key);
  if (!lic)
    return res.json({ success: false, reason: "invalid_key" });

  if (new Date() > new Date(lic.expires))
    return res.json({ success: false, reason: "expired" });

  if (lic.hwid && lic.hwid !== "" && lic.hwid !== hwid)
    return res.json({ success: false, reason: "hwid_locked" });

  if (!lic.hwid || lic.hwid === "") {
    lic.hwid = hwid;
    saveDB(db);
  }

  res.json({
    success: true,
    expires_on: lic.expires
  });
});

app.listen(3000, () => {
  console.log("JSON auth server running");
});
