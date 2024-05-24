const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Create a MySQL connection
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

// Endpoint to save score and hash
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
