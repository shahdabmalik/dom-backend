const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const Jimp = require("jimp");

const app = express();
const port = 3002;

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "https://dome.fun",
    "https://www.dome.fun"
  ],
  credentials: true
}));
app.use(bodyParser.json());

const MAX_RETRIES = 5;
let retries = 0;

function connectToDatabase() {
  const db = mysql.createConnection({
    host: 'bajyst8d3ii2pggur7nf-mysql.services.clever-cloud.com',
    user: 'u9vcahinm9sf2rwt',
    password: 'FH5dDAVbET5v6FxqzKhW',
    database: 'bajyst8d3ii2pggur7nf'
  });

  db.connect((err) => {
    if (err) {
      if (err.code === 'EAI_AGAIN' && retries < MAX_RETRIES) {
        retries++;
        console.log(`Retrying to connect... (${retries}/${MAX_RETRIES})`);
        setTimeout(connectToDatabase, 2000); // retry after 2 seconds
      } else {
        console.error('Database connection failed:', err);
      }
    } else {
      console.log('Connected to database');
      setupRoutes(db); // Setup routes after successful connection
    }
  });

  return db;
}

const db = connectToDatabase();

function setupRoutes(db) {
  app.post('/save-score', (req, res) => {
    const { hash, score, currentLevel } = req.body;
    const query = 'INSERT INTO scores (hash, score, level) VALUES (?, ?, ?)';

    db.query(query, [hash, score, currentLevel], (err, result) => {
      if (err) {
        console.error('Error saving data:', err);
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
        console.error('Error retrieving data:', err);
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
    const fileName = 'map.png';
    let loadedImage;

    Jimp.read(fileName)
      .then((image) => {
        loadedImage = image;
        return Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
      })
      .then((font) => {
        const text = `#DOME\nHash: ${hash}\nScore: ${score}`;
        const textWidth = Jimp.measureText(font, text);
        const textHeight = Jimp.measureTextHeight(font, text, loadedImage.bitmap.width);
        const x = (loadedImage.bitmap.width - textWidth) / 1;
        const y = (loadedImage.bitmap.height - textHeight) / 3.2;

        // Drawing the text multiple times to create a bold effect
        const offsets = [-1, 0, 1];
        offsets.forEach(offset => {
          loadedImage.print(font, x + offset, y, text);
          loadedImage.print(font, x, y + offset, text);
        });

        loadedImage.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
          if (err) {
            console.error('Error processing image:', err);
            return res.status(500).send('Error processing image');
          }
          res.set("Content-Type", Jimp.MIME_PNG);
          res.send(buffer);
        });
      })
      .catch((err) => {
        console.error('Error processing image:', err);
        res.status(500).send('Error processing image');
      });
  };
}

// Paginated GET API to retrieve top scores
app.get('/top-scores', (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let offset = (page - 1) * limit;

  const query = 'SELECT * FROM scores ORDER BY score DESC LIMIT ? OFFSET ?';

  db.query(query, [limit, offset], (err, results) => {
    if (err) {
      return res.status(500).send('Error retrieving data');
    }
    res.status(200).json({
      page: page,
      limit: limit,
      results: results
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
