const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['https://ban-phuttachad.vercel.app','http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT']
}));

app.use(express.json({ limit: '10mb' }));

// Serve โฟลเดอร์ images
app.use('/images', express.static(path.join(__dirname, 'images')));

const routes = require('./routes/server');
app.use('/server', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express Serverless!' });
});

module.exports = app;
module.exports.handler = serverless(app);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
