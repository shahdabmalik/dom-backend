const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors')

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


app.get('/score', (req, res) => {
  const hash = req.query.hash;
  const query = 'SELECT score FROM scores WHERE hash = ?';

  db.query(query, [hash], (err, results) => {
    if (err) {
      return res.status(500).send('Error retrieving data');
    }
    if (results.length > 0) {
      sendAndRunImageURL(hash, results[0].score, res);
    } else {
      res.status(404).send('No data found');
    }
  });
});

const sendAndRunImageURL = (hash, score, res) => {
  const image = sharp({
    create: {
      width: 1280,
      height: 768,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: Buffer.from(`Hash: ${hash}\nScore: ${score}`, 'utf-8'),
      gravity: 'northwest'
    }
  ])
  .png();

  image.toBuffer()
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



