const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('Express:', typeof express);
console.log('bcrypt:', typeof bcrypt);
console.log('jwt:', typeof jwt);

const router = express.Router();
console.log('Router:', typeof router);

module.exports = router;
