import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import PDFDocument from 'pdfkit';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT    = process.env.PORT     || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ======================
// ENV CHECKS
// ======================

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.warn("⚠️  MAIL_USER / MAIL_PASS not set – OTP emails will fail");
}

// ======================
// MONGODB CONNECTION
// ======================

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => console.log(`🚀 API server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ======================
// NODEMAILER TRANSPORTER
// ======================

const transporter = nodemailer.createTransport({
  service: "gmail",              // Change to "outlook" / "yahoo" / custom SMTP as needed
  auth: {
    user: process.env.MAIL_USER, // your-email@gmail.com
    pass: process.env.MAIL_PASS, // Gmail App Password (NOT your login password)
  },
});

// ======================
// SCHEMAS
// ======================

// ── User ──────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    email:       { type: String, unique: true, sparse: true },
    password:    { type: String, required: true },
    factoryName: String,
    role:        String,
    contact:     { type: String, unique: true, sparse: true },
  },
  { collection: "User" }
);
const User = mongoose.model("User", userSchema);

// ── Login Event ────────────────────────────────────────────────────────────
const loginSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email:     String,
    contact:   String,
    success:   Boolean,
    timestamp: { type: Date, default: Date.now },
    ip:        String,
    userAgent: String,
  },
  { collection: "Login User" }
);
const LoginEvent = mongoose.model("LoginEvent", loginSchema);

// ── OTP Record ────────────────────────────────────────────────────────────
//   Stores one pending OTP per email.  TTL index auto-deletes after 10 min.
const otpSchema = new mongoose.Schema(
  {
    email:      { type: String, required: true, index: true },
    otp:        { type: String, required: true },       // hashed
    resetToken: { type: String },                       // issued after verification
    createdAt:  { type: Date, default: Date.now, expires: 600 }, // 10-min TTL
  },
  { collection: "OtpRecords" }
);
const OtpRecord = mongoose.model("OtpRecord", otpSchema);

// ======================
// HELPERS
// ======================

const getIp = (req) =>
  req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;

/** Generate a random 6-digit OTP string */
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/** Send the OTP email */
const sendOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from:    `"FactoryPulse AI" <${process.env.MAIL_USER}>`,
    to:      toEmail,
    subject: "Your Password Reset OTP",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:30px;
                  border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#3b82f6;margin-bottom:8px;">FactoryPulse AI – Password Reset</h2>
        <p style="color:#374151;">Use the OTP below to reset your password.
           It expires in <strong>10 minutes</strong>.</p>
        <div style="margin:28px 0;text-align:center;">
          <span style="display:inline-block;letter-spacing:12px;font-size:38px;
                       font-weight:800;color:#111827;background:#f3f4f6;
                       padding:16px 28px;border-radius:10px;font-family:monospace;">
            ${otp}
          </span>
        </div>
        <p style="color:#6b7280;font-size:13px;">
          If you did not request this, please ignore this email.
        </p>
      </div>
    `,
  });
};

// ======================
// ROUTES
// ======================

