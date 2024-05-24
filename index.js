const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors')
const sharp = require('sharp');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "https://dome.fun",
    "https://www.dome.fun"],
  credentials: true
}));
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'bajyst8d3ii2pggur7nf-mysql.services.clever-cloud.com',
  user: 'u9vcahinm9sf2rwt',
  password: 'FH5dDAVbET5v6FxqzKhW',
  database: 'bajyst8d3ii2pggur7nf'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to database');
});

app.post('/save-score', (req, res) => {
  const { hash, score } = req.body;
  const query = 'INSERT INTO scores (hash, score) VALUES (?, ?)';

  db.query(query, [hash, score], (err, result) => {
    if (err) {
      return res.status(500).send('Error saving data');
    }
    res.status(200).send('Data saved successfully');
  });
});

app.get('/score', (req, res) => {
  const hash = req.query.hash;
  const query = 'SELECT score FROM scores WHERE hash = ?';

  db.query(query, [hash], (err, results) => {
    if (err) {
      return res.status(500).send('Error retrieving data');
    }
    if (results.length > 0) {
      sendAndCreateImageUrl(hash, results[0].score, res);
    } else {
      res.status(404).send('No data found');
    }
  });
});

const sendAndCreateImageUrl = (hash, score, res) => {
  const imagePath = path.join(__dirname, 'map.png');
  const svgText = `
    <svg width="800" height="200">
      <text x="10" y="20" font-size="20" fill="black">Hash: ${hash}</text>
      <text x="10" y="50" font-size="20" fill="black">Score: ${score}</text>
    </svg>
  `;

  sharp(imagePath)
    .composite([
      { input: Buffer.from(svgText), top: 0, left: 0 }
    ])
    .toBuffer()
    .then(buffer => {
      res.type('png').send(buffer);
    })
    .catch(err => {
      console.error('Error processing image', err);
      res.status(500).send('Error processing image');
    });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});



