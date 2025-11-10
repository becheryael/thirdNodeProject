const express = require('express');
const router = new express.Router();
const Soldier = require('../models/soldier');
const Team = require('../models/team');
const auth = require('../middleware/auth');
const { StatusCodes } = require('http-status-codes');

// Create a new soldier
router.post('', async (req, res) => {
    try {
        if (req.body.team) {
            const team = await Team.findOne({ name: req.body.team });
            if (!team) {
                return res.status(StatusCodes.BAD_REQUEST).send("Team doesn't exist in database. Make sure to create the team before associating a soldier with it.");
            }
            req.body.team = team._id;
        }
        const soldier = new Soldier(req.body);
        await soldier.save();
        res.status(StatusCodes.CREATED).send(soldier);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});


router.post('/login', async (req, res) => {
    try {
        const soldier = await Soldier.findByCredentials(req.body.personalNumber, req.body.password);
        const token = await soldier.generateAuthToken();
        res.send({ soldier, token });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

router.post('/logout', auth, async (req, res) => {
    try {
        req.soldier.tokens = req.soldier.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.soldier.save();

        res.send();
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

router.post('/logoutAll', auth, async (req, res) => {
    try {
        req.soldier.tokens = [];
        await req.soldier.save();
        res.send();
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

router.get('/me', auth, async (req, res) => {
    res.send(req.soldier);
});

// Update a soldier
router.patch('/:id', auth, async (req, res) => {

    if (!req.soldier.manager) {
        return res.status(StatusCodes.FORBIDDEN).send('You must be a manager to complete this action. You are just pathetic :{')
    }

    const soldierID = req.params.id;

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'city', 'team', 'manager'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
        return res.status(StatusCodes.BAD_REQUEST).send({ error: 'invalid updates' });
    }

    try {
        const soldier = await Soldier.findById(soldierID);
        
        if (!soldier) {
            return res.status(StatusCodes.NOT_FOUND).send('This soldier does not exist in database')
        }

        if (req.body.team) {
            const team = await Team.findOne({ name: req.body.team });
            if (!team) {
                return res.status(StatusCodes.BAD_REQUEST).send("Can not associate a soldier with a team that does not yet exist in databse.");
            }
            req.body.team = team._id;
        }

        updates.forEach((update) => soldier[update] = req.body[update]);

        await soldier.save();
        res.send(soldier);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

// Delete a soldier
router.delete('/:id', auth, async (req, res) => {
    if (!req.soldier.manager) {
        return res.status(StatusCodes.FORBIDDEN).send('You must be a manager to complete this action. You are just pathetic :{')
    }

    try {
        const soldier = await Soldier.findByIdAndDelete(req.params.id);
        if (!soldier) {
            return res.status(StatusCodes.NOT_FOUND).send("Soldier doesn't exist in database.");
        }

        res.send(soldier);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

// Get all the soldiers
router.get('', auth, async (req, res) => {
    try {
        const soldiers = await Soldier.find({});
        if (soldiers.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).send('No soldiers in database');
        }
        res.send(soldiers);

    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

//gets all soldiers name's that are not managers
router.get('/soldiersNames', auth, async (req, res) => {
    try {
        const soldiers = await Soldier.find({ manager: false }).sort({ name: 1 });
        if (soldiers.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).send("No soldiers in database");
        }
        let soldiersNames = [];
        for (i = 0; i < soldiers.length; i++) {
            soldiersNames.push(soldiers[i].name);
        }
        res.send(soldiersNames);

    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

// Get all the soldiers in a team
router.get('/team/:teamName', auth, async (req, res) => {
    try {
        const team = await Team.findOne({ name: req.params.teamName });
        
        if (!team) {
            return res.status(StatusCodes.BAD_REQUEST).send('This team does not exist in database.')
        }

        await team.populate('soldiers');
        const soldiers = team.soldiers;
        
        if (soldiers.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).send('There are no soldiers in this team.');
        }

        res.send(soldiers);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

// Get the team a soldier belongs to 
router.get('/:soldierID/team', auth, async (req, res) => {
    const soldierID = req.params.soldierID;

    try {
        const soldier = await Soldier.findById(soldierID);
        
        if (!soldier) {
            return res.status(StatusCodes.NOT_FOUND).send("This soldier does not exist.");
        }

        await soldier.populate('team');
        res.send(soldier.team);

    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});


//gets soldiers with service of less than a year
router.get('/youngSoldiers', auth, async (req, res) => {
    const PAGE_LIMIT = 5;
    const todaysDate = new Date();
    const lastYear = new Date(todaysDate);
    lastYear.setFullYear(todaysDate.getFullYear() - 1);
    
    try {
        const youngSoldiers = await Soldier.find({ draftDate: { $gte: lastYear} }).skip(parseInt(req.query.skip * PAGE_LIMIT)).limit(PAGE_LIMIT);
        
        if (!youngSoldiers) {
            return res.status(StatusCodes.NOT_FOUND).send("There are no young soldiers in the database. Everyone is very very old.");
        }

        res.send(youngSoldiers);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

//gets soldiers by length of servise
router.get('/soldiersServiceLength', auth, async (req, res) => {
 const sortBy = req.query.sortBy;
    
    if (!sortBy || (
        sortBy != '-1' &&
        sortBy != '1')) {
            return res.status(StatusCodes.BAD_REQUEST).send("Please provide a sorting order. Such as: -1, 1.");
    }

    try {
        const soldiers = await Soldier.find({}).sort({ draftDate: parseInt(sortBy) });

        if (!soldiers) {
            return res.status(StatusCodes.NOT_FOUND).send("There are no soldiers in the database.");
        }

        res.send(soldiers);

    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

// Get soldier by id
router.get('/:id', auth, async (req, res) => {
    const soldierID = req.params.id;

    try {
        const soldier = await Soldier.findById(soldierID)
        
        if (!soldier) {
            return res.status(StatusCodes.NOT_FOUND).send("This soldier doesn't exist in database");
        }

        res.send(soldier);

    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

module.exports = router;