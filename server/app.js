const express = require('express');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: path.join(__dirname, '../uploads/') });

let messages = [];
let sensitiveWords = ['badword'];

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: 'Too many requests, please try again later'
});

function filterContent(content) {
  for (const word of sensitiveWords) {
    if (content.includes(word)) return false;
  }
  return true;
}

app.post('/api/messages', limiter, upload.single('photo'), (req, res) => {
  const { nickname, content } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  if (!nickname || !content) return res.status(400).json({ error: 'Nickname and content are required' });
  if (content.length > 100) return res.status(400).json({ error: 'Content too long' });
  if (!filterContent(content)) return res.status(400).json({ error: 'Content contains sensitive words' });

  const message = {
    id: Date.now(),
    nickname,
    content,
    photo,
    createdAt: new Date(),
    approved: false
  };
  messages.push(message);
  res.json({ success: true });
});

app.post('/api/messages/:id/approve', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const msg = messages.find(m => m.id === id);
  if (!msg) return res.status(404).json({ error: 'Not found' });
  msg.approved = true;
  res.json({ success: true });
});

app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.use('/client', express.static(path.join(__dirname, '../client')));
app.use('/screen', express.static(path.join(__dirname, '../screen')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
