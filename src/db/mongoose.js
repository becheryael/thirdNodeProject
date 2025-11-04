const mongoose = require('mongoose');
const uri = process.env.CONNECTION_STR;

mongoose.connect(uri);