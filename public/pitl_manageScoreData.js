//<editor-fold> << GLOBAL VARIABLES >> ------------------------------------- //
const W = 330;
const H = 180;
const BTN_W = 217;
const BTN_H = 50;
const LEFT = 50;
const H2 = 106;
const H3 = 177;
const TOP = 35;
const BTN_FNT_SZ = 14;
//</editor-fold> >> END GLOBAL VARIABLES END  /////////////////////////////////

//<editor-fold> << INTERFACE >> -------------------------------------------- //
// CANVAS & PANEL & TITLE ------------------ >
let canvas = mkCanvasDiv('cid', W, H, 'black');
let panel = mkPanel('pid', canvas, W, H, "Prolonged into the latent - Score Manager", ["center-top", "0px", "0px", "none"], 'xs', true);
let title = mkSpan(canvas, 'mainTitle', W, 24, 8, 23, 'Prolonged into the latent - Score Manager', 16, 'rgb(153,255,0)');
title.style.fontVariant = 'small-caps';

function genScoreDataFunc() {
  generateScoreData();
  genScoreBtn.innerText = 'Generate Another Score';
}
// GENERATE SCORE BUTTON ------------------- >
let genScoreBtn = mkButton(canvas, 'genScoreBtn', BTN_W, BTN_H, TOP, LEFT, 'Generate Score', BTN_FNT_SZ, function() {
  genScoreDataFunc();
});
//</editor-fold> >> END INTERFACE END  ////////////////////////////////////////

