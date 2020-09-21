const express = require('express');
const route = express.Router();
import { GlobalState } from '@game3js/common';


/*
* method: GET
* access: PUBLIC 
* desc: retrieves all tournaments from db
*/
route.get('/getall', async (req, res) => {
  const result = await GlobalState.ServerState.dbManager
    .getTournaments();
  
  res.json(result)
});


/*
* method: GET
* access: PUBLIC 
* desc: retrieves single tournament from db
*/
route.get('/getone', async (req, res) => {
  const tournamentId = req.query.tournamentId;

  console.log("TOURNAMENT ID", tournamentId);
  const result = await GlobalState.ServerState.dbManager.getTournament(tournamentId);
  
  res.json(result);
});


/*
* method: GET
* access: PUBLIC 
* desc: fetch the winners of a single tournament
*/
route.patch('/winners', async (req, res) => {
  const tournamentId = req.query.tournamentId;

  const result = await GlobalState.ServerState.dbManager.getTourneyWinners(tournamentId);
  res.json(result);
});


/*
* method: PATCH
* access: LOGGED IN ONLY 
* desc: updates single tournament from db
*/
route.patch('/update', async (req, res) => {
  const tournamentId = req.body.tournamentId;
  const updatedData = req.body.updatedData;

  console.log("SERVER UPDATE TOURNAMENT: TournamentID: ", tournamentId);
  console.log("SERVER UPDATE TOURNAMENT: UpdatedData: ", updatedData);

  const result = await GlobalState.ServerState.dbManager.updateTournament(tournamentId, updatedData);
  res.json(result);
});


/*
* method: POST
* access: LOGGED IN ONLY 
* desc: create new tournament
*/
route.post('/new', async (req, res) => {
  const tournament = req.body.tournament;

  const result = await GlobalState.ServerState.dbManager
    .newTournament(tournament);

  res.json(result)
});

module.exports = route;