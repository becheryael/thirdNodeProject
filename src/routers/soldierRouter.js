const express = require('express');
const router = new express.Router();
const Soldier = require('../models/soldier');
const Team = require('../models/team');

// Create a new soldier
router.post('/soldier', async (req, res) => {
    try {
        if (req.body.team) {
            const team = await Team.findOne({ name: req.body.team });
            if (!team) {
                return res.status(404).send("Team doesn't exist in database. Make sure to create the team before assositing a soldier with it.");
            }
            req.body.team = team._id;
        }
        const soldier = new Soldier(req.body);
        await soldier.save();
        res.status(201).send(soldier);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Update a soldier
router.patch('/soldiers/:id', async (req, res) => {
    const soldierID = req.params.id;

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'city', 'team', 'manager'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
        return res.status(400).send({error: 'invalid updates'});
    }

    try {
        const soldier = await Soldier.findById(soldierID);
        
        if (req.body.team) {
            const team = await Team.findOne({ name: req.body.team });
            if (!team) {
                return res.status(404).send("Can not assosiate a soldier with a team that does not yet exist in databse.");
            }
            req.body.team = team._id;
        }

        updates.forEach((update) => soldier[update] = req.body[update]);

        await soldier.save();
        res.send(soldier);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Delete a soldier
router.delete('/soldier/:id', async (req, res) => {
    try {
        const soldier = await Soldier.findByIdAndDelete(req.params.id);
        if (!soldier) {
            return res.status(404).send("Soldier doesn't exist in database.");
        }

        res.status(200).send(soldier);
    } catch (error) {
        res.status(500).send();
    }
});

// Get all the soldiers
router.get('/soldiers', async (req, res) => {
    try {
        const soldiers = await Soldier.find({});
        if (soldiers.length === 0) {
            return res.status(404).send('No soldiers in database');
        }
        res.send(soldiers);

    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get soldier by id
router.get('/soldier/:id', async (req, res) => {
    const soldierID = req.params.id;

    try {
        const soldier = await Soldier.findById(soldierID)
        if (!soldier) {
            return res.status(404).send("This soldier doesn't exist in database");
        }
        res.send(soldier);

    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get all the soldiers in a team
router.get('/teamSoldiers/:team', async (req, res) => {
    try {
        const team = await Team.find({ name: req.params.team });
        const soldiers = await Soldier.find({ team });
        if (soldiers.length === 0 ) {
            return res.send('No soldiers in this team');
        }
        res.send(soldiers);

    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get the team a soldier belongs to 
router.get('/soldiersTeam/:soldierID', async (req, res) => {
    const soldierID = req.params.soldierID;

    try {
        const solider = await Soldier.findById(soldierID);
        const soldiersTeam = await Team.findById(solider.team);
        res.send(soldiersTeam);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get number of team members in a team
router.get('/numOfTeamMembers/:teamName', async (req, res) => {
        const teamName = req.params.teamName
    try {
        const teamID = await Team.find({name: teamName})._id;
        const teamMemebers = await Soldier.find({team: teamID});
        const numOfTeamMembers = teamMemebers.length;
        res.status(200).send(`The number of members in team ${teamName} is ${numOfTeamMembers}`)
    } catch (error) {
        res.status(500).send();
    }
});

// gets the team manager of a tea,
router.get('/teamManager/:id', async (req, res) => {
     
    const teamID = req.params.id
    try {
        const teamManager = await Soldier.find({ team: teamID, manager: true });
        if (teamManager.length === 0) {
            return res.send("This team does not currently have a manager. Maybe you can be the new manager! :o");
        }

        res.status(200).send(teamManager);

    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;