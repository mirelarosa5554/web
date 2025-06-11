const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const fs = require("fs");
const cors = require("cors");

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 3000;

app.use(cors()); // <-- Important for frontend-backend communication
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/send-single", upload.single("attachment"), async (req, res) => {
  const {
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    subject,
    sendAs,
    toEmail,
    textContent,
    htmlTemplate,
  } = req.body;

  const attachment = req.file;

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    let mailOptions = {
      from: smtpUser,
      to: toEmail,
      subject: subject,
      ...(sendAs === "text" ? { text: textContent } : { html: htmlTemplate })
    };

    if (attachment) {
      mailOptions.attachments = [
        {
          filename: attachment.originalname,
          path: attachment.path,
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    if (attachment) {
      fs.unlink(attachment.path, err => {
        if (err) console.error("Failed to delete file:", err);
      });
    }

    res.json({ success: true });
  } catch (error) {
    if (attachment) {
      fs.unlink(attachment.path, err => {
        if (err) console.error("Failed to delete file:", err);
      });
    }
    res.json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
