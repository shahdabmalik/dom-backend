const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors')
// const sharp = require('sharp');
const path = require('path');
var Jimp = require("jimp");


const app = express();
const port = process.env.PORT || 3000;

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
  const fileName = 'map.png';
  let loadedImage;

  Jimp.read(fileName)
    .then((image) => {
      loadedImage = image;
      return Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // Use a larger font
    })
    .then((font) => {
      const text = `                  #DOME   \nHash: ${hash}\nScore: ${score}`;
      const textWidth = Jimp.measureText(font, text);
      const textHeight = Jimp.measureTextHeight(font, text, loadedImage.bitmap.width);
      const x = (loadedImage.bitmap.width - textWidth) / 2; // Centering the text horizontally
      const y = (loadedImage.bitmap.height - textHeight) / 1.5; // Centering the text vertically
      loadedImage.print(font, x, y, text).getBuffer(Jimp.MIME_PNG, (err, buffer) => {
        if (err) {
          throw new Error(err.message);
        }
        res.set("Content-Type", Jimp.MIME_PNG);
        res.send(buffer);
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error processing image');
    });
};


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});



