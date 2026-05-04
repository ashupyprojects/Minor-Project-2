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

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ✅ STATIC FILES (IMPORTANT) */
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
    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify(users, null, 2)
    );

  } catch (error) {
    console.log("Write Error:", error);
  }
}

/* ================= SEND OTP ================= */
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        success: false,
        message: "Email required"
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    otpStore[email] = otp;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Bharat Portal OTP Verification",
      html: `
        <h2>Bharat Portal</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
      `
    });

    res.json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {
    console.log("OTP Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
});

/* ================= SIGNUP ================= */
app.post("/api/signup", async (req, res) => {
  try {
    const { email, otp, userData } = req.body;

    if (!email || !otp || !userData) {
      return res.json({
        success: false,
        message: "Missing data"
      });
    }

    if (otpStore[email] != otp) {
      return res.json({
        success: false,
        message: "Invalid OTP"
      });
    }

    const users = loadUsers();

    const existingUser = users.find(
      user => user.email === email
    );

    if (existingUser) {
      return res.json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(
      userData.password,
      10
    );

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

    res.json({
      success: true,
      message: "Signup successful"
    });

  } catch (error) {
    console.log("Signup Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ================= SIGNIN (FIXED) ================= */
app.post("/api/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = loadUsers();

    const user = users.find(
      u => u.email === email
    );

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.json({
        success: false,
        message: "Invalid email or password"
      });
    }

    /* ✅ FIX: Send FULL user data */
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

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ================= OPTIONAL SEARCH API ================= */
app.get("/api/schemes", (req, res) => {
  try {
    const filePath = path.join(__dirname, "schemes.json");

    if (!fs.existsSync(filePath)) {
      return res.json([]);
    }

    const data = JSON.parse(fs.readFileSync(filePath));
    res.json(data);

  } catch (error) {
    res.status(500).json({ error: "Failed to load schemes" });
  }
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
