const axios = require('axios');
const bcrypt = require('bcryptjs');
const db = require('../database/dbConfig.js');

const { authenticate, generateToken } = require('./middlewares');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {
  const creds = req.body;
  const hash = bcrypt.hashSync(creds.password, 10);
  creds.password = hash;
  db('users')
    .insert(creds)
    .then(ids => {
      const id = ids[0];
      const token = generateToken({ username: creds.username });
      res.status(201).json({ newUserId: id, token });
    })
    .catch(err => {
      res.status(500).json(err);
    });
}

function login(req, res) {
  const creds = req.body;
  db('users')
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        const token = generateToken({ username: user.username });
        res.status(200).json({ welcome: user.username, token });
      } else {
        res.status(401).json({ message: 'Username or Password is incorrect.' });
      }
    })
    .catch(err => {
      res.status(500).json(err);
    });
}

function getJokes(req, res) {
  axios
    .get('https://safe-falls-22549.herokuapp.com/random_ten')
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(err => {
      res.status(500).json(err);
    });
}
