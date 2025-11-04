const express = require('express');
const router = new express.Router();
const Team = require('../models/team');
const Soldier = require('../models/soldier');

router.post('/team', async (req, res) => {
    const team = new Team(req.body);

    try {
        await team.save();
        res.status(201).send(team);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.get('/teams', async (req, res) => {
    try {
        const teams = await Team.find({});
        if (teams.length === 0) {
            return res.stauts(404).send('No teams in database');
        }
        res.send(teams);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/team/:id', async (req, res) => {
    const teamID = req.params.id;

    try {
        const team = await Team.findById(teamID);

        if (!team) {
            return res.status(404).send("This team doesn't exist in database.");
        }

        res.send(team);
    } catch (error) {
        res.status(500).send();
    }
});


router.patch('/team/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
        return res.status(400).send({error: 'invalid updates'});
    }

    try {
        const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (!team) {
            return res.status(404).send("Team doesn't exist in database.");
        }

        res.send(team);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.delete('/team/:id', async (req, res) => {
    try {
        const team = await Team.findByIdAndDelete(req.params.id);

        if (!team) {
            return res.status(404).send("Team doesn't exist in databse.");
        }

        const soldiers = await Soldier.find({team: req.params.id});
        for (let i = 0; i < soldiers.length; i++) {
            soldiers[i].team = undefined;
            if (soldiers[i].manager) {
                soldiers[i].manager = false;
            }
            await soldiers[i].save();
        }

        res.send(`${team}  All soldiers assosiated with this team, now have no team. What will they do !!!`);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;