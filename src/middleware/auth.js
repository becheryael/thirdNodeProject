const jwt = require('jsonwebtoken');
const Soldier = require('../models/soldier');
const { StatusCodes } = require('http-status-codes');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.SECRET);
        
        const soldier = await Soldier.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!soldier) {
            throw new Error;
        }
        
        req.token = token;
        req.soldier = soldier;
        
        next();
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).send({ error: 'please authenticate' });
    }
}

module.exports = auth;