require('dotenv').config();

const JWT_SECRET = 'abc';
const MONGOOSE_URI = process.env.MONGOOSE_URI;
const PORT = process.env.PORT || 4000;

module.exports = { JWT_SECRET, MONGOOSE_URI, PORT };
