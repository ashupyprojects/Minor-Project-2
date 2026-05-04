// server.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= RESEND ================= */
const resend = new Resend(process.env.RESEND_API_KEY);

/* ================= FILE PATH ================= */
const USERS_FILE = path.join(__dirname, "users.json");
const SCHEMES_FILE = path.join(__dirname, "schemes.json");

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= OTP STORE ================= */
let otpStore = {};

/* ================= HELPERS ================= */
function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log("Read Error:", error);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.log("Write Error:", error);
  }
}

function loadSchemes() {
  try {
    if (!fs.existsSync(SCHEMES_FILE)) return [];
    const data = fs.readFileSync(SCHEMES_FILE, "utf8");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log("Schemes Read Error:", error);
    return [];
  }
}

/* ================= SEND OTP ================= */
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: "Email required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Bharat Portal OTP Verification",
      html: `<h2>Bharat Portal</h2><h1>${otp}</h1>`
    });

    res.json({ success: true, message: "OTP sent successfully" });

  } catch (error) {
    console.log("OTP Error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});

/* ================= SIGNUP ================= */
app.post("/api/signup", async (req, res) => {
  try {
    const { email, otp, userData } = req.body;

    if (!email || !otp || !userData) {
      return res.json({ success: false, message: "Missing data" });
    }

    if (otpStore[email] != otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    const users = loadUsers();

    if (users.find(u => u.email === email)) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = {
      id: Date.now(),
      name: userData.name,
      dob: userData.dob,
      state: userData.state,
      category: userData.category,
      employmentStatus: userData.employmentStatus,
      casteCategory: userData.casteCategory,
      email: userData.email,
      password: hashedPassword
    };

    users.push(newUser);
    saveUsers(users);
    delete otpStore[email];

    res.json({ success: true, message: "Signup successful" });

  } catch (error) {
    console.log("Signup Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= SIGNIN ================= */
app.post("/api/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = loadUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    /* ✅ FULL USER DATA */
    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dob: user.dob,
        state: user.state,
        category: user.category,
        employmentStatus: user.employmentStatus,
        casteCategory: user.casteCategory
      }
    });

  } catch (error) {
    console.log("Signin Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= FILTER SCHEMES (FIX) ================= */
app.get("/filter-schemes", (req, res) => {
  try {
    let { age, income, state, beneficiary, caste } = req.query;

    age = Number(age);
    income = Number(income);

    const schemes = loadSchemes();

    const filtered = schemes.filter(s => {

      if (s.minAge && age < s.minAge) return false;
      if (s.maxAge && age > s.maxAge) return false;

      if (s.maxIncome && income && income > s.maxIncome) return false;

      if (s.state && s.state !== "All" && s.state !== state) return false;

      if (s.category && s.category !== beneficiary) return false;

      if (s.caste && s.caste !== "All" && s.caste !== caste) return false;

      return true;
    });

    res.json(filtered);

  } catch (error) {
    console.log("Filter Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
