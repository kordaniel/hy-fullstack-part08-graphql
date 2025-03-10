require('dotenv').config();

const MONGOOSE_URI = process.env.MONGOOSE_URI;
const PORT = process.env.PORT || 4000;

module.exports = { MONGOOSE_URI, PORT };
