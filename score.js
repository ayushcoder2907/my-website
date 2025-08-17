
const setup = document.getElementById('setup');
const tossScreen = document.getElementById('tossScreen');
const live = document.getElementById('live');
const scorecard = document.getElementById('scorecard');
const matchEnd = document.getElementById('matchEnd');

const runButtonsDiv = document.getElementById('runButtons');
const matchResultDiv = document.getElementById('matchResult');
const finalResultText = document.getElementById('finalResultText');


const batsmanModal = document.getElementById('batsmanModal');
const batsmanOptions = document.getElementById('batsmanOptions');
const bowlerModal = document.getElementById('bowlerModal');
const bowlerOptions = document.getElementById('bowlerOptions');


let match = {
  team1: '',
  team2: '',
  team1Players: [],
  team2Players: [],
  battingTeam: '',
  bowlingTeam: '',
  overs: 0,
  score: 0,
  wickets: 0,
  totalBalls: 0,
  overBalls: 0,
  batsmen: {},
  bowlers: {},
  striker: '',
  nonStriker: '',
  bowler: '',
  usedBatsmen: [],
  innings: 1,
  firstInningsScore: 0,
  target: null
};
let lastState = null; 


[0, 1, 2, 3, 4, 5, 6].forEach(run => {
  const btn = document.createElement('button');
  btn.innerText = run;
  btn.onclick = () => document.getElementById('runInput').value = run;
  runButtonsDiv.appendChild(btn);
});

const runInput = document.createElement('input');
runInput.type = 'number';
runInput.id = 'runInput';
runInput.hidden = true;
document.body.appendChild(runInput);


document.getElementById('proceedToss').onclick = () => {
  match.team1 = document.getElementById('team1').value;
  match.team2 = document.getElementById('team2').value;
  match.team1Players = document.getElementById('team1Players').value.split(',').map(p => p.trim());
  match.team2Players = document.getElementById('team2Players').value.split(',').map(p => p.trim());
  match.overs = parseInt(document.getElementById('overs').value);

  if (match.team1Players.length < 2 || match.team2Players.length < 2) {
    alert("Please enter at least 2 players in each team.");
    return;
  }

  setup.classList.add('hidden');
  tossScreen.classList.remove('hidden');

  document.getElementById('chooseTeam1Bat').innerText = match.team1 + ' Bat First';
  document.getElementById('chooseTeam2Bat').innerText = match.team2 + ' Bat First';
};

document.getElementById('chooseTeam1Bat').onclick = () => startMatch(match.team1, match.team2);
document.getElementById('chooseTeam2Bat').onclick = () => startMatch(match.team2, match.team1);

function startMatch(batting, bowling) {
  match.battingTeam = batting;
  match.bowlingTeam = bowling;
  match.batsmen = {};
  match.bowlers = {};
  match.usedBatsmen = [];

  const players = batting === match.team1 ? match.team1Players : match.team2Players;

  showBatsmanSelection(players, true);
  tossScreen.classList.add('hidden');
  live.classList.remove('hidden');

  document.getElementById('matchTitle').innerText = `${match.battingTeam} vs ${match.bowlingTeam}`;
}


function showBatsmanSelection(players, isInitial = false) {
  batsmanModal.classList.remove('hidden');
  batsmanOptions.innerHTML = '';

  const available = players.filter(p => !match.usedBatsmen.includes(p));
  available.forEach(name => {
    const btn = document.createElement('button');
    btn.innerText = name;
    btn.onclick = () => {
      match.usedBatsmen.push(name);
      match.batsmen[name] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };

      if (isInitial && !match.striker) match.striker = name;
      else if (isInitial && !match.nonStriker) match.nonStriker = name;
      else match.striker = name;

      batsmanModal.classList.add('hidden');

      if (isInitial && (!match.striker || !match.nonStriker)) {
        showBatsmanSelection(players, true);
      } else if (isInitial) {
        showBowlerSelection();
      }

      render();
    };
    batsmanOptions.appendChild(btn);
  });
}


function showBowlerSelection() {
  bowlerModal.classList.remove('hidden');
  bowlerOptions.innerHTML = '';

  const players = match.bowlingTeam === match.team1 ? match.team1Players : match.team2Players;
  const available = players.filter(p => p !== match.bowler);

  available.forEach(name => {
    const btn = document.createElement('button');
    btn.innerText = name;
    btn.onclick = () => {
      match.bowler = name;
      if (!match.bowlers[name]) {
        match.bowlers[name] = { balls: 0, runs: 0, wickets: 0, maiden: 0 };
      }
      bowlerModal.classList.add('hidden');
      render();
    };
    bowlerOptions.appendChild(btn);
  });
}


document.getElementById('submitBall').onclick = () => {
  lastState = JSON.stringify(match); // Save deep clone

  const runs = parseInt(document.getElementById('runInput').value);
  const isWicket = document.getElementById('isWicket').checked;
  const batsman = match.batsmen[match.striker];
  const bowler = match.bowlers[match.bowler];

  if (!isWicket) {
    batsman.runs += runs;
    if (runs === 4) batsman.fours++;
    if (runs === 6) batsman.sixes++;
    match.score += runs;
    bowler.runs += runs;
  } else {
    batsman.out = true;
    match.wickets++;
    bowler.wickets++;
    showBatsmanSelection(match.battingTeam === match.team1 ? match.team1Players : match.team2Players);
  }

  batsman.balls++;
  bowler.balls++;
  match.totalBalls++;
  match.overBalls++;

  
  if (runs % 2 === 1 && !isWicket) {
    [match.striker, match.nonStriker] = [match.nonStriker, match.striker];
  }

  
  if (match.overBalls === 6) {
    match.overBalls = 0;
    [match.striker, match.nonStriker] = [match.nonStriker, match.striker];
    showBowlerSelection();
  }

  document.getElementById('runInput').value = '';
  document.getElementById('isWicket').checked = false;

  checkEndConditions();
  render();
};


