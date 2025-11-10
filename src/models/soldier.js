const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const capitalize = require('../utils/capitalize');

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
        unique: true,
        required: true,
        validate(value) {
            if (value.toString().length < 7) {
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
        ref: 'Team'
    },
    manager: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true,
        minLength: 7,
        trim: true,
        validate(value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "Password".');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

soldierSchema.pre('save', async function (next) {
    const soldier = this;
    if (soldier.isModified('manager')) {
        if (!soldier.team && soldier.manager) {
            throw new Error ("You can't be a manager if you don't have a team because you will be lonely :((");
        }
        const prevManager = await Soldier.findOne({ team: soldier.team, manager: true });
        if (prevManager && soldier.manager) {
            throw new Error("A manager for this team already exist. You must get RID of them first. (in any way)");
        }
    }

    next();
});


soldierSchema.methods.toJSON = function () {
    const soldier = this;
    const soldierObject = soldier.toObject();

    delete soldierObject.password;
    delete soldierObject.tokens;

    return soldierObject;
}

soldierSchema.pre('save', async function (next) {
    const soldier = this;
    if (soldier.isModified('password')) {
        soldier.password = await bcrypt.hash(soldier.password, 8);
    }

    next();
});

soldierSchema.methods.generateAuthToken = async function () {
    const soldier = this;
    const token = jwt.sign({ _id: soldier._id.toString() }, process.env.SECRET);
    soldier.tokens = soldier.tokens.concat({ token });
    await soldier.save();

    return token;
}

soldierSchema.statics.findByCredentials = async (personalNumber, password) => {
    const soldier = await Soldier.findOne({ personalNumber });

    if (!soldier) {
        throw new Error ('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, soldier.password);

    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return soldier;
}

const Soldier = mongoose.model('Soldier', soldierSchema);

module.exports = Soldier;