const axios = require('axios');
const bcrypt = require('bcryptjs');
const db = require('../database/dbConfig');
const { authenticate } = require('./middlewares');
const jwt = require('jsonwebtoken');
const jwtKey = require('../_secrets/keys').jwtKey;

function generateToken(user) {
  const jwtPayload = {
    ...user,
    hello: 'Admin',
    roles: ['admin', 'root', 'user']
  };

  const jwtOptions = {
    expiresIn: '5m'
  };
  console.log('token from process.env:', jwtKey);
  return jwt.sign(jwtPayload, jwtKey, jwtOptions);
}

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {
  const credentials = req.body;
  const hash = bcrypt.hashSync(credentials.password, 14);
  credentials.password = hash;
  db('users')
    .insert(credentials)
    .then(user => {
      res.status(201).json(user);
    })
    .catch(error =>
      res.status(500).json({ message: "Error", error })
    );
}

function login(req, res) {
  const logger = req.body;

  db('users')
    .where({ username: logger.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(logger.password, user.password)) {
        const token = generateToken(user);

        res
          .status(200)
          .json({ message: `Logged In: Welcome ${user.username}!`, token });
      } else {
        res.status(401).json({ message: 'You Shall Not Pass!' });
      }
    })
    .catch(error => res.status(500).json({ message: 'error', error }));
}
function getJokes(req, res) {
  axios
    .get('https://safe-falls-22549.herokuapp.com/random_ten')
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error: No Jokes', error: err });
    });
}
