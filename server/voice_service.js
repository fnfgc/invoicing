const fs = require('fs');
const path = require('path');

// Configure multer for audio upload (Lazy Load / Optional)
let upload;
try {
  const multer = require('multer');
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  upload = multer({ storage: storage });
} catch (e) {
  console.warn("Multer module not found. Voice uploads will be disabled.");
  // Mock upload middleware to prevent crash
  upload = {
    single: () => (req, res, next) => {
      console.warn("Voice upload attempted but multer is missing.");
      res.status(500).json({ error: "Server missing dependency: multer. Please run 'npm install multer'." });
    }
  };
}

/**
 * Get OpenAI client instance (Lazy Load)
 */
function getClient(apiKey) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key || key === 'sk-proj-placeholder') {
        throw new Error("OpenAI API Key is missing. Please add it in Settings.");
    }
    
    try {
        const OpenAI = require('openai');
        return new OpenAI({ apiKey: key });
    } catch (e) {
        console.error("OpenAI module not found. Please run 'npm install openai'");
        throw new Error("OpenAI module is not installed on the server.");
    }
}

/**
 * Transcribe audio using Whisper
 */
async function transcribeAudio(filePath, apiKey) {
  try {
    const openai = getClient(apiKey);
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "ur", // Hint for Urdu/Hindi/Punjabi mixed
      prompt: "The audio is a shopkeeper listing items in Urdu/English/Punjabi. E.g., '2 bread, 1 milk, 3 anday'. Transcribe exactly what is said.",
    });
    return transcription.text;
  } catch (error) {
    console.error("Whisper Error:", error);
    throw error; // Re-throw to handle in route
  }
}

/**
 * Parse text using LLM to extract intent
 */
async function parseIntent(text, apiKey) {
  try {
    const openai = getClient(apiKey);
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a POS assistant for a grocery store. 
          Extract items and quantities from the text.
          The text may be in English, Urdu, Punjabi, or Roman Urdu.
          Return ONLY a JSON array of objects with 'product' (string) and 'quantity' (number).
          Default quantity is 1 if not specified.
          Example: "do bread aur teen anday" -> [{"product": "bread", "quantity": 2}, {"product": "anday", "quantity": 3}]`
        },
        { role: "user", content: text }
      ],
      model: "gpt-3.5-turbo", // Cost-effective model
      response_format: { type: "json_object" },
    });
    
    const content = completion.choices[0].message.content;
    const result = JSON.parse(content);
    return result.items || result; // Handle potential wrapper object
  } catch (error) {
    console.error("LLM Error:", error);
    // Fallback: simple regex parser if LLM fails or no key
    return fallbackParser(text);
  }
}

/**
 * Fallback parser for basic "number product" pattern
 */
function fallbackParser(text) {
  const items = [];
  // Basic regex for "2 bread", "3 eggs", etc.
  const regex = /(\d+)\s+([a-zA-Z\s]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    items.push({
      quantity: parseInt(match[1]),
      product: match[2].trim()
    });
  }
  return items;
}

module.exports = {
  upload,
  transcribeAudio,
  parseIntent
};
