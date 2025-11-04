const mongoose = require('mongoose');

const capitalize = (string) => {
    const words = string.split(' ');
    const capitalizedString = words.map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
    return capitalizedString;
}

const soldierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        set: capitalize
    },
    age: {
        type: Number,
        trim: true,
        validate(value) {
            if (value < 18) {
                throw new Error('Soldiers must be adults.');
            }
        }
    }, 
    personalNumber: {
        type: Number,
        trim: true,
        unique: true,
        required: true,
        validate(value) {
            if (value < 1000000) {
                throw new Error('Personal number needs 7 digits.');
            }
        }
    },
    city: {
        type: String,
        trim: true,
        set: capitalize
    },
    draftDate: {
        type: Date,
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
    },
    manager: {
        type: Boolean,
        default: false
    }
});

soldierSchema.pre('save', async function (next) {
    const soldier = this;
    if (soldier.isModified('manager')) {
        const prevManager = await Soldier.findOne({ team: soldier.team, manager: true });
        if (prevManager) {
            throw new Error("A manager for this team already exist. You must get RID of them first. (in any way)");
        }
        if (!soldier.team && soldier.manager) {
            throw new Error ("You can't be a manager if you don't have a team because you will be lonely :((")
        }
    }

    next();
});

const Soldier = mongoose.model('soldier', soldierSchema);

module.exports = Soldier;