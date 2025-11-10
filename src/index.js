const express = require('express');
require("dotenv").config();
require('./db/mongoose');
const soldierRouter = require('./routers/soldierRouter');
const teamRouter = require('./routers/teamRouter');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());
app.use('/soldiers', soldierRouter);
app.use('/teams', teamRouter);
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Server is up on port ' + process.env.PORT);
});
