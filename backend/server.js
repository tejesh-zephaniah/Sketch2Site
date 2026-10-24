
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
  limits: { fileSize: 10 * 1024 * 1024, files: 6 },
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

app.post(
  "/api/generate",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "image", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const images = req.files?.images?.length
        ? req.files.images
        : req.files?.image || [];

      if (!images.length) {
        return res.status(400).json({
          error: "Please upload at least one image in the 'images' or 'image' field."
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

      const prompt = `
You are an expert frontend developer.
Treat all uploaded hand-drawn references as wireframes for the content, layout, and relationships. Combine them into ONE cohesive, polished, responsive website. Treat different page-like sketches as views of that same website, with connected navigation. Do not create separate HTML documents or websites.

Return ONLY valid JSON with exactly these two string fields:
{
  "html": "HTML markup",
  "css": "CSS styles"
}

Requirements:
- Preserve the intended content, hierarchy, and important layout ideas, but do not copy the sketch's rough appearance.
- Interpret handwritten labels as text content; render them with clear, professional web typography, not handwriting-style fonts.
- Transform monochrome sketches into a finished, visually appealing website with a thoughtful color palette, strong contrast, polished spacing, and subtle styling. Use black and white only when clearly appropriate to the design.
- Use a consistent, professional font stack and responsive visual hierarchy.
- Make navigation links such as Home, About, Info, and Menu switch to distinct page-like views within the same HTML document and browser tab, rather than merely scrolling to sections or opening new tabs.
- Use small inline JavaScript in the html field for client-side view switching, keeping every view in this single document and supporting browser back/forward navigation.
- Use semantic HTML and responsive CSS.
- Put CSS only in the css field.
- Do not include Markdown fences.
- Do not add explanations outside the JSON.
- Do not include external libraries.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [
          { text: prompt },
          ...images.map((image) => ({
            inlineData: {
              mimeType: image.mimetype,
              data: image.buffer.toString("base64")
            }
          }))
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text);

      if (
        typeof result.html !== "string" ||
        !result.html.trim() ||
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
  }
);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: err.code === "LIMIT_FILE_SIZE"
        ? "Each image must be 10 MB or smaller."
        : err.code === "LIMIT_FILE_COUNT" ||
            err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Upload no more than 5 images."
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
