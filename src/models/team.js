const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
});

teamSchema.virtual('soldier', {
    ref: 'Soldier',
    localField: '_id',
    foreignField: 'team'
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;