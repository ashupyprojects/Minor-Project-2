// server.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;

// File path
const USERS_FILE = path.join(__dirname, "users.json");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= EMAIL CONFIG ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "2024ashu@gmail.com",
    pass: "ddvukitbaealfmgg"
  }
});

// OTP storage
let otpStore = {};

/* ================= HELPERS ================= */
function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Error reading users file:", err);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error writing users file:", err);
  }
}

/* ================= SEND OTP ================= */
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = otp;

  try {
    await transporter.sendMail({
      to: email,
      subject: "Bharat Portal OTP Verification",
      text: `Your OTP is ${otp}`
    });

    res.json({ success: true, message: "OTP sent to email" });

  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, message: "Email failed" });
  }
});

/* ================= SIGNUP ================= */
app.post("/api/signup", async (req, res) => {
  try {
    const { email, otp, userData } = req.body;

    if (otpStore[email] != otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    const users = loadUsers();

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = {
      id: Date.now(),
      ...userData,
      password: hashedPassword
    };

    users.push(newUser);
    saveUsers(users);

    delete otpStore[email];

    res.json({ success: true, message: "Signup successful" });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= SIGNIN ================= */
app.post("/api/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const users = loadUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        dob: user.dob,
        state: user.state,
        category: user.category,
        employmentStatus: user.employmentStatus,
        casteCategory: user.casteCategory,
        email: user.email,
      }
    });

  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= FILTER SCHEMES ================= */
app.get("/filter-schemes", (req, res) => {
  let { age, income, state, beneficiary, caste } = req.query;

  const ageNum = parseInt(age);
  const incomeNum = parseInt(income);

  const schemes = [

    // 🌾 Agriculture (Farmer)
    { name: "PM Kisan Samman Nidhi", page: "agriculture.html", category: "Farmer", minAge: 18, maxIncome: 500000, caste: "all" },
    { name: "Pradhan Mantri Fasal Bima Yojana", page: "agriculture.html", category: "Farmer", minAge: 18, maxIncome: 500000, caste: "all" },
    { name: "Pradhan Mantri Krishi Sinchayee Yojana", page: "agriculture.html", category: "Farmer", minAge: 18, maxIncome: 500000, caste: "all" },
    { name: "e-NAM National Agriculture Market", page: "agriculture.html", category: "Farmer", minAge: 18, maxIncome: 500000, caste: "all" },
    { name: "Soil Health Card Scheme", page: "agriculture.html", category: "Farmer", minAge: 18, maxIncome: 500000, caste: "all" },
    { name: "Rashtriya Krishi Vikas Yojana", page: "agriculture.html", category: "Farmer", minAge: 18, maxIncome: 500000, caste: "all" },

    // 🎓 Education (Student)
    { name: "Samagra Shiksha Abhiyan", page: "education.html", category: "Student", minAge: 5, maxIncome: 300000, caste: "all" },
    { name: "Mid-Day Meal Scheme", page: "education.html", category: "Student", minAge: 5, maxIncome: 300000, caste: "all" },
    { name: "National Means Merit Scholarship", page: "education.html", category: "Student", minAge: 10, maxIncome: 300000, caste: "all" },
    { name: "PM Scholarship Scheme", page: "education.html", category: "Student", minAge: 18, maxIncome: 300000, caste: "all" },
    { name: "AICTE Pragati Scholarship", page: "education.html", category: "Student", minAge: 18, maxIncome: 300000, caste: "all" },
    { name: "SWAYAM Platform", page: "education.html", category: "Student", minAge: 15, maxIncome: 300000, caste: "all" },

    // 💼 Employment
    { name: "MGNREGA", page: "employment.html", category: "Unemployed", minAge: 18, maxIncome: 200000, caste: "all" },
    { name: "PMKVY Skill Development", page: "employment.html", category: "Unemployed", minAge: 18, maxIncome: 200000, caste: "all" },
    { name: "DDU-GKY Scheme", page: "employment.html", category: "Unemployed", minAge: 18, maxIncome: 200000, caste: "all" },
    { name: "Atal Innovation Mission", page: "employment.html", category: "Entrepreneur", minAge: 18, maxIncome: 1000000, caste: "all" },
    { name: "PM SVANidhi Scheme", page: "employment.html", category: "Entrepreneur", minAge: 18, maxIncome: 1000000, caste: "all" },
    { name: "Startup India Scheme", page: "employment.html", category: "Entrepreneur", minAge: 18, maxIncome: 1000000, caste: "all" },

    // 🏥 Health (All)
    { name: "Ayushman Bharat PMJAY", page: "health.html", category: "All", minAge: 0, maxIncome: 500000, caste: "all" },
    { name: "Mission Indradhanush", page: "health.html", category: "All", minAge: 0, maxIncome: 500000, caste: "all" },
    { name: "Janani Suraksha Yojana", page: "health.html", category: "Women", minAge: 18, maxIncome: 300000, caste: "all" },
    { name: "PMSMA Scheme", page: "health.html", category: "Women", minAge: 18, maxIncome: 300000, caste: "all" },
    { name: "RSBY Health Scheme", page: "health.html", category: "All", minAge: 0, maxIncome: 500000, caste: "all" },
    { name: "National Digital Health Mission", page: "health.html", category: "All", minAge: 0, maxIncome: 500000, caste: "all" },

    // 👩 Women
    { name: "Beti Bachao Beti Padhao", page: "women.html", category: "Women", minAge: 0, maxIncome: 300000, caste: "all" },
    { name: "PM Matru Vandana Yojana", page: "women.html", category: "Women", minAge: 18, maxIncome: 300000, caste: "all" },
    { name: "One Stop Centre Scheme", page: "women.html", category: "Women", minAge: 18, maxIncome: 300000, caste: "all" },
    { name: "ICDS Scheme", page: "women.html", category: "Women", minAge: 0, maxIncome: 300000, caste: "all" },
    { name: "POSHAN Abhiyaan", page: "women.html", category: "Women", minAge: 0, maxIncome: 300000, caste: "all" },
    { name: "Working Women Hostel Scheme", page: "women.html", category: "Women", minAge: 18, maxIncome: 500000, caste: "all" },

    // 👵 Senior Citizen
    { name: "PM Vaya Vandana Yojana", page: "seniorcitizens.html", category: "Senior Citizen", minAge: 60, maxIncome: 500000, caste: "all" },
    { name: "Old Age Pension Scheme", page: "seniorcitizens.html", category: "Senior Citizen", minAge: 60, maxIncome: 200000, caste: "all" },

    // 👨‍💼 Entrepreneur
    { name: "Stand-Up India Scheme", page: "entrepreneurs.html", category: "Entrepreneur", minAge: 18, maxIncome: 1000000, caste: "SC" },
    { name: "MSME Loan Scheme", page: "entrepreneurs.html", category: "Entrepreneur", minAge: 18, maxIncome: 1000000, caste: "all" },
    { name: "Mudra Yojana", page: "entrepreneurs.html", category: "Entrepreneur", minAge: 18, maxIncome: 1000000, caste: "all" }

  ];

  const filtered = schemes.filter(s => {
    return (
      (!age || ageNum >= s.minAge) &&
      (!income || incomeNum <= s.maxIncome) &&
      (!beneficiary || s.category.toLowerCase() === beneficiary.toLowerCase() || s.category === "All") &&
      (!caste || s.caste === "all" || s.caste.toLowerCase() === caste.toLowerCase())
    );
  });

  res.json(filtered);
});
/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});