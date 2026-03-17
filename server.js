const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'billions_massive_data.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve frontend files from 'public' folder

// Global data array
let aiData = [];

// Helper: Read data into memory
function loadData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    aiData = JSON.parse(data);
    console.log(`Loaded ${aiData.length} records into memory.`);
  } catch (err) {
    console.error('Error reading data file', err);
    aiData = [];
  }
}

// Load data on startup
loadData();

// Helper: Save data
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(aiData, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving data file', err);
    return false;
  }
}

// Basic Intelligence Search Route
app.post('/api/chat', (req, res) => {
  const userText = (req.body.question || '').toLowerCase().trim();
  if (!userText) {
    return res.json({ answer: "Sorry, I didn't understand your question. Can you clarify?" });
  }

  const words = userText.split(/\s+/);
  
  let bestMatch = null;
  let maxScore = 0;

  // Simple keyword matching against the question field
  aiData.forEach(item => {
    let score = 0;
    const questionText = (item.question || '');
    
    words.forEach(word => {
        if(questionText.includes(word)) {
            score++;
        }
    });

    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  });

  if (bestMatch && maxScore > 0) {
    res.json({ answer: bestMatch.answer });
  } else {
    // Save unanswered question? (Bonus logic for admin panel later)
    res.json({ answer: "I couldn't find an exact match for your question. Try asking something else about Billions Network." });
  }
});

// Admin Panel endpoints
app.get('/api/admin/qa', (req, res) => {
  res.json(aiData);
});

app.post('/api/admin/qa', (req, res) => {
  const newItem = req.body;
  newItem.id = Date.now(); // Simple ID generation
  aiData.push(newItem);
  if (saveData()) {
    res.json({ success: true, item: newItem });
  } else {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.delete('/api/admin/qa/:id', (req, res) => {
  const id = parseInt(req.params.id);
  aiData = aiData.filter(item => item.id !== id);
  if (saveData()) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
