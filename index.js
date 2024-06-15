const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const sharp = require('sharp');
const { createCanvas, loadImage, registerFont } = require('canvas');

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
        setTimeout(connectToDatabase, 2000);
      } else {
        console.error('Database connection failed:', err);
      }
    } else {
      console.log('Connected to database');
      setupRoutes(db);
    }
  });

  return db;
}

const db = connectToDatabase();

function setupRoutes(db) {
  app.post('/save-score', (req, res) => {
    const { game_id, score, currentLevel } = req.body;
    const query = 'INSERT INTO scores (game_id, score, level) VALUES (?, ?, ?)';

    db.query(query, [game_id, score, currentLevel], (err, result) => {
      if (err) {
        console.error('Error saving data:', err);
        return res.status(500).send('Error saving data');
      }
      res.status(200).send('Data saved successfully');
    });
  });

  const sendAndCreateImageUrl = (game_id, score, res) => {
    const fileName = 'map.png';
    const fontSize = 50;

    loadImage(fileName)
      .then(image => {
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // Draw the original image on the canvas
        ctx.drawImage(image, 0, 0, image.width, image.height);

        ctx.font = `bold ${fontSize}px Arial`;
        const text = `#DOME\nGAME-ID: ${game_id}\nScore: ${score}`;
        const textWidth = ctx.measureText(text).width;
        const textHeight = fontSize * 1.2 * 3;

        // Text coordinates
        const x = (image.width - textWidth) / 2;
        const y = (image.height - textHeight) / 2;

        // Background rectangle for text with opacity
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, textWidth, textHeight);

        // Text color and alignment
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Drawing the text
        ctx.fillText(text, image.width / 2, (image.height / 2) - 60);

        // Convert canvas to Buffer
        const buffer = canvas.toBuffer('image/png');

        res.set("Content-Type", "image/png");
        res.send(buffer);
      })
      .catch(err => {
        console.error('Error processing image:', err);
        res.status(500).send('Error processing image');
      }
    );
  };

  app.get('/score', (req, res) => {
      const game_id = req.query.game_id;
      const query = 'SELECT score FROM scores WHERE game_id = ?';

      db.query(query, [game_id], (err, results) => {
          if (err) {
              console.error('Error retrieving data:', err);
              return res.status(500).send('Error retrieving data');
          }
          if (results.length > 0) {
              sendAndCreateImageUrl(game_id, results[0].score, res);
          } else {
              res.status(404).send('No data found');
          }
      });
  });
}

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

app.get('/view-score', (req, res) => {
  const { game_id } = req.query;
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <!-- Twitter meta tags -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="Check out my game score!">
      <meta name="twitter:description" content="I scored high on DOME! See my score and try to beat it.">
      <meta name="twitter:image" content="https://dom-backend.onrender.com/score?game_id=${game_id}">
      <style>
        img: {
          width: 100%;
          height: 100vh;
          margin: 0;
        }
      </style>
      <title>DOME SOCRE</title>
    </head>
    <body>
      <h1>GAME ID: ${game_id}</h1>
      <img src="https://dom-backend.onrender.com/score?game_id=${game_id}" alt="Scored Image">
    </body>
    </html>
  `;
  res.send(htmlContent);
});

{/* <meta name="twitter:image" content="https://socialverse-assets.s3.amazonaws.com/GameMap.jpg"> */}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
