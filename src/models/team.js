const mongoose = require('mongoose');
const capitalize = require('../utils/capitalize');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        set: capitalize
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

teamSchema.virtual('soldiers', {
    ref: 'Soldier',
    localField: '_id',
    foreignField: 'team'
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;