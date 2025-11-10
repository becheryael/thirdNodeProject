const express = require('express');
const router = new express.Router();
const Team = require('../models/team');
const Soldier = require('../models/soldier');
const auth = require('../middleware/auth');
const { StatusCodes } = require('http-status-codes');

router.post('', auth, async (req, res) => {
    if (!req.soldier.manager) {
        return res.status(StatusCodes.FORBIDDEN).send('You must be a manager to complete this action. You are just pathetic :{')
    }

    const team = new Team(req.body);

    try {
        await team.save();
        res.status(StatusCodes.CREATED).send(team);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

router.get('', auth, async (req, res) => {
    try {
        const teams = await Team.find({});
        if (teams.length === 0) {
            return res.stauts(StatusCodes.NOT_FOUND).send('No teams in database');
        }
        res.send(teams);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

router.patch('/:id', auth, async (req, res) => {
    if (!req.soldier.manager) {
        return res.status(StatusCodes.FORBIDDEN).send('You must be a manager to complete this action. You are just pathetic :{')
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
        return res.status(StatusCodes.BAD_REQUEST).send({ error: 'invalid updates' });
    }

    try {
        const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (!team) {
            return res.status(StatusCodes.NOT_FOUND).send("Team doesn't exist in database.");
        }

        res.send(team);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

router.delete('/:id', auth, async (req, res) => {
    if (!req.soldier.manager) {
        return res.status(StatusCodes.FORBIDDEN).send('You must be a manager to complete this action. You are just pathetic :{')
    }

    try {
        const team = await Team.findByIdAndDelete(req.params.id);

        if (!team) {
            return res.status(StatusCodes.NOT_FOUND).send("Team doesn't exist in database.");
        }

        const soldiers = await Soldier.find({ team: req.params.id });
        for (const soldier of soldiers) {
            soldier.team = undefined;
            if (soldier.manager) {
                soldier.manager = false;
            }
            await soldier.save();
        }

        res.send(`${team}  All soldiers associated with this team, now have no team. What will they do !!!`);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

// Get number of team members in a team
router.get('/:teamName/numOfTeamMembers', auth, async (req, res) => {
        const teamName = req.params.teamName
    try {
        const team = await Team.findOne({ name: teamName });

        if (!team) {
            return res.status(StatusCodes.NOT_FOUND).send('This team does not exist in database.');
        }

        await team.populate('soldiers');
        const numOfTeamMembers = team.soldiers.length;
        res.send(numOfTeamMembers);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

// gets the team manager of a team
router.get('/teamManager/:id', auth, async (req, res) => {
     
    const teamID = req.params.id
    try {
        const teamManager = await Soldier.findOne({ team: teamID, manager: true });
        
        if (!teamManager) {
            return res.status(StatusCodes.NOT_FOUND).send("This team does not currently have a manager. Maybe you can be the new manager! :o");
        }

        res.send(teamManager);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

//gets managers by number of soldiers
router.get('/managersByNumSoldiers', auth, async (req, res) => {
    const sortBy = req.query.sortBy;
    
    if (!sortBy || (
        sortBy != '-1' &&
        sortBy != '1')) {
            return res.status(StatusCodes.BAD_REQUEST).send("Please provide a sorting order. Such as: -1, 1.");
    }

    try {
        const teamsBysoldiersNum = await Team.aggregate([
            {
                $lookup: {
                    from: "soldiers", 
                    localField: "_id", 
                    foreignField: "team", 
                    as: "soldiers"
                }
            }, {
                $addFields: {
                    numOfSoldiers: { $size: '$soldiers' }
                }
            }, { 
                $sort: { 
                    numOfSoldiers: parseInt(sortBy)
                } 
        }]);

        if (teamsBysoldiersNum.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).send('No teams in database');
        }

        let managersArray = [];

        for (i = 0; i < teamsBysoldiersNum.length; i++) {
            for (j = 0; j < teamsBysoldiersNum[i].numOfSoldiers; j++) {
               const soldier = teamsBysoldiersNum[i].soldiers[j];
               if (soldier.manager) {
                    managersArray.push(soldier);
               }
            }
        }
        
        res.send(managersArray);

    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

router.get('/:id', auth, async (req, res) => {
    const teamID = req.params.id;

    try {
        const team = await Team.findById(teamID);

        if (!team) {
            return res.status(StatusCodes.NOT_FOUND).send("This team doesn't exist in database.");
        }

        res.send(team);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
});

module.exports = router;