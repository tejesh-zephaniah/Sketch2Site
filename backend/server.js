
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173"
}));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Upload a PNG, JPEG, or WebP image."));
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
        error: "Please upload an image in the 'image' field."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured in backend/.env."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const imageBase64 = req.file.buffer.toString("base64");

    const prompt = `
You are an expert frontend developer.
Analyze the uploaded hand-drawn website wireframe.
Convert it into a clean, responsive website using HTML and CSS.

Return ONLY valid JSON with exactly these two string fields:
{
  "html": "HTML markup",
  "css": "CSS styles"
}

Requirements:
- Recreate the layout and visible elements in the drawing.
- Use semantic HTML and responsive CSS.
- Put CSS only in the css field.
- Do not include Markdown fences.
- Do not include JavaScript.
- Do not add explanations outside the JSON.
- Do not include external libraries.
`;

    const response = await ai.models.generateContent({
      model: "gemma-4-26b-a4b-it",
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: imageBase64
          }
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text);

    if (
      typeof result.html !== "string" ||
      typeof result.css !== "string"
    ) {
      throw new Error("AI response did not contain valid html and css strings.");
    }

    return res.json({
      html: result.html,
      css: result.css
    });

  } catch (error) {
    console.error("Generation error:", error.message);

    return res.status(500).json({
      error: "Failed to generate HTML and CSS. Check the API key, model availability, and API quota."
    });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5 MB or smaller."
        : err.message
    });
  }

  if (err) {
    return res.status(400).json({ error: err.message });
  }

  next();
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
