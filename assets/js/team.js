
$(document).ready(function() {
    let playerCount;
    let templates;
    let template;
    let names;
    let stats = {
        wins: {},
        losses: {},
    };
    let gameNumber = 1;
    let gamesPlayed = 0;

    function loadState() {
        const stateJson = localStorage.getItem('games-state');
        if (!stateJson) {
            return;
        }
        const state = JSON.parse(stateJson);
        names = state.names;
        stats = state.stats;
        gamesPlayed = state.gamesPlayed;
        setPlayerCount(state.playerCount);
        $("#games").show();
        $("#stats").show();
    }

    function saveState() {
        const state = {
            names,
            stats,
            gamesPlayed,
            playerCount,
        };
        const stateJson = JSON.stringify(state);
        localStorage.setItem('games-state', stateJson);
    }

    function update() {
        drawGame();
        drawStats();
        saveState();
    }

    $('#player-count').change(function() {
      const pc = $(this).val();
      setPlayerCount(pc);
    });

    function setPlayerCount(pc) {
      if (pc === playerCount) {
        return;
      }
      playerCount = pc;
      console.log(`playerCount = ${playerCount}`);

      $('#player-count').val(playerCount);
      $('#player-inputs').empty();
      const oldNames = names;
      names = [];
      for (let idx=1; idx <= playerCount; idx++) {
        const id = `p${idx}-name`;
        const value = `Player ${idx}`;
        var input1 = $('<input>', { type: 'text', name: id, id, value});
        $('#player-inputs').append(input1);  
        $(`#${id}`).on('focus', function() {
            $(this).select();
        });
        $(`#${id}`).on('change', function() {
            const value = $(this).val();
            if (names.includes(value)) {
              window.alert("That name already exists!");
              $(this).val(names[idx-1]);
              return;
            }
            names[idx-1] = value;
            stats.wins[value] = 0;
            stats.losses[value] = 0;
            update();
        });
        
        names.push(value);
        if (!stats.wins[value] && !stats.losses[value]) {
            stats.wins[value] = 0;
            stats.losses[value] = 0;
        }
      }
      if (oldNames) {
        for (let idx=0; idx < names.length && idx < oldNames.length; idx++) {
            names[idx] = oldNames[idx];
            $(`#p${idx+1}-name`).val(names[idx]);
        }
      }
      template = shuffleArray(templates[playerCount]);
      gameNumber = 1;

      console.log('Using template', template);
      $("#names").show();
      $("#names-href").trigger('click');
      update();
    }

    $('#play-game-button').on('click', function() {
        console.log('here');
        $("#games").show();
        $("#stats").show();
        gameNumber = 1;
        update();
        goto('games');
    });

    $.getJSON('assets/team-templates.json', function(data) {
        console.log('loaded templates', data);
        templates = data;
        loadState();
      });

    function goto(name) {
        var target = $(`#${name}`);
        if (target.length) {
          $('html, body').animate({
            scrollTop: target.offset().top
          }, 1000);
        }
    }
    window.goto = goto;

    function getPlayerName(name) {
        if (!name) {
            return '';
        }
        const idx = name.split(/-/)[1];
        return names[idx-1];
    }

    function getPlayerIdx(name) {
        if (!name) {
            return '';
        }
        const idx = name.split(/-/)[1];
        return idx-1;
    }

    function drawGame() {
        $("#gameNumber").text(numberToOrdinal(gameNumber));
        $("#gamesPlayed").text(gamesPlayed);
        $("#game-body").empty();
        game = shuffleArray(template[gameNumber-1]);
        console.log('Using game', game);

        const team1 = shuffleArray(game[0]);
        const team2 = shuffleArray(game[1]);
        for(let idx=0; ;idx++) {
            const name1 = getPlayerName(team1[idx] || '');
            const name2 = getPlayerName(team2[idx] || '');
            if (!name1 && !name2) {
                break;
            }
            var newRow = $("<tr>");
            newRow.append(`<td>${name1}</td>`);
            newRow.append(`<td>${name2}</td>`);
            $("#game-body").append(newRow);
        }
    }

    function drawStats() {
        $("#stats-body").empty();
        /*
        <tr>
            <td>Player 1</td>
            <td>5</td>
            <td>1</td>
        </tr>
    */
        const statsData = [];
        for(let idx=0; idx<playerCount; idx++) {
            const name = names[idx];
            const win = stats.wins[name] || 0;
            const loss = stats.losses[name] || 0;
            statsData.push({
                name,
                win,
                loss,
            });
        }
        statsData.sort(function(a, b) {
            return b.win - a.win;
          });          
        statsData.forEach(stat => {
            var newRow = $("<tr>");
            newRow.append(`<td>${stat.name}</td>`);
            newRow.append(`<td>${stat.win}</td>`);
            newRow.append(`<td>${stat.loss}</td>`);
            $("#stats-body").append(newRow);
        });

    }

    function resetStats() {
        stats = {
            wins: {},
            losses: {},
        };
        names.forEach(name => {
            stats.wins[name] = 0;
            stats.losses[name] = 0;
        });
        gamesPlayed = 0;
        update();
    }
    window.resetStats = resetStats;

    function gameOver(teamNumber) {
        game = template[gameNumber-1];
        winningTeam = game[teamNumber];
        losingTeam = game[(teamNumber+1) % 2];
        console.log('winners', winningTeam);
        console.log('losers', losingTeam);
        winningTeam.forEach(player => {
            stats.wins[getPlayerName(player)]++;
        });
        losingTeam.forEach(player => {
            stats.losses[getPlayerName(player)]++;
        });
        gameNumber += 1;
        if (gameNumber > template.length) {
            gameNumber = 1;
            template = shuffleArray(templates[playerCount]);
        }
        gamesPlayed++;
        update();
    }
    window.gameOver = gameOver;

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

    function numberToOrdinal(num) {
        if (num === undefined || num === null || isNaN(num)) {
          return "";
        }
        
        if (num % 100 >= 11 && num % 100 <= 13) {
          return num + "th";
        } else {
          switch (num % 10) {
            case 1:
              return num + "st";
            case 2:
              return num + "nd";
            case 3:
              return num + "rd";
            default:
              return num + "th";
          }
        }
      }      

    $("#names-href").hide();
    $("#names").hide();
    $("#games").hide();
    $("#stats").hide();
  });