//<editor-fold> << GENERATE SCORE DATA FUNCTION >> ------------------------- //
function generateScoreData() {
  var leadTime = 8.0
  var FRAMERATE = 60.0;

  //ca 10.6 - 13.2 min
  var PIECEDURSEC = rrand(8.2, 11.1) * 60;
  // 5 Sections: Hocket - Crescendos - Hocket/Crescendos/Accel - Hocket/Accel - Short Hocket :13-:27
  var sectionsSecs = [];
  //Section 1: Hocket 21-27%
  var section1dur = PIECEDURSEC * rrand(0.21, 0.27);
  //Section 6: Short Hocket :11-:17
  var section4dur = rrand(11, 17);
  //Section 2: Crescendos 37-39% of what is left
  var s2thru4 = PIECEDURSEC - section1dur - section4dur;
  var section2dur = s2thru4 * rrand(0.39, 0.43);
  //Section 3: Hocket/Crescendos/Accel 57-63% of what is left
  var section3dur = s2thru4 - section2dur;
  // SECTION 1 ------------------------------------------------------------- //
  //Section 1 Tempo Changes
  var sec1TempoChanges = palindromeTimeContainers(section1dur, 2.4, 9, 0.03, 0.06);
  //For every tempo change how many simultaneous tempi
  // 1, 2, 3, 4, 5, 7, 11, 12
  var numSimultaneousTempi = [1, 2, 3, 4, 5, 7, 11, 12];
  var tempiChances = [21, 17, 11, 11, 8, 7, 4, 4];
  var sec1NumTempi = [];
  for (var i = 0; i < sec1TempoChanges.length; i++) {
    var time_numTempi = [];
    time_numTempi.push(sec1TempoChanges[i]);
    var numTempi = chooseWeighted(numSimultaneousTempi, tempiChances);
    time_numTempi.push(numTempi);
    sec1NumTempi.push(time_numTempi);
  }
  //For every tempo change choose tempi
  var sec1Tempi = [];
  //Generate divisions approx ever 5bpm
  var tempoMin = 54;
  var tempoMax = 91;
  var newTempo = tempoMin;
  var tempoSects = [];
  while (newTempo <= tempoMax) {
    tempoSects.push(newTempo);
    newTempo = newTempo + rrand(4.1, 5.7);
  }
  var tempi = [];
  //generate 3 tempi per section
  for (var i = 1; i < tempoSects.length; i++) {
    var tempTempoSec = [];
    for (var j = 0; j < 3; j++) {
      var nextTempo = rrand(tempoSects[i - 1], tempoSects[i]);
      //generate a random phase
      var tempo_phase = [];
      tempo_phase.push(nextTempo);
      var phase = rrand(0, 1);
      tempo_phase.push(phase);
      tempTempoSec.push(tempo_phase);
    }
    tempi.push(tempTempoSec);
  }
  //shuffle tempo array
  var tempiShuffle = shuffle(tempi);
  var tempoArrayInc = 0;
  //grab a tempo from each section
  for (var i = 0; i < sec1NumTempi.length; i++) {
    var tempSecTempi = [];
    for (var j = 0; j < sec1NumTempi[i][1]; j++) {
      var thisTempo = choose(tempiShuffle[tempoArrayInc]);
      tempoArrayInc = (tempoArrayInc + 1) % tempiShuffle.length;
      tempSecTempi.push(thisTempo);
    }
    var timecode_tempi = [];
    timecode_tempi.push(sec1NumTempi[i][0]);
    timecode_tempi.push(tempSecTempi);
    sec1Tempi.push(timecode_tempi);
  }
  //Generate a timegrid for every beat
  // sec1Tempi[i][0] is the time code start for that section
  //sec1Tempi[1] = an array of tempi;
  var timeGrid = [];
  for (var i = 1; i < sec1Tempi.length; i++) {
    var thisSectionTimes = [];
    thisSectionTimes.push(sec1Tempi[i - 1][0]);
    var tempTempoTimes = [];
    for (var j = 0; j < sec1Tempi[i][1].length; j++) {
      var tCurrTime = sec1Tempi[i - 1][0];
      //find #sec/beat
      var temptempo = sec1Tempi[i][1][j][0];
      var tempphase = sec1Tempi[i][1][j][1];
      var secperbeat = 60.0 / temptempo; //tempo, [1] is phase
      var durTil1stBeat = secperbeat * tempphase;
      tCurrTime = tCurrTime + durTil1stBeat;
      var thisTempoTimes = [];
      while (tCurrTime <= sec1Tempi[i][0]) {
        // while (tCurrTime <= (sec1Tempi[i][0]-secperbeat)) {
        thisTempoTimes.push(tCurrTime);
        tCurrTime = tCurrTime + secperbeat;
        // thisTempoTimes.push(tCurrTime);
      }
      var tempArraySet = [];
      tempArraySet.push(thisTempoTimes);
      var emptyOrchArray = [];
      tempArraySet.push(emptyOrchArray);
      tempArraySet.unshift(sec1Tempi[i][1][j]);
      tempTempoTimes.push(tempArraySet);

    }
    thisSectionTimes.push(tempTempoTimes);
    timeGrid.push(thisSectionTimes);
  }

  // Orchestration
  // Generate a large set of every player we will need for every section
  var maxNumOfPlayers = 16;
  var totalNumPlayers = 0;
  var playerGrid = [];
  var playerGridIx = 0;
  //Generate large grid of 16 players for each section
  for (var i = 0; i < timeGrid.length; i++) {
    for (var j = 0; j < maxNumOfPlayers; j++) {
      playerGrid.push(j);
    }
  }
  //Generate the number of players for each section
  //Grab sequencially from  master player grid and scramble
  for (var i = 0; i < timeGrid.length; i++) {
    //number players this section
    var tNumPlayersThisSection = rrandInt(timeGrid[i][1].length, maxNumOfPlayers);
    //Store for later use
    timeGrid[i].push(tNumPlayersThisSection);
    //Generate set of players for this sec
    var tsecPlayersSet = [];
    var tsecPlayersSetIx = 0;
    for (var j = 0; j < tNumPlayersThisSection; j++) {
      tsecPlayersSet.push(playerGrid[playerGridIx]);
      playerGridIx++;
    }
    //Even number of players for each part
    //Randomly distribute remainders
    var tNumParts = timeGrid[i][1].length;
    var tNumRepeats = Math.floor(tNumPlayersThisSection / timeGrid[i][1].length);
    var tRemainderPlayers = tNumPlayersThisSection % timeGrid[i][1].length;
    for (var j = 0; j < tNumRepeats; j++) {
      for (var k = 0; k < timeGrid[i][1].length; k++) {
        timeGrid[i][1][k][2].push(tsecPlayersSet[tsecPlayersSetIx]);
        tsecPlayersSetIx++;
      }
    }
    //With remainder players, randomly assign to one of the parts
    var tscramParts = scrambleCount(timeGrid[i][1].length);
    for (var j = 0; j < tRemainderPlayers; j++) {
      timeGrid[i][1][tscramParts[j]][2].push(tsecPlayersSet[tsecPlayersSetIx]);
      tsecPlayersSetIx++;
    }
  }

  var timeCodeByPart = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    []
  ];
  for (var i = 0; i < timeGrid.length; i++) {
    for (var j = 0; j < timeGrid[i][1].length; j++) {
      for (var k = 0; k < timeGrid[i][1][j][2].length; k++) {
        timeCodeByPart[timeGrid[i][1][j][2][k]].push(timeGrid[i][1][j][1]);
      }
    }
  }


  // SECTION 2 ------------------------------------------------------------- //
  // Find end of section 1
  var sec1LastEventTime = 0;
  for (var i = 0; i < timeCodeByPart.length; i++) {
    var tlast = timeCodeByPart[i].length - 1;
    var tlast2 = timeCodeByPart[i][tlast].length - 1;
    var tlast3 = timeCodeByPart[i][tlast][tlast2];
    if (tlast3 > sec1LastEventTime) {
      sec1LastEventTime = tlast3;
    }
  }
  // Create sec2 timecode by parts
  var sec1sec2Gap = 3;
  var sec2start = sec1LastEventTime + sec1sec2Gap;
  var breath = 2.7;
  var cresMin = 5.9;
  var cresMax = 7.83;
  var cresDurs = distributeOverRange(cresMin, cresMax, maxNumOfPlayers);
  var sec2TimeCodeByPart = [];
  var endSec2Time = sec2start + section2dur;
  for (var i = 0; i < maxNumOfPlayers; i++) {
    var tempar = [];
    sec2TimeCodeByPart.push(tempar);
    for (var j = 0; j < 1000; j++) {
      var tnextTimeCode = sec2start + ((cresDurs[i] + breath) * j);
      if (tnextTimeCode > endSec2Time) {
        break;
      } else {
        sec2TimeCodeByPart[i].push(tnextTimeCode);
      }
    }
  }

  // SECTION 3: Hocket/Crescendos/Accel --------------------------------- //
  // Find end of section 2
  var sec2LastEventTime = 0;
  for (var i = 0; i < sec2TimeCodeByPart.length; i++) {
    var tlastix = sec2TimeCodeByPart[i].length - 1;
    var tlastval = sec2TimeCodeByPart[i][tlastix];
    if (tlastval > sec2LastEventTime) {
      sec2LastEventTime = tlastval;
    }
  }
  var section2_3gap = 0.5;
  var sec3StartTime = sec2LastEventTime + cresMax + section2_3gap;
  var sec3EndTime = sec3StartTime + section3dur;
  // DIVIDE PLAYERS INTO 3 GROUPS
  var sec3HocketPlayers = [];
  var sec3Cres = [];
  var sec3Accel = [];
  var playersScrambledSec3 = scrambleCount(16);
  var sec3HocketPlayers = playersScrambledSec3.slice(0, 5);
  var sec3Cres = playersScrambledSec3.slice(5, 10);
  var sec3Accel = playersScrambledSec3.slice(10, 16);
  // Hocket
  var sec3HocketTimeCode = [];
  for (var i = 0; i < sec3HocketPlayers.length; i++) {
    //generate when tempi changes will take place
    var tchgtimes = palindromeTimeContainers(section3dur, 1.8, 5.5, 0.03, 0.06);
    var ttimecodePerTempo = [];
    for (var j = 1; j < tchgtimes.length; j++) {
      //Generate tempo for each change time
      var ttempo = rrand(68, 105);
      var tdur = tchgtimes[j] - tchgtimes[j - 1];
      var tbeatdur = 60.0 / ttempo;
      var tbeatsAtTempo = [];
      //Generate as many beats as possible for each time container @ tempo
      for (var k = 0; k < 100; k++) {
        var titc = tbeatdur * k;
        if (titc < (tdur - tbeatdur)) {
          tbeatsAtTempo.push(tchgtimes[j - 1] + titc + sec3StartTime);
        } else break;
      }
      ttimecodePerTempo.push(tbeatsAtTempo);
    }
    sec3HocketTimeCode.push(ttimecodePerTempo);
  }
  // Sec 3 Crescendos
  var sec3CresDurs = distributeOverRange(cresMin, cresMax, sec3Cres.length);
  var sec3CresTimeCodeByPart = [];
  for (var i = 0; i < sec3Cres.length; i++) {
    var tempar = [];
    sec3CresTimeCodeByPart.push(tempar);
    for (var j = 0; j < 1000; j++) {
      var tnextTimeCode = ((sec3CresDurs[i] + breath) * j) + sec3StartTime;
      if (tnextTimeCode > sec3EndTime) {
        break;
      } else {
        sec3CresTimeCodeByPart[i].push(tnextTimeCode);
      }
    }
  }
  // ACCEL
  var sec3AccelTimeCode = [];
  for (var i = 0; i < sec3Accel.length; i++) {
    //generate when each accel begins
    var tchgtimes = palindromeTimeContainers(section3dur, 19.2, 31.1, 0.03, 0.06);
    var ttimecodePerAccel = [];
    for (var j = 1; j < tchgtimes.length; j++) {
      var titempo = 43.0;
      var ttempo = titempo;
      var taccelRate = rrand(1.052, 1.052);
      var tmindur = 0.27;
      var tdur = tchgtimes[j] - tchgtimes[j - 1];
      var tibeatdur = 60.0 / titempo;
      var tbeatdur = tibeatdur;
      var tbeatsAtAccel = [];
      //Generate as many beats as possible for each time container @ tempo
      var titc = 0;
      for (var k = 0; k < 100; k++) {
        if (titc < (tdur - tibeatdur)) {
          tbeatsAtAccel.push(tchgtimes[j - 1] + titc + sec3StartTime);
          ttempo = ttempo * taccelRate;
          tbeatdur = Math.max(tmindur, (60.0 / ttempo));
          titc = titc + tbeatdur;
        } else break;
      }
      ttimecodePerAccel.push(tbeatsAtAccel);
    }
    sec3AccelTimeCode.push(ttimecodePerAccel);
  }
  //SECTION 4 SHORT Hocket
  var sec4StartTime = sec3EndTime + cresMax;
  // Hocket
  var sec4TimeCode = [];
  for (var i = 0; i < maxNumOfPlayers; i++) {
    var ttempo = rrand(68, 105);
    var tbeatdur = 60.0 / ttempo;
    var tbeatsAtTempo = [];
    var titc = 0;
    //Generate as many beats as possible for each time container @ tempo
    for (var k = 0; k < 1000; k++) {
      titc = tbeatdur * k;
      if (titc < section4dur) {
        tbeatsAtTempo.push(titc + sec4StartTime);
      } else break;
    }
    sec4TimeCode.push(tbeatsAtTempo);
  }




  //MAKE PITCH DATA
  var pitchChangeTimes = palindromeTimeContainers(PIECEDURSEC, 7, 21, 0.01, 0.17);
  //Fetch Pitches From Fullman Analysis
  var pitchChanges = [];
  fetch('/pitchdata/sfAalysis003.txt')
    .then(response => response.text())
    .then(text => {
      var pitchesArray1 = [];
      var t1 = text.split(":");
      for (var i = 0; i < t1.length; i++) {
        var temparr = t1[i].split(';');
        var t3 = [];
        for (var j = 0; j < temparr.length; j++) {
          var temparr2 = temparr[j].split("&");
          var t4 = [];
          for (var k = 0; k < temparr2.length; k++) {
            t4.push(temparr2[k].split(","));
          }
          t3.push(t4);
        }
        pitchesArray1.push(t3);
      }
      return pitchesArray1;
    })
    .then(valArr => {

      //All parts need to have 4 pitches per section
      //this will remove the ones that do not have full sections
      var ttoosmall = [];
      var tnewPitchesArray = [];
      for (var i = 0; i < valArr.length; i++) {
        for (var j = 0; j < valArr[i].length; j++) {
          if (valArr[i][j].length < 4) {
            ttoosmall.push(i);
          }
        }
      }
      for (var i = 0; i < valArr.length; i++) {
        var tallGood = true;
        for (var j = 0; j < ttoosmall.length; j++) {
          if (i == ttoosmall[j]) {
            tallGood = false;
            break;
          }
        }
        if (tallGood) tnewPitchesArray.push(valArr[i]);
      }
      // SHUFFLE UP PITCHES
      var ts = [];
      for (var i = 0; i < tnewPitchesArray.length; i++) {
        ts.push(i);
      }
      var tss = shuffle(ts);
      var tnewPitchesArray2 = [];
      for (var i = 0; i < tnewPitchesArray.length; i++) {
        tnewPitchesArray2.push(tnewPitchesArray[tss[i]]);
      }
      // pitchesArray is index for each second
      // 4 arrays for every section: bass, tenor, alto, soprano
      // Each section array contains up to 4 pitches for each of 4 singers
      // [hz, midi, relative Amp]
      var pitchesArrayMaxTime = tnewPitchesArray2.length - 1;
      var pitchChangeTimesMaxTime = pitchChangeTimes[pitchChangeTimes.length - 1];
      for (var i = 0; i < pitchChangeTimes.length; i++) {
        var ttimepartsarr = [];
        var ttimecode;
        if (i != 0) {
          ttimecode = leadTime + pitchChangeTimes[i];
          // ttimecode = pitchChangeTimes[i];
        } else ttimecode = leadTime;
        ttimepartsarr.push(ttimecode);
        ttimepartsarr.push(Math.round(ttimecode * FRAMERATE));
        var tScaledTime = scale(pitchChangeTimes[i], 0.0, pitchChangeTimesMaxTime, 0.0, pitchesArrayMaxTime);
        for (var j = 0; j < tnewPitchesArray2.length; j++) {
          if (tScaledTime < j) {
            ttimepartsarr.push(tnewPitchesArray2[j - 1]);
            pitchChanges.push(ttimepartsarr);
            break;
          }
        }
      }


      // DOWNLOAD pitchChanges ----------------------------------------------- //
      //// pitchChanges [each pitch change] [ timeSec, goFrame, [Array of pitch arrays] ] [hz, midi, relAmp]
      var tempstr1 = "";
      for (var i = 0; i < pitchChanges.length; i++) {
        var tempstr2 = "";
        for (var j = 0; j < pitchChanges[i][2].length; j++) {
          var tempstr3 = "";
          for (var k = 0; k < pitchChanges[i][2][j].length; k++) {
            if (k == 0) {
              tempstr3 = pitchChanges[i][2][j][k].toString();
            } else {
              tempstr3 = tempstr3 + "?" + pitchChanges[i][2][j][k].toString();
            }
          }
          if (j == 0) {
            tempstr2 = tempstr3;
          } else {
            tempstr2 = tempstr2 + "%" + tempstr3;
          }
        }
        if (i == 0) {
          tempstr1 = pitchChanges[i][0] + "$" + pitchChanges[i][1] + "$" + tempstr2;
        } else {
          tempstr1 = tempstr1 + "&" + pitchChanges[i][0] + "$" + pitchChanges[i][1] + "$" + tempstr2;
        }
      }





      let pitchChanges_str = JSON.stringify(pitchChanges);
      downloadStrToHD(pitchChanges_str, 'pitchChanges.txt', 'text/plain');

      let timeCodeByPart_str = JSON.stringify(timeCodeByPart);
      downloadStrToHD(timeCodeByPart_str, 'timeCodeByPart.txt', 'text/plain');

      let sec2TimeCodeByPart_str = JSON.stringify(sec2TimeCodeByPart);
      downloadStrToHD(sec2TimeCodeByPart_str, 'sec2TimeCodeByPart.txt', 'text/plain');

      let sec3HocketTimeCode_str = JSON.stringify(sec3HocketTimeCode);
      downloadStrToHD(sec3HocketTimeCode_str, 'sec3HocketTimeCode.txt', 'text/plain');

      let sec3CresTimeCodeByPart_str = JSON.stringify(sec3CresTimeCodeByPart);
      downloadStrToHD(sec3CresTimeCodeByPart_str, 'sec3CresTimeCodeByPart.txt', 'text/plain');

      let sec3AccelTimeCode_str = JSON.stringify(sec3AccelTimeCode);
      downloadStrToHD(sec3AccelTimeCode_str, 'sec3AccelTimeCode.txt', 'text/plain');

      let sec4TimeCode_str = JSON.stringify(sec4TimeCode);
      downloadStrToHD(sec4TimeCode_str, 'sec4TimeCode.txt', 'text/plain');

      let varsArr = [sec2start, endSec2Time, sec3StartTime, sec3EndTime, cresDurs, sec3Accel, sec3HocketPlayers, sec3Cres];
      let varsArr_str = JSON.stringify(varsArr);
      downloadStrToHD(varsArr_str, 'varsArr.txt', 'text/plain');









    });



  // UPLOAD pitchChanges from file -------------------------------------- //
  function uploadPitchChangesFromFile(path) {
    fetch(path)
      .then(response => response.text())
      .then(text => {
        var pitchesArray1 = [];
        var t1 = text.split("&");
        var d3 = [];
        for (var i = 0; i < t1.length; i++) {
          var temparr = t1[i].split('$');
          var t3 = [];
          var t4 = temparr[2].split("%");
          var d2 = [];
          for (var j = 0; j < t4.length; j++) {
            var t5 = t4[j].split("?");
            var d1 = [];
            for (var k = 0; k < t5.length; k++) {
              var t6 = t5[k].split(",");
              var t6f = [];
              for (var l = 0; l < t6.length; l++) {
                t6f.push(parseFloat(t6[l]));
              }
              d1.push(t6f);
            }
            d2.push(d1)
          }
          var d4 = [];
          d4.push(parseFloat(temparr[0]));
          d4.push(parseFloat(temparr[1]));
          d4.push(d2);
          d3.push(d4);
        }
        return d3;
      });
  }


}
//</editor-fold> >> END GENERATE SCORE DATA FUNCTION END  /////////////////////
