var express = require('express');
var fs = require('fs');
var router = express.Router();
var leagueFilePath = 'en.1.json';

/* GET standings. */
router.get('/', function(req, res, next) {
  var teamStandings = [];
  var matchData = JSON.parse(fs.readFileSync(leagueFilePath));
  buildTeamStandings(matchData, teamStandings);
  rankTeams(teamStandings);
  res.render('index', { title: 'English Premier League Table Viewer', teamStandings: teamStandings });
});

module.exports = router;

function upsertTeamData(arr, obj){
  const index = arr.findIndex((e) => e.team.key === obj.team.key);

  if (index === -1) {
    arr.push(obj);
  } else {
    arr[index].points += obj.points;
    arr[index].win += obj.win;
    arr[index].draw += obj.draw;
    arr[index].loss += obj.loss;
    arr[index].goals += obj.goals;
    arr[index].goalsAgainst += obj.goalsAgainst;
    arr[index].goalDifference += obj.goalDifference;
  }
}

function captureVictory(arr, obj){
  upsertTeamData(arr, {team: obj.team, points: 3, goals: obj.goals, goalsAgainst: obj.goalsAgainst, goalDifference: obj.goals - obj.goalsAgainst, win: 1, draw: 0, loss: 0});
}
function captureDraw(arr, obj){
  upsertTeamData(arr, {team: obj.team, points: 1, goals: obj.goals, goalsAgainst: obj.goalsAgainst, goalDifference: obj.goals - obj.goalsAgainst, win: 0, draw: 1, loss: 0});
}
function captureDefeat(arr, obj){
  upsertTeamData(arr, {team: obj.team, points: 0, goals: obj.goals, goalsAgainst: obj.goalsAgainst, goalDifference: obj.goals - obj.goalsAgainst, win: 0, draw: 0, loss: 1});
}

function buildTeamStandings(matchData, arr){ 
  matchData.rounds.forEach(round => {
    round.matches.forEach(match => {
      if (match.score1 > match.score2) 
      {
        captureVictory(arr, {team: match.team1, goals: match.score1, goalsAgainst: match.score2});
        captureDefeat(arr, {team:match.team2,goals: match.score2, goalsAgainst: match.score1});
      } 
      else if (match.score1 < match.score2) 
      { 
        captureVictory(arr, {team:match.team2, goals: match.score2, goalsAgainst: match.score1});
        captureDefeat(arr, {team:match.team1, goals: match.score1, goalsAgainst: match.score2});
      } else if (match.score1 == match.score2) {
        captureDraw(arr, {team:match.team1, goals: match.score1, goalsAgainst: match.score2});
        captureDraw(arr, {team:match.team2, goals: match.score2, goalsAgainst: match.score1});
      }
  
    })
  });
}

function rankTeams(arr){
  arr.sort(function (a, b) {
    //descending
    if (a.points > b.points) return -1;
    if (a.points < b.points) return 1;
    //ascending
    if (a.goalDifference < b.goalDifference) return -1;
    if (a.goalDifference > b.goalDifference) return 1;
    //descending
    if (a.goals > b.goals) return -1;
    if (a.goals < b.goals) return 1;
  });
  
  var i = 1; 
  arr.forEach(ranking => {
    ranking.rank = i;
    if (i <= 4) {
      ranking.league = "uefa";
    } else if (i > 4 && i <= 6 ) {
      ranking.league = "europa";
    } else if (i >= 18) {
      ranking.league = "relegated";
    }
    i += 1;
   });
}