// ── EMAIL REPORT (PDF attachment) ─────────────────────────────────────────
app.post("/api/email-report", async (req, res) => {
  try {
    const { email, pdfBase64, filename } = req.body;

    if (!email || !pdfBase64) {
      return res.status(400).json({ message: "Email and PDF data are required" });
    }

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    await transporter.sendMail({
      from: `"FactoryPulse AI" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your FactoryPulse Manufacturing Report",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:30px;
                    border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#3b82f6;margin-bottom:8px;">FactoryPulse AI — Report Ready</h2>
          <p style="color:#374151;">Your manufacturing report has been auto-generated after your latest dataset upload.</p>
          <p style="color:#374151;margin-top:12px;">Please find your PDF report attached to this email.</p>
          <p style="color:#6b7280;font-size:13px;margin-top:24px;">
            Generated: ${new Date().toLocaleString()}<br/>
            File: ${filename || "manufacturing-report.pdf"}
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
          <p style="color:#9ca3af;font-size:11px;">This report was automatically triggered by a CSV upload in your FactoryPulse dashboard.</p>
        </div>
      `,
      attachments: [
        {
          filename: filename || "manufacturing-report.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log(`📄 Report PDF emailed to ${email}`);
    return res.json({ message: "Report sent successfully" });
  } catch (err) {
    console.error("❌ Email Report Error:", err);
    return res.status(500).json({ message: "Failed to send report email" });
  }
});
// ── REGISTER ──────────────────────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  try {
    console.log("📥 Register Body:", req.body);

    const { name, email, password, factoryName, role, contact } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { contact }] });
    if (existingUser) {
      return res.status(409).json({ message: "Email or contact already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, factoryName, role, contact });
    await user.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: { name: user.name, email: user.email, factoryName: user.factoryName, role: user.role, contact: user.contact },
    });
  } catch (err) {
    console.error("❌ Register Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ── LOGIN ──────────────────────────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  try {
    console.log("📥 Login Body:", req.body);

    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const query = email ? { email: email.trim() } : { contact: phone.trim() };
    const user  = await User.findOne(query);
    const clientIp  = getIp(req);
    const userAgent = req.headers["user-agent"] || "";

    if (!user) {
      await LoginEvent.create({ email: email || null, contact: phone || null, success: false, ip: clientIp, userAgent });
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await LoginEvent.create({ userId: user._id, email: user.email, contact: user.contact, success: false, ip: clientIp, userAgent });
      return res.status(401).json({ message: "Incorrect password" });
    }

    await LoginEvent.create({ userId: user._id, email: user.email, contact: user.contact, success: true, ip: clientIp, userAgent });

    return res.json({
      message: "Login successful",
      user: { name: user.name, email: user.email, factoryName: user.factoryName, role: user.role, contact: user.contact },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ── FORGOT PASSWORD – Generate & Email OTP ────────────────────────────────
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Always respond the same to prevent user-enumeration attacks,
    // but only send the email if the account actually exists.
    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      // Return 200 so attackers can't probe for valid emails
      return res.json({ message: "If this email is registered, an OTP has been sent." });
    }

    // Delete any existing OTP for this email
    await OtpRecord.deleteMany({ email: email.trim() });

    // Generate OTP and hash it before storage
    const otp       = generateOtp();
    const otpHash   = await bcrypt.hash(otp, 8);

    await OtpRecord.create({ email: email.trim(), otp: otpHash });

    // Send email
    await sendOtpEmail(email.trim(), otp);

    console.log(`📧 OTP sent to ${email}`);
    return res.json({ message: "If this email is registered, an OTP has been sent." });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    return res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
});

// ── VERIFY OTP ────────────────────────────────────────────────────────────
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const record = await OtpRecord.findOne({ email: email.trim() });
    if (!record) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp.trim(), record.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // OTP is correct – generate a short-lived reset token and store it
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash  = await bcrypt.hash(resetToken, 8);

    await OtpRecord.updateOne(
      { _id: record._id },
      { $set: { resetToken: tokenHash, otp: "used" } } // invalidate OTP
    );

    return res.json({ message: "OTP verified", resetToken });
  } catch (err) {
    console.error("❌ Verify OTP Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ── RESET PASSWORD ────────────────────────────────────────────────────────
app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const record = await OtpRecord.findOne({ email: email.trim() });
    if (!record || !record.resetToken) {
      return res.status(400).json({ message: "Session expired. Please start over." });
    }

    const tokenMatch = await bcrypt.compare(resetToken, record.resetToken);
    if (!tokenMatch) {
      return res.status(400).json({ message: "Invalid reset token. Please start over." });
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateResult   = await User.updateOne(
      { email: email.trim() },
      { $set: { password: hashedPassword } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the OTP record so the token can't be reused
    await OtpRecord.deleteMany({ email: email.trim() });

    console.log(`✅ Password reset for ${email}`);
    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