function checkEndConditions() {
  const ballsLimit = match.overs * 6;

  if (match.innings === 1 && (match.wickets === 10 || match.totalBalls === ballsLimit)) {
    match.firstInningsScore = match.score;
    match.target = match.score + 1;
    match.innings = 2;
    match.score = 0;
    match.wickets = 0;
    match.totalBalls = 0;
    match.overBalls = 0;
    match.batsmen = {};
    match.bowlers = {};
    match.usedBatsmen = [];
    [match.battingTeam, match.bowlingTeam] = [match.bowlingTeam, match.battingTeam];
    match.striker = '';
    match.nonStriker = '';
    match.bowler = '';

    document.getElementById('matchTitle').innerText = `${match.battingTeam} chasing ${match.target}`;
    showBatsmanSelection(match.battingTeam === match.team1 ? match.team1Players : match.team2Players, true);
  }

  
  if (match.innings === 2) {
    if (match.score >= match.target) {
      showMatchResult(`${match.battingTeam} won by ${10 - match.wickets} wickets`);
    } else if (match.totalBalls === ballsLimit || match.wickets === 10) {
      const margin = match.target - 1 - match.score;
      showMatchResult(`${match.bowlingTeam} won by ${margin} runs`);
    }
  }
}

function showMatchResult(result) {
  live.classList.add('hidden');
  matchEnd.classList.remove('hidden');
  finalResultText.innerText = result;
}


document.getElementById('viewScorecard').onclick = () => {
  live.classList.add('hidden');
  scorecard.classList.remove('hidden');

  const card = document.getElementById('fullScorecard');
  card.innerHTML = `<h3>${match.battingTeam} Innings</h3>`;
  for (let name in match.batsmen) {
    const b = match.batsmen[name];
    card.innerHTML += `<p>${name} - ${b.runs}(${b.balls}) ${b.out ? 'out' : 'not out'}</p>`;
  }

  card.innerHTML += `<h4>Bowling</h4>`;
  for (let name in match.bowlers) {
    const bw = match.bowlers[name];
    const overs = `${Math.floor(bw.balls / 6)}.${bw.balls % 6}`;
    card.innerHTML += `<p>${name} - ${overs}-${bw.runs}-${bw.maiden}-${bw.wickets}</p>`;
  }
};

document.getElementById('backToLive').onclick = () => {
  scorecard.classList.add('hidden');
  live.classList.remove('hidden');
};


function render() {
  document.getElementById('score').innerText = `${match.score}/${match.wickets}`;
  document.getElementById('overCount').innerText = `${Math.floor(match.totalBalls / 6)}.${match.totalBalls % 6}`;

  const batsmenList = document.getElementById('batsmenList');
  batsmenList.innerHTML = '';
  [match.striker, match.nonStriker].forEach(name => {
    if (!name) return;
    const b = match.batsmen[name];
    const li = document.createElement('li');
    li.innerText = `${name}${match.striker === name ? '*' : ''} - ${b.runs}(${b.balls}) 4s:${b.fours} 6s:${b.sixes}`;
    batsmenList.appendChild(li);
  });

  const bowlerStats = document.getElementById('bowlerStats');
  bowlerStats.innerHTML = '';
  const bw = match.bowlers[match.bowler];
  if (bw) {
    const li = document.createElement('li');
    const overs = `${Math.floor(bw.balls / 6)}.${bw.balls % 6}`;
    li.innerText = `${match.bowler} - ${overs}-${bw.runs}-${bw.maiden}-${bw.wickets}`;
    bowlerStats.appendChild(li);
  }
}

function saveToLocal() {
  localStorage.setItem('matchData', JSON.stringify(match));
}


function loadFromLocal() {
  const data = localStorage.getItem('matchData');
  if (data) {
    match = JSON.parse(data);
    if (match.striker && match.nonStriker && match.bowler) {
      document.getElementById('matchTitle').innerText = `${match.battingTeam} vs ${match.bowlingTeam}`;
      setup.classList.add('hidden');
      tossScreen.classList.add('hidden');
      live.classList.remove('hidden');
      render();
    }
  }
}

loadFromLocal(); 


document.getElementById('submitBall').addEventListener('click', () => {
  saveToLocal();
});
document.getElementById('exportScorecard').addEventListener('click', () => {
  let content = `${match.battingTeam} Innings\n`;
  for (let name in match.batsmen) {
    const b = match.batsmen[name];
    content += `${name} - ${b.runs}(${b.balls}) ${b.out ? 'out' : 'not out'}\n`;
  }

  content += `\nBowling:\n`;
  for (let name in match.bowlers) {
    const bw = match.bowlers[name];
    const overs = `${Math.floor(bw.balls / 6)}.${bw.balls % 6}`;
    content += `${name} - ${overs}-${bw.runs}-${bw.maiden}-${bw.wickets}\n`;
  }

  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'scorecard.txt';
  link.click();
});


document.getElementById('undoBall').addEventListener('click', () => {
  if (lastState) {
    match = JSON.parse(lastState);
    lastState = null;
    saveToLocal(); // update localStorage too
    render();
  } else {
    alert('No previous ball to undo.');
  }
});
window.onload = function () {
  document.getElementById('resetMatch')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the match?')) {
      localStorage.removeItem('matchData');
      location.reload();
    }
  });

};


