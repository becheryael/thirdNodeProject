const express = require('express');
require("dotenv").config();
require('./db/mongoose');
const soldierRouter = require('./routers/soldierRouter');
const teamRouter = require('./routers/teamRouter');

const app = express();

app.use(express.json());
app.use(soldierRouter);
app.use(teamRouter);

app.listen(process.env.PORT, () => {
    console.log('Server is up on port ' + process.env.PORT);
});
