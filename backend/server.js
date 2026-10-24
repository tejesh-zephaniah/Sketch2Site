
const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Please upload an image file."));
    }
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Hack_da_decipher backend is running!" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.post("/api/generate", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload an image using the 'image' field."
      });
    }

    // TODO: Pass req.file.buffer to the drawing-to-code generator.
    // Replace these placeholders with the generated result.
    const html = "<div>Hello World</div>";
    const css = "div { color: blue; }";

    return res.json({ html, css });
  } catch (error) {
    console.error("Generation error:", error);

    return res.status(500).json({
      error: "Failed to generate HTML and CSS."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
