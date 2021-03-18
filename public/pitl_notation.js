//<editor-fold> << GLOBAL VARIABLES >> ------------------------------------- //
//<editor-fold>  < GLOBAL VARS - TIMING >                 //
const FRAMERATE = 60.0;
const MSPERFRAME = 1000.0 / FRAMERATE;
const PXPERSEC = 150.0;
const PXPERFRAME = PXPERSEC / FRAMERATE;
var framect = 0;
var delta = 0.0;
var lastFrameTimeMs = 0.0;
var leadTime = 8.0;
let pieceTimeAdjustment = 0;
let pieceStartTime_epochTime;
let displayClock_TimeMS, displayClock_TimeSec, displayClock_TimeMin, displayClock_TimeHrs;
let clockAdj = 0;
let pauseState = 0;
let pausedTime = 0;
//</editor-fold> END GLOBAL VARS - TIMING END
//<editor-fold>  < GLOBAL VARS - COLORS >                 //
var clr_neonMagenta = new THREE.Color("rgb(255, 21, 160)");
var clr_neonGreen = new THREE.Color("rgb(57, 255, 20)");
var clr_limegreen = new THREE.Color("rgb(153, 255, 0)");
var clr_safetyOrange = new THREE.Color("rgb(255, 103, 0)");
var fretClr = [clr_limegreen, clr_neonMagenta];
//</editor-fold> END GLOBAL VARS - COLORS END
//<editor-fold>  < GLOBAL VARS - SCENE >                  //
const CANVASW = 113;
const CANVASH = 450;
const RUNWAYLENGTH = 1070;
// var camera, scene, renderer, canvas;
const GOFRETLENGTH = 21;
const GOFRETHEIGHT = 4;
const GOFRETPOSZ = -GOFRETLENGTH / 2;
const GOFRETWIDTH = 100;
const CRV_H = 150;
var goFretGeom = new THREE.CubeGeometry(GOFRETWIDTH, GOFRETHEIGHT, GOFRETLENGTH);
var goFretMatl = new THREE.MeshLambertMaterial({
  color: clr_neonGreen
});
var goFretAdd = 3;
var goFretBigGeom = new THREE.CubeGeometry(GOFRETWIDTH + goFretAdd, GOFRETHEIGHT + goFretAdd, GOFRETLENGTH + goFretAdd);
var tempoFretGeom = new THREE.CubeGeometry(GOFRETWIDTH, GOFRETHEIGHT, GOFRETLENGTH);
var numTracks = 16;
var trdiameter = 10;
var goFretBlink = [];
for (var i = 0; i < numTracks; i++) {
  goFretBlink.push(0);
}
var goFrets = []; //[goFret, goFretMatl]
//</editor-fold> END GLOBAL VARS - SCENE END
//<editor-fold>  < GLOBAL VARS - NOTATION & CURVES >      //
var pitchContainers = [];
var pitchContainerDOMs = [];
var notes;
var notationCanvasH = CRV_H;
var currentPitches = [];
var crvFollowData = [];
let cresDurs;
let pitchChanges;
// CRESCENDOS //////////////////
var cresCrvCoords = plot(function(x) {
  return Math.pow(x, 3);
}, [0, 1, 0, 1], GOFRETWIDTH, notationCanvasH);
//</editor-fold> END GLOBAL VARS - NOTATION & CURVES END
//<editor-fold>  < GLOBAL VARS - PARTS & SECTIONS >       //
let timeCodeByPart, sec2TimeCodeByPart, sec3HocketTimeCode, sec3CresTimeCodeByPart, sec3AccelTimeCode, sec4TimeCode;
let eventMatrix, sec2eventMatrix, sec3eventMatrixHocket, sec3eventMatrixCres, sec3eventMatrixAccel, sec4eventMatrix;
let sec3HocketPlayers, sec3Cres, sec3Accel;
let sec2start, endSec2Time, sec3StartTime, sec3EndTime;
let partsToRun_eventMatrix = [];
let partsToRun_sec2eventMatrix = [];
let partsToRun_sec3eventMatrixHocket = [];
let partsToRun_sec3eventMatrixCres = [];
let partsToRun_sec3eventMatrixAccel = [];
let partsToRun_sec4eventMatrix = [];
let partsToRun = [];
let notationObjects = [];
//</editor-fold> END GLOBAL VARS - PARTS & SECTIONS END
//<editor-fold>  < GLOBAL VARS - MISC >                   //
const SVG_NS = "http://www.w3.org/2000/svg";
var svgXlink = 'http://www.w3.org/1999/xlink';
var maxNumOfPlayers = 16;
var urlArgsDict;
let scoreCtrlPanel;
let readyBtns = [];
//</editor-fold> END GLOBAL VARS - MISC END
//<editor-fold>  < GLOBAL VARS - AUDIO >                   //
let actx;
let tonegain;
let tone;
let audResBtn = document.getElementById("audStBtn");
audResBtn.addEventListener("click", function() {
  actx.resume();
  audResBtn.parentNode.removeChild(audResBtn);
});

//</editor-fold> END GLOBAL VARS - AUDIO END
//<editor-fold>  < GLOBAL VARS - GATES >                 //
var piece_hasStarted = false;
let piece_canStart = true;
let startBtn_isActive = true;
let stopBtn_isActive = false;
let pauseBtn_isActive = false;
let animation_isGo = true;
let makeControlPanel = false;
let readyBtn_isActive = true;
//</editor-fold> END GLOBAL VARS - GATES END
//<editor-fold>  < GLOBAL VARS - TIMESYNC ENGINE >       //
var tsServer;
if (window.location.hostname == 'localhost') {
  tsServer = '/timesync';
} else {
  tsServer = window.location.hostname + '/timesync';
}
const TS = timesync.create({
  server: tsServer,
  // server: '/timesync',
  interval: 1000
});
//</editor-fold> > END GLOBAL VARS - TIMESYNC ENGINE END
//<editor-fold>  < GLOBAL VARS - SOCKET IO >             //
var ioConnection;
if (window.location.hostname == 'localhost') {
  ioConnection = io();
} else {
  ioConnection = io.connect(window.location.hostname);
}
const SOCKET = ioConnection;
//</editor-fold> > END GLOBAL VARS - SOCKET IO END
//<editor-fold>  < NOTES MIDI DICTIONARY >               //
var notesMidiDict = {
  36: '/svgs/036c2.svg',
  36.5: '/svgs/036p5cqs2.svg',
  37.0: '/svgs/037cs2.svg',
  37.5: '/svgs/037p5dqf2.svg',
  38.0: '/svgs/038d2.svg',
  38.5: '/svgs/038p5dqs2.svg',
  39.0: '/svgs/039ds2.svg',
  39.5: '/svgs/039p5eqf2.svg',
  40.0: '/svgs/040e2.svg',
  40.5: '/svgs/040p5fqf2.svg',
  41.0: '/svgs/041f2.svg',
  41.5: '/svgs/041p5fqs2.svg',
  42.0: '/svgs/042fs2.svg',
  42.5: '/svgs/042p5gqf2.svg',
  43.0: '/svgs/043g2.svg',
  43.5: '/svgs/043p5gqs2.svg',
  44.0: '/svgs/044gs2.svg',
  44.5: '/svgs/044p5aqf2.svg',
  45.0: '/svgs/045a2.svg',
  45.5: '/svgs/045p5aqs2.svg',
  46.0: '/svgs/046bf2.svg',
  46.5: '/svgs/046p5bqf2.svg',
  47.0: '/svgs/047b2.svg',
  47.5: '/svgs/047p5cqf3.svg',
  48.0: '/svgs/048c3.svg',
  48.5: '/svgs/048p5cqs3.svg',
  49.0: '/svgs/049cs3.svg',
  49.5: '/svgs/049p5dqf3.svg',
  50.0: '/svgs/050d3.svg',
  50.5: '/svgs/050p5dqs3.svg',
  51.0: '/svgs/051ef3.svg',
  51.5: '/svgs/051p5eqf3.svg',
  52.0: '/svgs/052e3.svg',
  52.5: '/svgs/052p5fqf3.svg',
  53.0: '/svgs/053f3.svg',
  53.5: '/svgs/053p5fqs3.svg',
  54.0: '/svgs/054fs3.svg',
  54.5: '/svgs/054p5gqf3.svg',
  55.0: '/svgs/055g3.svg',
  55.5: '/svgs/055p5gqs3.svg',
  56.0: '/svgs/056gs3.svg',
  56.5: '/svgs/056p5aqf3.svg',
  57.0: '/svgs/057a3.svg',
  57.5: '/svgs/057p5aqs3.svg',
  58.0: '/svgs/058bf3.svg',
  58.5: '/svgs/058p5bqf3.svg',
  59.0: '/svgs/059b3.svg',
  59.5: '/svgt/059p5cqb4t.svg',
  60.0: '/svgt/060c4t.svg',
  60.5: '/svgt/060p5cqs4t.svg',
  61.0: '/svgt/061cs4t.svg',
  61.5: '/svgs/061p5dqf4.svg',
  62.0: '/svgs/062d4.svg',
  62.5: '/svgs/062p5dqs4.svg',
  63.0: '/svgs/063ef4.svg',
  63.5: '/svgs/063p5eqf4.svg',
  64.0: '/svgs/064e4.svg',
  64.5: '/svgs/064p5fqf4.svg',
  65.0: '/svgs/065f4.svg',
  65.5: '/svgs/065p5fqs4.svg',
  66.0: '/svgs/066fs4.svg',
  66.5: '/svgs/066p5gqf4.svg',
  67.0: '/svgs/067g4.svg',
  67.5: '/svgs/067p5gqs4.svg',
  68.0: '/svgs/068gs4.svg',
  68.5: '/svgs/068p5aqf4.svg',
  69.0: '/svgs/069a4.svg',
  69.5: '/svgs/069p5aqs4.svg',
  70.0: '/svgs/070bf4.svg',
  70.5: '/svgs/070p5bqf4.svg',
  71.0: '/svgs/071b4.svg',
  71.5: '/svgs/071p5cqf5.svg',
  72.0: '/svgs/072c5.svg',
  72.5: '/svgs/072p5cqs5.svg',
  73.0: '/svgs/073cs5.svg',
  73.5: '/svgs/073p5dqf5.svg',
  74.0: '/svgs/074d5.svg',
  74.5: '/svgs/074p5dqs5.svg',
  75.0: '/svgs/075ef5.svg',
  75.5: '/svgs/075p5eqf5.svg',
  76.0: '/svgs/076e5.svg',
  76.5: '/svgs/076p5fqf5.svg',
  77.0: '/svgs/077f5.svg',
  77.5: '/svgs/077p5fqs5.svg',
  78.0: '/svgs/078fs5.svg',
  78.5: '/svgs/078p5gqf5.svg',
  79.0: '/svgs/079g5.svg',
  79.5: '/svgs/079p5gqs5.svg',
  80.0: '/svgs/080gs5.svg',
  80.5: '/svgs/080p5aqf5.svg',
  81.0: '/svgs/081a5.svg'
}
//</editor-fold> > END NOTES MIDI DICTIONARY END
//</editor-fold> >> END GLOBAL VARIABLES END  /////////////////////////////////

//<editor-fold> << START UP >> --------------------------------------------- //
//<editor-fold> << START UP WORKFLOW >> ---------------- //
/*
1) init() is run from the html page->body <body onload='init();'>
2) init() runs getUrlArgs() to get args from URL
3) init() Get parts to run from urlArgsDict populate partsToRun array
4) init() Establish whether to generate control panel or not from urlArgs
5) init() -> run loadScoreData() which loads score data from .txt files and populates the event matrices
///////// ---> everything else runs in this function as it is asynchronous
6) loadScoreData() -> Make Control Panel
7) Control Panel Start Button runs startPiece()
8) Audio is loaded in the SOCKET 'pitl_startpiecebroadcast' because for chrome it webaudio can only be created by a user gesture
*/
//</editor-fold> >> END START UP WORKFLOW  ////////////////////////////////////
//<editor-fold>  < INIT() >                              //
function init() {
  urlArgsDict = getUrlArgs();
  // Establish which parts to run
  var partsStrArray = urlArgsDict.parts.split(';');
  partsStrArray.forEach((it, ix) => {
    partsToRun.push(parseInt(it));
  });
  // Does the page have score controls?
  if (urlArgsDict.controls == 'yes') makeControlPanel = true;
  // Run loadScoreData(), everything else runs in this function as it is asynchronous

  initAudio();
  loadScoreData();

  //<editor-fold> << READY PANEL >> ---------------------------------------- //
  if (!makeControlPanel) {
    let readyPanel = mkCtrlPanel('readyPanel', 69, 69, 'Ready Panel', ['right-top', '0px', '0px', 'none'], 'xs');
    let readyBtnFunc = function() {
      if (readyBtn_isActive) {
        readyBtn_isActive = false;
        readyBtn.className = 'btn btn-1_inactive';
        readyPanel.panel.smallify();
        SOCKET.emit('pitl_ready', {
          playerNumReady: partsToRun[0]
        });
      }
    }
    let readyBtn = mkButton(readyPanel.canvas, 'imreadybtn', 55, 45, 0, 0, 'Ready?', 12, readyBtnFunc);
  }
  //</editor-fold> >> READY PANEL  ////////////////////////////////////////////
}
//</editor-fold> END INIT() END
//<editor-fold>  < LOAD SCORE DATA FUNCTION >            //
async function loadScoreData() {
  retrivedFileDataObj = await retriveFile('savedScoreData/pitchChanges.txt');
  retrivedFileData = retrivedFileDataObj.fileData;
  retrivedFileData_parsed = JSON.parse(retrivedFileData);
  pitchChanges = retrivedFileData_parsed;
  retrivedFileDataObj = await retriveFile('savedScoreData/varsArr.txt');
  retrivedFileData = retrivedFileDataObj.fileData;
  retrivedFileData_parsed = JSON.parse(retrivedFileData);
  let tempVarsArray = retrivedFileData_parsed;
  sec2start = tempVarsArray[0];
  endSec2Time = tempVarsArray[1];
  sec3StartTime = tempVarsArray[2];
  sec3EndTime = tempVarsArray[3];
  cresDurs = tempVarsArray[4];
  sec3Accel = tempVarsArray[5];
  sec3HocketPlayers = tempVarsArray[6];
  sec3Cres = tempVarsArray[7];
  retrivedFileDataObj = await retriveFile('savedScoreData/timeCodeByPart.txt');
  retrivedFileData = retrivedFileDataObj.fileData;
  retrivedFileData_parsed = JSON.parse(retrivedFileData);
  timeCodeByPart = retrivedFileData_parsed;

  retrivedFileDataObj = await retriveFile('savedScoreData/sec2TimeCodeByPart.txt');
  retrivedFileData = retrivedFileDataObj.fileData;
  retrivedFileData_parsed = JSON.parse(retrivedFileData);
  sec2TimeCodeByPart = retrivedFileData_parsed;

  retrivedFileDataObj = await retriveFile('savedScoreData/sec3HocketTimeCode.txt');
  retrivedFileData = retrivedFileDataObj.fileData;
  retrivedFileData_parsed = JSON.parse(retrivedFileData);
  sec3HocketTimeCode = retrivedFileData_parsed;

  retrivedFileDataObj = await retriveFile('savedScoreData/sec3CresTimeCodeByPart.txt');
  retrivedFileData = retrivedFileDataObj.fileData;
  retrivedFileData_parsed = JSON.parse(retrivedFileData);
  sec3CresTimeCodeByPart = retrivedFileData_parsed;

  retrivedFileDataObj = await retriveFile('savedScoreData/sec3AccelTimeCode.txt');
  retrivedFileData = retrivedFileDataObj.fileData;
  retrivedFileData_parsed = JSON.parse(retrivedFileData);
  sec3AccelTimeCode = retrivedFileData_parsed;

  retrivedFileDataObj = await retriveFile('savedScoreData/sec4TimeCode.txt');
  retrivedFileData = retrivedFileDataObj.fileData;
  retrivedFileData_parsed = JSON.parse(retrivedFileData);
  sec4TimeCode = retrivedFileData_parsed;


  //Make Notation Objects which will draw initial static content
  partsToRun.forEach((partToRun, ptrix) => {
    var newNO = mkNotationObject(partToRun, ptrix, CANVASW, CANVASH, RUNWAYLENGTH, [ptrix, partsToRun.length]);
    notationObjects.push(newNO);
  });

  //load svgs - 1 set for each section satb
  notes = loadNotationSVGsPerSection();

  //Generate event matrices
  partsToRun.forEach((numPartToRun, ix) => {
    loadInitialNotation(numPartToRun); //loads initial pitches
    //load initial pitch into play tone button
    notationObjects[ix].currentPitch = currentPitches[ix][1];
    partsToRun_eventMatrix.push(mkEventMatrixSec1_singlePart(numPartToRun));
    partsToRun_sec2eventMatrix.push(mkEventMatrixSec2_singlePart(numPartToRun));
    sec3HocketPlayers.forEach((hp) => {
      if (numPartToRun == hp) {
        let tar = [];
        tar.push(hp);
        tar.push(mkEventMatrixSec3Hocket_singlePart(numPartToRun));
        partsToRun_sec3eventMatrixHocket.push(tar);
      }
    });
    sec3Cres.forEach((cp) => {
      if (numPartToRun == cp) {
        let tar = [];
        tar.push(numPartToRun);
        tar.push(mkEventMatrixSec3Cres_singlePart(numPartToRun));
        partsToRun_sec3eventMatrixCres.push(tar);
      }
    });
    sec3Accel.forEach((ap) => {
      if (numPartToRun == ap) {
        let tar = [];
        tar.push(numPartToRun);
        tar.push(mkEventMatrixSec3Accel_singlePart(numPartToRun));
        partsToRun_sec3eventMatrixAccel.push(tar);
      }
    });
    partsToRun_sec4eventMatrix.push(mkEventMatrixSec4_singlePart(numPartToRun));
  });

  // MAKE CONTROL PANEL - if specified in URLargs
  if (makeControlPanel) {
    scoreCtrlPanel = mkCtrlPanel_ctrl('scoreCtrlPanel', 85, 507, 'Ctrl Panel', ['left-top', '0px', '0px', 'none'], 'xs');
  }



  //helper function for async file retrevial
  function retriveFile(path) {
    return new Promise((resolve, reject) => {
      let request = new XMLHttpRequest();
      request.open('GET', path, true);
      request.responseType = 'text';
      request.onload = () => resolve({
        fileData: request.response
      });
      request.onerror = reject;
      request.send();
    })
  }

}
//</editor-fold> END LOAD SCORE DATA FUNCTION END
//<editor-fold>  < START PIECE FUNCTION >                //
function startPiece() {
  if (!piece_hasStarted) {
    piece_hasStarted = true;
    var t_now = new Date(TS.now());
    let tsNow_epochTime = t_now.getTime();
    lastFrameTimeMs = tsNow_epochTime;
    pieceStartTime_epochTime = tsNow_epochTime;
    requestAnimationFrame(animationEngine);
  }
}
//</editor-fold> END START PIECE FUNCTION END
//</editor-fold> >> END START UP END  /////////////////////////////////////////

//<editor-fold> << AUDIO >> ------------------------------------------------ //
//FUNCTION initAudio ------------------------------------------------------ //
function initAudio() {
  // Audio Context
  actx = new(window.AudioContext || window.webkitAudioContext)();
  // Gain Node
  tonegain = actx.createGain();
  tonegain.gain.setValueAtTime(0, actx.currentTime);
  tonegain.connect(actx.destination);
  tonegain.gain.linearRampToValueAtTime(0.0, actx.currentTime + 0.1);
  // Sine Wave Oscillator
  tone = actx.createOscillator();
  tone.frequency.value = 440;
  tone.type = 'sine';
  tone.start();
  tone.connect(tonegain);
}
//FUNCTION playTone ------------------------------------------------------ //
function playTone(freq) {
  tone.frequency.value = freq;
  tonegain.gain.setValueAtTime(0, actx.currentTime + 0.05);
  tonegain.gain.linearRampToValueAtTime(0.15, actx.currentTime + 0.15);
  tonegain.gain.setValueAtTime(0.15, actx.currentTime + 0.2);
  tonegain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.55);
}
//</editor-fold> >> END AUDIO END  ////////////////////////////////////////////

// <editor-fold>  <<<< NOTATION OBJECT >>>> -------------------------------- //
function mkNotationObject(ix, ptrIX, w, h, len, placementOrder) {
  // <editor-fold>  <<<< VARS >>>> ----------------- //
  var notationObj = {};
  notationObj['ix'] = ix;
  // MAIN ID ------------- >
  var id = 'pitlPart' + ix;
  notationObj['id'] = id;
  var sec2addCurveGate = true;
  var sec2removeCurveGate = true;
  var sec3addCurveGate = true;
  var sec3removeCurveGate = true;
  notationObj['currentPitch'] = 440;
  let pitchUnblinkFrame = 0;
  //</editor-fold> END VARS END
  // <editor-fold>  <<<< PART ARRANGEMENT IN BROWSER WINDOW >>>> -- //
  let runway_offsetX;
  let notation_offsetX, notation_autopos;
  let partOrderNum = placementOrder[0];
  let totalParts = placementOrder[1];
  let partSpacing = 5;
  let runway_offsetY = '0px';
  let runway_autopos = 'none';
  notation_offsetY = (h + 3).toString();
  let txoffset;
  if (placementOrder[1] == 1) { //only one part
    runway_offsetX = '0px';
    notation_offsetX = '0px';
    notation_autopos = 'down';
  } else {
    txoffset = partOrderNum - (totalParts / 2) + 0.5;
    runway_offsetX = (txoffset * (w + partSpacing)).toString() + 'px';
    notation_offsetX = (txoffset * (w + partSpacing)).toString() + 'px';
    notation_autopos = 'none';
  }
  //</editor-fold> END PART ARRANGEMENT IN BROWSER WINDOW END
  // <editor-fold>  <<<< CANVAS, PANELS >>>> ----------------- //
  // Make Canvases ------------- >
  //// Runway ////
  var runwayCanvasID = id + 'runwayCanvas';
  var runwayCanvas = mkCanvasDiv(runwayCanvasID, w, h, '#000000');
  notationObj['runwayCanvas'] = runwayCanvas;
  //// Curve Follower ////
  var crvFollowCanvasID = id + 'crvFollowCanvas';
  var crvFollowCanvas = mkSVGcanvas(crvFollowCanvasID, GOFRETWIDTH, CRV_H);
  notationObj['crvFollowCanvas'] = crvFollowCanvas;
  // Make jsPanels ----------------- >
  //// Runway ////
  var runwayPanelID = id + 'runwayPanel';
  var runwayPanel = mkPanel(runwayPanelID, runwayCanvas, w, h, "Player " + ix.toString() + " - Runway", ['center-top', runway_offsetX, runway_offsetY, runway_autopos], 'xs');
  notationObj['runwayPanel'] = runwayPanel;
  //// Curve Follower ////
  var crvFollowPanelID = id + 'crvFollowPanel';
  var crvFollowPanel = mkPanel(crvFollowPanelID, crvFollowCanvas, GOFRETWIDTH, CRV_H, "Player " + ix.toString() + " - Curve", ['center-top', notation_offsetX, notation_offsetY, notation_autopos], 'xs');
  notationObj['crvFollowPanel'] = crvFollowPanel;
  //</editor-fold> END CANVAS, PANELS END
  // <editor-fold>  <<<< NOTATION OBJECT - 3JS >>>> ---------- //
  // Camera ////////////////////////////////
  let camera = new THREE.PerspectiveCamera(75, CANVASW / CANVASH, 1, 3000);
  // camera.position.set(0, 560, -148);
  // camera.rotation.x = rads(-68);
  let CAM_Y = 380;
  let CAM_Z = -110;
  let CAM_ROTATION_X = -68;
  camera.position.set(0, CAM_Y, CAM_Z);
  camera.rotation.x = rads(CAM_ROTATION_X);
  notationObj['camera'] = camera;
  // Scene /////////////////////////////////
  let scene = new THREE.Scene();
  // LIGHTS ////////////////////////////////
  var sun = new THREE.DirectionalLight(0xFFFFFF, 1.2);
  sun.position.set(100, 600, 175);
  scene.add(sun);
  var sun2 = new THREE.DirectionalLight(0x40A040, 0.6);
  sun2.position.set(-100, 350, 200);
  scene.add(sun2);
  notationObj['scene'] = scene;
  // Renderer //////////////////////////////
  let renderer = new THREE.WebGLRenderer();
  renderer.setSize(CANVASW, CANVASH);
  runwayCanvas.appendChild(renderer.domElement);
  notationObj['renderer'] = renderer;
  //</editor-fold> END NOTATION OBJECT - 3JS END
  // <editor-fold>  <<<< NOTATION OBJECT - STATIC ELEMENTS >>>> -- //
  //<editor-fold>  < RUNWAY >             //
  var runwayMatl =
    new THREE.MeshLambertMaterial({
      color: 0x0040C0
    });
  var runwayGeom = new THREE.PlaneGeometry(
    CANVASW,
    RUNWAYLENGTH,
  );
  var runway = new THREE.Mesh(runwayGeom, runwayMatl);
  runway.position.z = -RUNWAYLENGTH / 2;
  runway.rotation.x = rads(-90);
  scene.add(runway);
  //</editor-fold> END RUNWAY END
  //<editor-fold>  < TRACKS >             //
  var trgeom = new THREE.CylinderGeometry(trdiameter, trdiameter, RUNWAYLENGTH, 32);
  var trmatl = new THREE.MeshLambertMaterial({
    color: 0x708090
  });
  var tTr = new THREE.Mesh(trgeom, trmatl);
  tTr.rotation.x = rads(-90);
  tTr.position.z = -(RUNWAYLENGTH / 2);
  tTr.position.y = -trdiameter / 2;
  tTr.position.x = 0;
  scene.add(tTr);
  var goFretMatl = new THREE.MeshLambertMaterial({
    color: clr_neonGreen
  });
  //</editor-fold> END TRACKS END
  //<editor-fold>  < GO FRET >             //
  tGoFret = new THREE.Mesh(goFretGeom, goFretMatl);
  tGoFret.position.z = GOFRETPOSZ;
  tGoFret.position.y = GOFRETHEIGHT;
  tGoFret.position.x = 0;
  scene.add(tGoFret);
  var tGoFretSet = [];
  tGoFretSet.push(tGoFret);
  tGoFretSet.push(goFretMatl);
  goFrets.push(tGoFretSet);
  //</editor-fold> END GO FRET END
  //<editor-fold>  < NOTATION DIVS >             //
  let crvCanvas = document.createElementNS(SVG_NS, "svg");
  crvCanvas.setAttributeNS(null, "width", GOFRETWIDTH.toString());
  crvCanvas.setAttributeNS(null, "height", notationCanvasH.toString());
  crvCanvas.setAttributeNS(null, "id", "notationSVGcont" + ix.toString());
  crvCanvas.setAttributeNS(null, "x", 0);
  crvCanvas.style.backgroundColor = "white";
  crvFollowCanvas.appendChild(crvCanvas);
  // NOTATION CANVAS BACKGROUND RECT
  let notationCvsBgRect = document.createElementNS(SVG_NS, "rect");
  notationCvsBgRect.setAttributeNS(null, "x", "0");
  notationCvsBgRect.setAttributeNS(null, "y", "0");
  notationCvsBgRect.setAttributeNS(null, "width", GOFRETWIDTH.toString());
  notationCvsBgRect.setAttributeNS(null, "height", notationCanvasH.toString());
  notationCvsBgRect.setAttributeNS(null, "fill", "white");
  notationCvsBgRect.setAttributeNS(null, "id", "notationCvsBgRect" + ix.toString());
  notationCvsBgRect.setAttributeNS(null, "stroke", "#40E0D0");
  notationCvsBgRect.setAttributeNS(null, "stroke-width", "0");
  crvCanvas.appendChild(notationCvsBgRect);
  // NOTATION CANVAS BACKGROUND RECT
  let notationCont = document.createElementNS(SVG_NS, "svg");
  notationCont.setAttributeNS(null, "width", GOFRETWIDTH.toString());
  notationCont.setAttributeNS(null, "height", notationCanvasH.toString());
  notationCont.setAttributeNS(null, "id", "notationCont" + ix.toString());
  notationCont.setAttributeNS(null, "x", 0);
  notationCont.style.backgroundColor = "white";
  // Play Pitch Button Here ---->
  notationCont.addEventListener('click', function() {
    playTone(mtof(notationObj.currentPitch))
  });
  crvFollowCanvas.appendChild(notationCont);
  notationObj['notationCont'] = notationCont;
  let t_pcArr = [];
  t_pcArr.push(ix);
  t_pcArr.push(notationCont);
  pitchContainers.push(t_pcArr);
  pitchContainerDOMs.push(t_pcArr);
  //</editor-fold> END NOTATION DIVS END
  //<editor-fold>  < CURVE FOLLOW RECTS >             //
  var tcresFollowRect = document.createElementNS(SVG_NS, "rect");
  tcresFollowRect.setAttributeNS(null, "x", "1000");
  tcresFollowRect.setAttributeNS(null, "y", "0");
  tcresFollowRect.setAttributeNS(null, "width", GOFRETWIDTH.toString());
  tcresFollowRect.setAttributeNS(null, "height", "0");
  tcresFollowRect.setAttributeNS(null, "fill", "rgba(255, 21, 160, 0.5)");
  tcresFollowRect.setAttributeNS(null, "id", "cresFollowRect" + ix.toString());
  tcresFollowRect.setAttributeNS(null, "transform", "translate( 0, -3)");
  crvCanvas.appendChild(tcresFollowRect);
  notationObj['crvFollowRect'] = tcresFollowRect;
  //</editor-fold> END CURVE FOLLOW RECTS END
  //<editor-fold>  < CURVES >             //
  var tcresSvgCrv = document.createElementNS(SVG_NS, "path");
  var tpathstr = "";
  for (var i = 0; i < cresCrvCoords.length; i++) {
    if (i == 0) {
      tpathstr = tpathstr + "M" + cresCrvCoords[i].x.toString() + " " + cresCrvCoords[i].y.toString() + " ";
    } else {
      tpathstr = tpathstr + "L" + cresCrvCoords[i].x.toString() + " " + cresCrvCoords[i].y.toString() + " ";
    }
  }
  tcresSvgCrv.setAttributeNS(null, "d", tpathstr);
  tcresSvgCrv.setAttributeNS(null, "stroke", "rgba(255, 21, 160, 0.5)");
  tcresSvgCrv.setAttributeNS(null, "stroke-width", "4");
  tcresSvgCrv.setAttributeNS(null, "fill", "none");
  tcresSvgCrv.setAttributeNS(null, "id", "cresCrv" + ix.toString());
  tcresSvgCrv.setAttributeNS(null, "transform", "translate( 1000, -3)");
  crvCanvas.appendChild(tcresSvgCrv);
  notationObj['crv'] = tcresSvgCrv;
  //</editor-fold> END CURVES END
  //<editor-fold>  < CURVE FOLLOWERS >             //
  var tcresSvgCirc = document.createElementNS(SVG_NS, "circle");
  tcresSvgCirc.setAttributeNS(null, "cx", cresCrvCoords[0].x.toString());
  tcresSvgCirc.setAttributeNS(null, "cy", cresCrvCoords[0].y.toString());
  tcresSvgCirc.setAttributeNS(null, "r", "10");
  tcresSvgCirc.setAttributeNS(null, "stroke", "none");
  tcresSvgCirc.setAttributeNS(null, "fill", "rgba(255, 21, 160, 0.5)");
  tcresSvgCirc.setAttributeNS(null, "id", "cresCrvCirc" + ix.toString());
  tcresSvgCirc.setAttributeNS(null, "transform", "translate( 1000, -3)");
  crvCanvas.appendChild(tcresSvgCirc)
  notationObj['crvFollowCirc'] = tcresSvgCirc;
  //Make FOLLOWERS
  var tcrvFset = [];
  tcrvFset.push(true);
  tcrvFset.push(0.0);
  crvFollowData.push(tcrvFset);
  //</editor-fold> END CURVE FOLLOWERS END
  // </editor-fold>     END NOTATION OBJECT - STATIC ELEMENTS END
  // <editor-fold>  <<<< NOTATION OBJECT - ANIMATE >>>> ------------- //
  notationObj['animate'] = function() {
    // // SECTION 1
    for (var j = 0; j < partsToRun_eventMatrix[ptrIX].length; j++) {
      //add the tf to the scene if it is on the runway
      if (partsToRun_eventMatrix[ptrIX][j][1].position.z > (-RUNWAYLENGTH) && partsToRun_eventMatrix[ptrIX][j][1].position.z < GOFRETPOSZ) {
        if (partsToRun_eventMatrix[ptrIX][j][0]) {
          partsToRun_eventMatrix[ptrIX][j][0] = false;
          scene.add(partsToRun_eventMatrix[ptrIX][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (partsToRun_eventMatrix[ptrIX][j][1].position.z < GOFRETPOSZ) {
        partsToRun_eventMatrix[ptrIX][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect == partsToRun_eventMatrix[ptrIX][j][2]) {
        goFretBlink[ptrIX] = framect + 9;
        scene.remove(scene.getObjectByName(partsToRun_eventMatrix[ptrIX][j][1].name));
      }
    }
    ///// SECTION 2 ------------------------------------------------------- //
    for (var j = 0; j < partsToRun_sec2eventMatrix[ptrIX].length; j++) {
      //add the tf to the scene if it is on the runway
      if (partsToRun_sec2eventMatrix[ptrIX][j][1].position.z > (-RUNWAYLENGTH) && partsToRun_sec2eventMatrix[ptrIX][j][1].position.z < GOFRETPOSZ) {
        if (partsToRun_sec2eventMatrix[ptrIX][j][0]) {
          partsToRun_sec2eventMatrix[ptrIX][j][0] = false;
          scene.add(partsToRun_sec2eventMatrix[ptrIX][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (partsToRun_sec2eventMatrix[ptrIX][j][1].position.z < (GOFRETPOSZ + partsToRun_sec2eventMatrix[ptrIX][j][7])) {
        partsToRun_sec2eventMatrix[ptrIX][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect >= partsToRun_sec2eventMatrix[ptrIX][j][2] && framect < partsToRun_sec2eventMatrix[ptrIX][j][6]) {
        goFretBlink[ptrIX] = framect + 9;
        crvFollowData[ptrIX][0] = true;
        crvFollowData[ptrIX][1] = scale(framect, partsToRun_sec2eventMatrix[ptrIX][j][2], partsToRun_sec2eventMatrix[ptrIX][j][6], 0.0, 1.0);
      }
      //end of event remove
      if (framect == partsToRun_sec2eventMatrix[ptrIX][j][6]) {
        crvFollowData[ptrIX][0] = false;
        scene.remove(scene.getObjectByName(partsToRun_sec2eventMatrix[ptrIX][j][1].name));
      }
    }
    //crv follow
    // var tnewCresEvent = [true, tcresEventMesh, tGoFrm, tTime, tNumPxTilGo, tiGoPx, tOffFrm, tcresEventLength]; //[gate so tempofret is added to scene only once, mesh, goFrame]
    if (crvFollowData[ptrIX][0]) {
      var tcoordsix = Math.floor(scale(crvFollowData[ptrIX][1], 0.0, 1.0, 0, cresCrvCoords.length));
      //circ
      tcresSvgCirc.setAttributeNS(null, "cx", cresCrvCoords[tcoordsix].x.toString());
      tcresSvgCirc.setAttributeNS(null, "cy", cresCrvCoords[tcoordsix].y.toString());
      //rect
      var temph = notationCanvasH - cresCrvCoords[tcoordsix].y;
      tcresFollowRect.setAttributeNS(null, "y", cresCrvCoords[tcoordsix].y.toString());
      tcresFollowRect.setAttributeNS(null, "height", temph.toString());
    }
    // // SECTION 3 - Hocket
    let t_evtSet;
    let t_shouldRun = false;
    partsToRun_sec3eventMatrixHocket.forEach((pn_evtSet_ar) => {
      let plrNum = pn_evtSet_ar[0];
      if (ix == plrNum) {
        t_evtSet = pn_evtSet_ar[1];
        t_shouldRun = true;
      }
    });
    if (t_shouldRun) {
      for (var j = 0; j < t_evtSet.length; j++) {
        //add the tf to the scene if it is on the runway
        if (t_evtSet[j][1].position.z > (-RUNWAYLENGTH) && t_evtSet[j][1].position.z < GOFRETPOSZ) {

          if (t_evtSet[j][0]) {
            t_evtSet[j][0] = false;
            scene.add(t_evtSet[j][1]);
          }
        }
        //advance tf if it is not past gofret
        if (t_evtSet[j][1].position.z < GOFRETPOSZ) {
          t_evtSet[j][1].position.z += PXPERFRAME;
        }
        //When tf reaches goline, blink and remove
        if (framect == t_evtSet[j][2]) {
          goFretBlink[ptrIX] = framect + 9;
          scene.remove(scene.getObjectByName(t_evtSet[j][1].name));
        }
      }
    }

    ///// SECTION 3 - Cres ------------------------------------------------------- //
    let t_evtSet2;
    let t_shouldRun2 = false;
    partsToRun_sec3eventMatrixCres.forEach((pn_evtSet_ar) => {
      let plrNum = pn_evtSet_ar[0];
      if (ix == plrNum) {
        t_evtSet2 = pn_evtSet_ar[1];
        t_shouldRun2 = true;
      }
    });
    if (t_shouldRun2) {
      for (var j = 0; j < t_evtSet2.length; j++) {
        //add the tf to the scene if it is on the runway
        if (t_evtSet2[j][1].position.z > (-RUNWAYLENGTH) && t_evtSet2[j][1].position.z < GOFRETPOSZ) {
          if (t_evtSet2[j][0]) {
            t_evtSet2[j][0] = false;
            scene.add(t_evtSet2[j][1]);
          }
        }
        //advance tf if it is not past gofret
        if (t_evtSet2[j][1].position.z < (GOFRETPOSZ + t_evtSet2[j][7])) {
          t_evtSet2[j][1].position.z += PXPERFRAME;
        }
        //When tf reaches goline, blink and remove
        if (framect >= Math.round(t_evtSet2[j][2]) && framect < Math.round(t_evtSet2[j][6])) {
          goFretBlink[ptrIX] = framect + 9;
          crvFollowData[ptrIX][0] = true;
          crvFollowData[ptrIX][1] = scale(framect, t_evtSet2[j][2], t_evtSet2[j][6], 0.0, 1.0);
        }

        //end of event remove
        if (framect == t_evtSet2[j][6]) {
          crvFollowData[ptrIX][0] = false;
          scene.remove(scene.getObjectByName(t_evtSet2[j][1].name));
        }
      }
      //crv follow
      // var tnewCresEvent = [true, tcresEventMesh, tGoFrm, tTime, tNumPxTilGo, tiGoPx, tOffFrm, tcresEventLength]; //[gate so tempofret is added to scene only once, mesh, goFrame]
      if (crvFollowData[ptrIX][0]) {
        var tcoordsix = Math.floor(scale(crvFollowData[ptrIX][1], 0.0, 1.0, 0, cresCrvCoords.length));
        //circ
        tcresSvgCirc.setAttributeNS(null, "cx", cresCrvCoords[tcoordsix].x.toString());
        tcresSvgCirc.setAttributeNS(null, "cy", cresCrvCoords[tcoordsix].y.toString());
        //rect
        var temph = notationCanvasH - cresCrvCoords[tcoordsix].y;
        tcresFollowRect.setAttributeNS(null, "y", cresCrvCoords[tcoordsix].y.toString());
        tcresFollowRect.setAttributeNS(null, "height", temph.toString());
      }
    }

    // // // SECTION 3 - Accel
    let t_evtSet3;
    let t_shouldRun3 = false;
    partsToRun_sec3eventMatrixAccel.forEach((pn_evtSet_ar) => {
      let plrNum = pn_evtSet_ar[0];
      if (ix == plrNum) {
        t_evtSet3 = pn_evtSet_ar[1];
        t_shouldRun3 = true;
      }
    });
    if (t_shouldRun3) {
      for (var j = 0; j < t_evtSet3.length; j++) {
        //add the tf to the scene if it is on the runway
        if (t_evtSet3[j][1].position.z > (-RUNWAYLENGTH) && t_evtSet3[j][1].position.z < GOFRETPOSZ) {

          if (t_evtSet3[j][0]) {
            t_evtSet3[j][0] = false;
            scene.add(t_evtSet3[j][1]);
          }
        }
        //advance tf if it is not past gofret
        if (t_evtSet3[j][1].position.z < GOFRETPOSZ) {
          t_evtSet3[j][1].position.z += PXPERFRAME;
        }
        //When tf reaches goline, blink and remove
        if (framect == t_evtSet3[j][2]) {
          goFretBlink[ptrIX] = framect + 9;
          scene.remove(scene.getObjectByName(t_evtSet3[j][1].name));
        }
      }
    }

    // SECTION 4
    for (var j = 0; j < partsToRun_sec4eventMatrix[ptrIX].length; j++) {
      //add the tf to the scene if it is on the runway
      if (partsToRun_sec4eventMatrix[ptrIX][j][1].position.z > (-RUNWAYLENGTH) && partsToRun_sec4eventMatrix[ptrIX][j][1].position.z < GOFRETPOSZ) {
        if (partsToRun_sec4eventMatrix[ptrIX][j][0]) {
          partsToRun_sec4eventMatrix[ptrIX][j][0] = false;
          scene.add(partsToRun_sec4eventMatrix[ptrIX][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (partsToRun_sec4eventMatrix[ptrIX][j][1].position.z < GOFRETPOSZ) {
        partsToRun_sec4eventMatrix[ptrIX][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect == partsToRun_sec4eventMatrix[ptrIX][j][2]) {
        goFretBlink[ptrIX] = framect + 9;
        scene.remove(scene.getObjectByName(partsToRun_sec4eventMatrix[ptrIX][j][1].name));
      }
    }

    // NOTATION --------------------------------------------------------- //
    // Unblink pitch change indicator
    if (framect > pitchUnblinkFrame) {
      notationCvsBgRect.setAttributeNS(null, "stroke-width", "0");
    }
    //REMOVE PREVIOUS NOTATION & REPLACE WITH NEW PITCHES
    for (var i = 1; i < pitchChanges.length; i++) {

      if (pitchChanges[i][1] == framect) {

        //blink Notation Container to indicate pitch change
        notationCvsBgRect.setAttributeNS(null, "stroke-width", "20");
        pitchUnblinkFrame = framect + 40;

        if (ix < 4) {
          for (var l = 0; l < notationCont.children.length; l++) {
            notationCont.removeChild(notationCont.children[l]);
          }
          currentPitches[ptrIX] = parseFloat(pitchChanges[ix][2][0][ptrIX][1]);
          notationObj.currentPitch = currentPitches[ptrIX];
          var timg = notes[0][roundByStep(pitchChanges[i][2][0][ix][1], 0.5)];
          notationCont.appendChild(timg);
        } else if (ix >= 4 && ix < 8) {
          var j = ix - 4;
          for (var l = 0; l < notationCont.children.length; l++) {
            notationCont.removeChild(notationCont.children[l]);
          }
          currentPitches[ptrIX] = parseFloat(pitchChanges[i][2][1][j][1]);
          notationObj.currentPitch = currentPitches[ptrIX];
          var timg = notes[1][roundByStep(pitchChanges[i][2][1][j][1], 0.5)];
          notationCont.appendChild(timg);
        } else if (ix >= 8 && ix < 12) {
          var j = ix - 8;
          for (var l = 0; l < notationCont.children.length; l++) {
            notationCont.removeChild(notationCont.children[l]);
          }
          currentPitches[ptrIX] = parseFloat(pitchChanges[i][2][2][j][1]);
          notationObj.currentPitch = currentPitches[ptrIX];
          var timg = notes[2][roundByStep(pitchChanges[i][2][2][j][1], 0.5)];
          notationCont.appendChild(timg);
        } else if (ix >= 12 && ix < 16) {
          var j = ix - 12;
          for (var l = 0; l < notationCont.children.length; l++) {
            notationCont.removeChild(notationCont.children[l]);
          }
          currentPitches[ptrIX] = parseFloat(pitchChanges[i][2][3][j][1]);
          notationObj.currentPitch = currentPitches[ptrIX];
          var timg = notes[3][roundByStep(pitchChanges[i][2][3][j][1], 0.5)];
          notationCont.appendChild(timg);
        }
      }
    }
    //Move crv followers into frame only when needed
    if (framect == (Math.round((sec2start - 2) * FRAMERATE) + (leadTime * FRAMERATE))) {
      if (sec2addCurveGate) {
        sec2addCurveGate = false;
        tcresSvgCrv.setAttributeNS(null, "transform", "translate( 0, -3)");
        tcresSvgCirc.setAttributeNS(null, "transform", "translate( 0, -3)");
        tcresFollowRect.setAttributeNS(null, "x", '0');
      }
    }
    // Remove curves at end of section 2
    if (framect == (Math.round((sec3StartTime - 3) * FRAMERATE) + (leadTime * FRAMERATE))) {
      if (sec2removeCurveGate) {
        sec2removeCurveGate = false;
        sec3Cres.forEach((cresPartNum) => {
          if (ix != cresPartNum) {
            tcresSvgCrv.setAttributeNS(null, "transform", "translate( 1000, -3)");
            tcresSvgCirc.setAttributeNS(null, "transform", "translate( 1000, -3)");
            tcresFollowRect.setAttributeNS(null, "x", '1000');
          }
        });
      }
    }
    //Move crv followers into frame for sec 3
    if (framect == (Math.round((sec3StartTime - 1) * FRAMERATE) + (leadTime * FRAMERATE))) {
      if (sec3addCurveGate) {
        sec3addCurveGate = false;
        sec3Cres.forEach((cresPartNum) => {
          if (ix == cresPartNum) {
            tcresSvgCrv.setAttributeNS(null, "transform", "translate( 0, -3)");
            tcresSvgCirc.setAttributeNS(null, "transform", "translate( 0, -3)");
            tcresFollowRect.setAttributeNS(null, "x", '0');
          }
        });
      }
    }
    // //Remove rest of curves at end of section 3
    if (framect == (Math.round((sec3EndTime + 5) * FRAMERATE) + (leadTime * FRAMERATE))) {
      if (sec3removeCurveGate) {
        sec3removeCurveGate = false;
        tcresSvgCrv.setAttributeNS(null, "transform", "translate( 1000, -3)");
        tcresSvgCirc.setAttributeNS(null, "transform", "translate( 1000, -3)");
        tcresFollowRect.setAttributeNS(null, "x", '1000');
      }
    }
  }
  // </editor-fold>  END NOTATION OBJECT - ANIMATE END

  // <editor-fold>  <<<< NOTATION OBJECT - SPEED ANIMATE TO NEW START TIME >>>> ------------- //
  notationObj['speedAnimate'] = function() {
    // // SECTION 1
    for (var j = 0; j < partsToRun_eventMatrix[ptrIX].length; j++) {
      //add the tf to the scene if it is on the runway
      if (partsToRun_eventMatrix[ptrIX][j][1].position.z > (-RUNWAYLENGTH) && partsToRun_eventMatrix[ptrIX][j][1].position.z < GOFRETPOSZ) {
        if (partsToRun_eventMatrix[ptrIX][j][0]) {
          partsToRun_eventMatrix[ptrIX][j][0] = false;
          scene.add(partsToRun_eventMatrix[ptrIX][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (partsToRun_eventMatrix[ptrIX][j][1].position.z < GOFRETPOSZ) {
        partsToRun_eventMatrix[ptrIX][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect == partsToRun_eventMatrix[ptrIX][j][2]) {
        goFretBlink[ptrIX] = framect + 9;
        scene.remove(scene.getObjectByName(partsToRun_eventMatrix[ptrIX][j][1].name));
      }
    }
    ///// SECTION 2 ------------------------------------------------------- //
    for (var j = 0; j < partsToRun_sec2eventMatrix[ptrIX].length; j++) {
      //add the tf to the scene if it is on the runway
      if (partsToRun_sec2eventMatrix[ptrIX][j][1].position.z > (-RUNWAYLENGTH) && partsToRun_sec2eventMatrix[ptrIX][j][1].position.z < GOFRETPOSZ) {
        if (partsToRun_sec2eventMatrix[ptrIX][j][0]) {
          partsToRun_sec2eventMatrix[ptrIX][j][0] = false;
          scene.add(partsToRun_sec2eventMatrix[ptrIX][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (partsToRun_sec2eventMatrix[ptrIX][j][1].position.z < (GOFRETPOSZ + partsToRun_sec2eventMatrix[ptrIX][j][7])) {
        partsToRun_sec2eventMatrix[ptrIX][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect >= partsToRun_sec2eventMatrix[ptrIX][j][2] && framect < partsToRun_sec2eventMatrix[ptrIX][j][6]) {
        goFretBlink[ptrIX] = framect + 9;
        crvFollowData[ptrIX][0] = true;
        crvFollowData[ptrIX][1] = scale(framect, partsToRun_sec2eventMatrix[ptrIX][j][2], partsToRun_sec2eventMatrix[ptrIX][j][6], 0.0, 1.0);
      }
      //end of event remove
      if (framect == partsToRun_sec2eventMatrix[ptrIX][j][6]) {
        crvFollowData[ptrIX][0] = false;
        scene.remove(scene.getObjectByName(partsToRun_sec2eventMatrix[ptrIX][j][1].name));
      }
    }
    //crv follow
    // var tnewCresEvent = [true, tcresEventMesh, tGoFrm, tTime, tNumPxTilGo, tiGoPx, tOffFrm, tcresEventLength]; //[gate so tempofret is added to scene only once, mesh, goFrame]
    if (crvFollowData[ptrIX][0]) {
      var tcoordsix = Math.floor(scale(crvFollowData[ptrIX][1], 0.0, 1.0, 0, cresCrvCoords.length));
      //circ
      tcresSvgCirc.setAttributeNS(null, "cx", cresCrvCoords[tcoordsix].x.toString());
      tcresSvgCirc.setAttributeNS(null, "cy", cresCrvCoords[tcoordsix].y.toString());
      //rect
      var temph = notationCanvasH - cresCrvCoords[tcoordsix].y;
      tcresFollowRect.setAttributeNS(null, "y", cresCrvCoords[tcoordsix].y.toString());
      tcresFollowRect.setAttributeNS(null, "height", temph.toString());
    }
    // // SECTION 3 - Hocket
    let t_evtSet;
    let t_shouldRun = false;
    partsToRun_sec3eventMatrixHocket.forEach((pn_evtSet_ar) => {
      let plrNum = pn_evtSet_ar[0];
      if (ix == plrNum) {
        t_evtSet = pn_evtSet_ar[1];
        t_shouldRun = true;
      }
    });
    if (t_shouldRun) {
      for (var j = 0; j < t_evtSet.length; j++) {
        //add the tf to the scene if it is on the runway
        if (t_evtSet[j][1].position.z > (-RUNWAYLENGTH) && t_evtSet[j][1].position.z < GOFRETPOSZ) {

          if (t_evtSet[j][0]) {
            t_evtSet[j][0] = false;
            scene.add(t_evtSet[j][1]);
          }
        }
        //advance tf if it is not past gofret
        if (t_evtSet[j][1].position.z < GOFRETPOSZ) {
          t_evtSet[j][1].position.z += PXPERFRAME;
        }
        //When tf reaches goline, blink and remove
        if (framect == t_evtSet[j][2]) {
          goFretBlink[ptrIX] = framect + 9;
          scene.remove(scene.getObjectByName(t_evtSet[j][1].name));
        }
      }
    }

    ///// SECTION 3 - Cres ------------------------------------------------------- //
    let t_evtSet2;
    let t_shouldRun2 = false;
    partsToRun_sec3eventMatrixCres.forEach((pn_evtSet_ar) => {
      let plrNum = pn_evtSet_ar[0];
      if (ix == plrNum) {
        t_evtSet2 = pn_evtSet_ar[1];
        t_shouldRun2 = true;
      }
    });
    if (t_shouldRun2) {
      for (var j = 0; j < t_evtSet2.length; j++) {
        //add the tf to the scene if it is on the runway
        if (t_evtSet2[j][1].position.z > (-RUNWAYLENGTH) && t_evtSet2[j][1].position.z < GOFRETPOSZ) {
          if (t_evtSet2[j][0]) {
            t_evtSet2[j][0] = false;
            scene.add(t_evtSet2[j][1]);
          }
        }
        //advance tf if it is not past gofret
        if (t_evtSet2[j][1].position.z < (GOFRETPOSZ + t_evtSet2[j][7])) {
          t_evtSet2[j][1].position.z += PXPERFRAME;
        }
        //When tf reaches goline, blink and remove
        if (framect >= Math.round(t_evtSet2[j][2]) && framect < Math.round(t_evtSet2[j][6])) {
          goFretBlink[ptrIX] = framect + 9;
          crvFollowData[ptrIX][0] = true;
          crvFollowData[ptrIX][1] = scale(framect, t_evtSet2[j][2], t_evtSet2[j][6], 0.0, 1.0);
        }

        //end of event remove
        if (framect == t_evtSet2[j][6]) {
          crvFollowData[ptrIX][0] = false;
          scene.remove(scene.getObjectByName(t_evtSet2[j][1].name));
        }
      }
      //crv follow
      // var tnewCresEvent = [true, tcresEventMesh, tGoFrm, tTime, tNumPxTilGo, tiGoPx, tOffFrm, tcresEventLength]; //[gate so tempofret is added to scene only once, mesh, goFrame]
      if (crvFollowData[ptrIX][0]) {
        var tcoordsix = Math.floor(scale(crvFollowData[ptrIX][1], 0.0, 1.0, 0, cresCrvCoords.length));
        //circ
        tcresSvgCirc.setAttributeNS(null, "cx", cresCrvCoords[tcoordsix].x.toString());
        tcresSvgCirc.setAttributeNS(null, "cy", cresCrvCoords[tcoordsix].y.toString());
        //rect
        var temph = notationCanvasH - cresCrvCoords[tcoordsix].y;
        tcresFollowRect.setAttributeNS(null, "y", cresCrvCoords[tcoordsix].y.toString());
        tcresFollowRect.setAttributeNS(null, "height", temph.toString());
      }
    }

    // // // SECTION 3 - Accel
    let t_evtSet3;
    let t_shouldRun3 = false;
    partsToRun_sec3eventMatrixAccel.forEach((pn_evtSet_ar) => {
      let plrNum = pn_evtSet_ar[0];
      if (ix == plrNum) {
        t_evtSet3 = pn_evtSet_ar[1];
        t_shouldRun3 = true;
      }
    });
    if (t_shouldRun3) {
      for (var j = 0; j < t_evtSet3.length; j++) {
        //add the tf to the scene if it is on the runway
        if (t_evtSet3[j][1].position.z > (-RUNWAYLENGTH) && t_evtSet3[j][1].position.z < GOFRETPOSZ) {

          if (t_evtSet3[j][0]) {
            t_evtSet3[j][0] = false;
            scene.add(t_evtSet3[j][1]);
          }
        }
        //advance tf if it is not past gofret
        if (t_evtSet3[j][1].position.z < GOFRETPOSZ) {
          t_evtSet3[j][1].position.z += PXPERFRAME;
        }
        //When tf reaches goline, blink and remove
        if (framect == t_evtSet3[j][2]) {
          goFretBlink[ptrIX] = framect + 9;
          scene.remove(scene.getObjectByName(t_evtSet3[j][1].name));
        }
      }
    }

    // SECTION 4
    for (var j = 0; j < partsToRun_sec4eventMatrix[ptrIX].length; j++) {
      //add the tf to the scene if it is on the runway
      if (partsToRun_sec4eventMatrix[ptrIX][j][1].position.z > (-RUNWAYLENGTH) && partsToRun_sec4eventMatrix[ptrIX][j][1].position.z < GOFRETPOSZ) {
        if (partsToRun_sec4eventMatrix[ptrIX][j][0]) {
          partsToRun_sec4eventMatrix[ptrIX][j][0] = false;
          scene.add(partsToRun_sec4eventMatrix[ptrIX][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (partsToRun_sec4eventMatrix[ptrIX][j][1].position.z < GOFRETPOSZ) {
        partsToRun_sec4eventMatrix[ptrIX][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect == partsToRun_sec4eventMatrix[ptrIX][j][2]) {
        goFretBlink[ptrIX] = framect + 9;
        scene.remove(scene.getObjectByName(partsToRun_sec4eventMatrix[ptrIX][j][1].name));
      }
    }

    // NOTATION --------------------------------------------------------- //
    // Unblink pitch change indicator
    if (framect > pitchUnblinkFrame) {
      notationCvsBgRect.setAttributeNS(null, "stroke-width", "0");
    }
    //REMOVE PREVIOUS NOTATION & REPLACE WITH NEW PITCHES
    for (var i = 1; i < pitchChanges.length; i++) {

      if (pitchChanges[i][1] == framect) {

        //blink Notation Container to indicate pitch change
        notationCvsBgRect.setAttributeNS(null, "stroke-width", "20");
        pitchUnblinkFrame = framect + 40;

        if (ix < 4) {
          for (var l = 0; l < notationCont.children.length; l++) {
            notationCont.removeChild(notationCont.children[l]);
          }
          currentPitches[ptrIX] = parseFloat(pitchChanges[ix][2][0][ptrIX][1]);
          notationObj.currentPitch = currentPitches[ptrIX];
          var timg = notes[0][roundByStep(pitchChanges[i][2][0][ix][1], 0.5)];
          notationCont.appendChild(timg);
        } else if (ix >= 4 && ix < 8) {
          var j = ix - 4;
          for (var l = 0; l < notationCont.children.length; l++) {
            notationCont.removeChild(notationCont.children[l]);
          }
          currentPitches[ptrIX] = parseFloat(pitchChanges[i][2][1][j][1]);
          notationObj.currentPitch = currentPitches[ptrIX];
          var timg = notes[1][roundByStep(pitchChanges[i][2][1][j][1], 0.5)];
          notationCont.appendChild(timg);
        } else if (ix >= 8 && ix < 12) {
          var j = ix - 8;
          for (var l = 0; l < notationCont.children.length; l++) {
            notationCont.removeChild(notationCont.children[l]);
          }
          currentPitches[ptrIX] = parseFloat(pitchChanges[i][2][2][j][1]);
          notationObj.currentPitch = currentPitches[ptrIX];
          var timg = notes[2][roundByStep(pitchChanges[i][2][2][j][1], 0.5)];
          notationCont.appendChild(timg);
        } else if (ix >= 12 && ix < 16) {
          var j = ix - 12;
          for (var l = 0; l < notationCont.children.length; l++) {
            notationCont.removeChild(notationCont.children[l]);
          }
          currentPitches[ptrIX] = parseFloat(pitchChanges[i][2][3][j][1]);
          notationObj.currentPitch = currentPitches[ptrIX];
          var timg = notes[3][roundByStep(pitchChanges[i][2][3][j][1], 0.5)];
          notationCont.appendChild(timg);
        }
      }
    }
    //Move crv followers into frame only when needed
    if (framect == (Math.round((sec2start - 2) * FRAMERATE) + (leadTime * FRAMERATE))) {
      if (sec2addCurveGate) {
        sec2addCurveGate = false;
        tcresSvgCrv.setAttributeNS(null, "transform", "translate( 0, -3)");
        tcresSvgCirc.setAttributeNS(null, "transform", "translate( 0, -3)");
        tcresFollowRect.setAttributeNS(null, "x", '0');
      }
    }
    // Remove curves at end of section 2
    if (framect == (Math.round((sec3StartTime - 3) * FRAMERATE) + (leadTime * FRAMERATE))) {
      if (sec2removeCurveGate) {
        sec2removeCurveGate = false;
        sec3Cres.forEach((cresPartNum) => {
          if (ix != cresPartNum) {
            tcresSvgCrv.setAttributeNS(null, "transform", "translate( 1000, -3)");
            tcresSvgCirc.setAttributeNS(null, "transform", "translate( 1000, -3)");
            tcresFollowRect.setAttributeNS(null, "x", '1000');
          }
        });
      }
    }
    //Move crv followers into frame for sec 3
    if (framect == (Math.round((sec3StartTime - 1) * FRAMERATE) + (leadTime * FRAMERATE))) {
      if (sec3addCurveGate) {
        sec3addCurveGate = false;
        sec3Cres.forEach((cresPartNum) => {
          if (ix == cresPartNum) {
            tcresSvgCrv.setAttributeNS(null, "transform", "translate( 0, -3)");
            tcresSvgCirc.setAttributeNS(null, "transform", "translate( 0, -3)");
            tcresFollowRect.setAttributeNS(null, "x", '0');
          }
        });
      }
    }
    // //Remove rest of curves at end of section 3
    if (framect == (Math.round((sec3EndTime + 5) * FRAMERATE) + (leadTime * FRAMERATE))) {
      if (sec3removeCurveGate) {
        sec3removeCurveGate = false;
        tcresSvgCrv.setAttributeNS(null, "transform", "translate( 1000, -3)");
        tcresSvgCirc.setAttributeNS(null, "transform", "translate( 1000, -3)");
        tcresFollowRect.setAttributeNS(null, "x", '1000');
      }
    }
  }
  // </editor-fold>  END NOTATION OBJECT - SPEED ANIMATE END
  // RENDER /////////////////////////////////////////////
  renderer.render(scene, camera);
  return notationObj;
}
// </editor-fold> <<<< END NOTATION OBJECT >>>> ---------------------------- //

//<editor-fold> << CONTROL PANEL >> ---------------------------------------- //
function mkCtrlPanel_ctrl(id, w, h, title, posArr, headerSize) {
  let panelObj = mkCtrlPanel(id, w, h, title, posArr, headerSize);
  let panel = panelObj.panel;
  let canvas = panelObj.canvas;
  let btnW = w - 15;
  let btnH = 36;
  //<editor-fold>  < CONTROL PANEL - START BUTTON >        //
  let startBtnFunc = function() {
    if (startBtn_isActive) {
      let tsNow_Date = new Date(TS.now());
      let absStartTime = tsNow_Date.getTime();
      SOCKET.emit('pitl_startpiece', {});
    }
  }
  let startBtn = mkButton(canvas, id + 'startbtn', btnW, btnH, 0, 0, 'Start', 12, startBtnFunc);
  panelObj['startBtn'] = startBtn;

  //</editor-fold> END START BUTTON END
  //<editor-fold>  < CONTROL PANEL - SET START TIME >      //
  var timeInputClickFunc = function() {
    timeField.focus();
    timeField.select();
  }
  var timeInputKeyupFunc = function(e) {
    if (e.keyCode === 13) {
      if (startBtn_isActive) {
        var newStartTime = parseFloat(timeField.value);
        SOCKET.emit('pitl_startTime', {
          newStartTime: newStartTime,
        });
      }
    }
  }
  var timeFieldID = id + 'timeinput';
  var timeField = mkInputField(canvas, timeFieldID, btnW - 14, 10, 65, 10, 'black', 14, timeInputClickFunc, timeInputKeyupFunc);
  panelObj['timeField'] = timeField;
  var timeFieldLbl = mkLabel2(canvas, id + 'timeFieldLbl', timeFieldID, btnW, 13, 18, 10, 'Time Sec:', 11, 'white');




  //</editor-fold> END SET START TIME END
  //<editor-fold>  < CONTROL PANEL - PAUSE BUTTON >        //
  let pauseBtnFunc = function() {
    if (pauseBtn_isActive) {
      pauseState = (pauseState + 1) % 2;
      let tsNow_Date = new Date(TS.now());
      let pauseTime = tsNow_Date.getTime()
      if (pauseState == 1) { //Paused
        SOCKET.emit('pitl_pause', {
          pauseState: pauseState,
          pauseTime: pauseTime
        });
      } else if (pauseState == 0) { //unpaused
        let globalPauseTime = pauseTime - pausedTime;
        SOCKET.emit('pitl_pause', {
          pauseState: pauseState,
          pauseTime: globalPauseTime
        });
      }
    }
  }
  let pauseBtn = mkButton(canvas, id + 'pausebtn', btnW, btnH, 81, 0, 'Pause', 12, pauseBtnFunc);
  panelObj['pauseBtn'] = pauseBtn;
  pauseBtn.className = 'btn btn-1_inactive';

  //</editor-fold> END PAUSE BUTTON END
  //<editor-fold>  < CONTROL PANEL - STOP BUTTON >         //
  let stopBtnFunc = function() {
    if (stopBtn_isActive) {
      SOCKET.emit('pitl_stop', {});
    }
  }
  let stopBtn = mkButton(canvas, id + 'stopbtn', btnW, btnH, 81 + btnH + 10, 0, 'stop', 12, stopBtnFunc);
  stopBtn.className = 'btn btn-1_inactive';
  panelObj['stopBtn'] = stopBtn;

  //</editor-fold> END STOP BUTTON END
  //<editor-fold>  < CONTROL PANEL - READY INDICATORS >         //
  for (let i = 0; i < 16; i++) {
    let btnX;
    if (i < 8) {
      btnX = 0
    } else {
      btnX = 37
    }
    let t_btn = mkButton(canvas, 'readyBtn' + i.toString(), 33, 27, 177 + (40 * (i % 8)), btnX, 'P' + i.toString(), 11, function() {});
    t_btn.className = 'btn btn-ind_off';
    readyBtns.push(t_btn);
  }
  //</editor-fold> END READY INDICATORS END
  return panelObj;
}
//</editor-fold> >> CONTROL PANEL  ////////////////////////////////////////////



//<editor-fold> << SOCKET IO >> -------------------------------------------- //
// SOCKET IO - START PIECE ------ >
SOCKET.on('pitl_startpiecebroadcast', function(data) {
  if (piece_canStart) {
    piece_canStart = false;
    startBtn_isActive = false;
    stopBtn_isActive = true;
    pauseBtn_isActive = true;
    animation_isGo = true;
    if (makeControlPanel) {
      scoreCtrlPanel.stopBtn.className = 'btn btn-1';
      scoreCtrlPanel.startBtn.className = 'btn btn-1_inactive';
      scoreCtrlPanel.pauseBtn.className = 'btn btn-1';
      scoreCtrlPanel.panel.smallify();
    }
    startPiece();
  }
});

// SOCKET IO - SET START TIME --- >
SOCKET.on('pitl_startTimeBroadcast', function(data) {
  // SPEED ANIMATE ---------------------- >
  let newStartTime = data.newStartTime + leadTime;
  clockAdj = newStartTime;
  var newFrameCt = Math.round(newStartTime * FRAMERATE);
  framect = newFrameCt;


  //Are Curves on scene?
  if (newStartTime >= sec2start && newStartTime < endSec2Time) { //curves are on scene
    notationObjects.forEach((no, noix) => {
      no.crv.setAttributeNS(null, "transform", "translate( 0, -3)");
      no.crvFollowCirc.setAttributeNS(null, "transform", "translate( 0, -3)");
      no.crvFollowRect.setAttributeNS(null, "x", '0');
    });
  } else if (newStartTime >= sec3StartTime && newStartTime < sec3EndTime) { //some curves are on scene
    sec3Cres.forEach((sec3CresPartNum) => {
      notationObjects.forEach((no, noix) => {
        if (sec3CresPartNum == no.ix) {
          no.crv.setAttributeNS(null, "transform", "translate( 0, -3)");
          no.crvFollowCirc.setAttributeNS(null, "transform", "translate( 0, -3)");
          no.crvFollowRect.setAttributeNS(null, "x", '0');
        }
      });
    });
  } else { //curves are off scene
    notationObjects.forEach((no, noix) => {
      no.crv.setAttributeNS(null, "transform", "translate( 1000, -3)");
      no.crvFollowCirc.setAttributeNS(null, "transform", "translate(1000, -3)");
      no.crvFollowRect.setAttributeNS(null, "x", '1000');
    });
  }




  for (let i = 0; i < newFrameCt; i++) {
    notationObjects.forEach(function(objToAnimate, ix) {
      objToAnimate.speedAnimate();
    });
  }
  if (makeControlPanel) scoreCtrlPanel.timeField.disabled = 'true';

});


// SOCKET IO - PAUSE BROADCAST -- >
SOCKET.on('pitl_pauseBroadcast', function(data) {
  pauseState = data.pauseState;
  if (pauseState == 0) { //unpaused
    pieceTimeAdjustment = data.pauseTime + pieceTimeAdjustment;
    if (makeControlPanel) {
      scoreCtrlPanel.pauseBtn.innerText = 'Pause';
      scoreCtrlPanel.pauseBtn.className = 'btn btn-1';
      scoreCtrlPanel.panel.smallify();
    }
    animation_isGo = true;
    requestAnimationFrame(animationEngine);
  } else if (pauseState == 1) { //paused
    pausedTime = data.pauseTime
    animation_isGo = false;
    if (makeControlPanel) {
      scoreCtrlPanel.pauseBtn.innerText = 'Resume';
      scoreCtrlPanel.pauseBtn.className = 'btn btn-2';
    }
  }
});

// SOCKET IO - STOP ------------- >
SOCKET.on('pitl_stopBroadcast', function(data) {
  location.reload();
});

// SOCKET IO - READY BUTTONS ------------- >
SOCKET.on('pitl_readyBroadcast', function(data) {
  let playerNumReady = data.playerNumReady;
  if (makeControlPanel) {
    readyBtns[playerNumReady].className = 'btn btn-ind_on';
  };
});



//</editor-fold>  > END SOCKET IO  ////////////////////////////////////////////

//<editor-fold> << FUNC TO LOAD INITIAL NOTATION FOR ALL PARTS  >> --------- //
// var ranges = [[40, 60],[48, 67],[53, 74],[60, 81]];
//Load All pitch SVGs here
//Each section btas has its own pitch svg dictionary
function loadNotationSVGsPerSection() {
  var notesForEachPart = [];
  // This loads the pitch SVGs for all of the pitches in the notesMidiDict
  // They are visible but not appended to the notation container
  for (var i = 0; i < 4; i++) {
    var notesDict = {};
    for (const [key, value] of Object.entries(notesMidiDict)) {
      var tnote = document.createElementNS(SVG_NS, "image");
      tnote.setAttributeNS(svgXlink, 'xlink:href', value);
      tnote.setAttributeNS(null, 'width', GOFRETWIDTH.toString());
      tnote.setAttributeNS(null, 'height', notationCanvasH.toString());
      tnote.setAttributeNS(null, 'visibility', 'visible');
      notesDict[key] = tnote;
    }
    notesForEachPart.push(notesDict);
  }
  return notesForEachPart;
}

function loadInitialNotation(playerNum) {
  // pitchChanges = [] - [ time, frame, [ partsArrays ] ] - [ [b],[t],[a][s] ] - [ [b/t/a/s-1],[b/t/a/s-2],[b/t/a/s-3], [b/t/a/s-4] ] - [hz, midi, relAmp]
  let t_pitchCont;

  pitchContainerDOMs.forEach((pcAr) => {
    let t_pn = pcAr[0];
    if (playerNum == t_pn) {
      t_pitchCont = pcAr[1];
    }
  });
  // BASSES
  if (playerNum < 4) {
    var timg = notes[0][roundByStep(pitchChanges[0][2][0][playerNum][1], 0.5)];
    t_pitchCont.appendChild(timg);
    let tar = [];
    tar.push(playerNum);
    tar.push(parseFloat(pitchChanges[0][2][0][playerNum][1]));
    currentPitches.push(tar);
  }
  // TENORS
  if (playerNum >= 4 && playerNum < 8) {
    let numInSection = playerNum - 4;
    var timg = notes[1][roundByStep(pitchChanges[0][2][1][numInSection][1], 0.5)];
    t_pitchCont.appendChild(timg);
    let tar = [];
    tar.push(playerNum);
    tar.push(parseFloat(pitchChanges[0][2][1][numInSection][1]));
    currentPitches.push(tar);
  }
  // ALTOS
  if (playerNum >= 8 && playerNum < 12) {
    let numInSection = playerNum - 8;
    var timg = notes[2][roundByStep(pitchChanges[0][2][2][numInSection][1], 0.5)];
    t_pitchCont.appendChild(timg);
    let tar = [];
    tar.push(playerNum);
    tar.push(parseFloat(pitchChanges[0][2][2][numInSection][1]));
    currentPitches.push(tar);
  }
  // SOPRANOS
  if (playerNum >= 12 && playerNum < 16) {
    let numInSection = playerNum - 12;
    var timg = notes[3][roundByStep(pitchChanges[0][2][3][numInSection][1], 0.5)];
    t_pitchCont.appendChild(timg);
    let tar = [];
    tar.push(playerNum);
    tar.push(parseFloat(pitchChanges[0][2][3][numInSection][1]));
    currentPitches.push(tar);
  }

}
//</editor-fold> >> END FUNC TO LOAD INITIAL NOTATION FOR ALL PARTS END  //////

//<editor-fold> << GENERATE EVENT MATRICES FROM SCORE DATA FUNCS  >> ------- //
//FLATTEN EVENTS INTO ONE ARRAY PER PERFORMER
function mkEventMatrixSec1_singlePart(partNum) {
  var tEventMatrix = [];
  var tempoFretIx = 0;
  var tTempoFretSet = [];
  for (var j = 0; j < timeCodeByPart[partNum].length; j++) {
    for (var k = 0; k < timeCodeByPart[partNum][j].length; k++) {
      var tTimeGopxGoFrm = [];
      var tTime = timeCodeByPart[partNum][j][k];
      tTime = tTime + leadTime;
      var tNumPxTilGo = tTime * PXPERSEC;
      var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
      var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
      // var tGoFrm = Math.round(tTime * FRAMERATE);
      var tempMatl = new THREE.MeshLambertMaterial({
        color: fretClr[j % 2]
      });
      var tempTempoFret = new THREE.Mesh(tempoFretGeom, tempMatl);
      tempTempoFret.position.z = tiGoPx;
      tempTempoFret.position.y = GOFRETHEIGHT;
      tempTempoFret.position.x = 0;
      tempTempoFret.name = "tempofret" + tempoFretIx;
      tempoFretIx++;
      var newTempoFret = [true, tempTempoFret, tGoFrm, tTime, tNumPxTilGo, tiGoPx]; //[gate so tempofret is added to scene only once, mesh, goFrame]
      tTempoFretSet.push(newTempoFret);
    }
  }
  return tTempoFretSet;
}
// FUNCTION: mkEventSection ------------------------------------------- //
//FLATTEN EVENTS INTO ONE ARRAY PER PERFORMER
function mkEventMatrixSec2_singlePart(partNum) {
  var teventMeshIx = 0;
  var tcresEventSet = [];
  for (var j = 0; j < sec2TimeCodeByPart[partNum].length; j++) {
    var tTimeGopxGoFrm = [];
    var tTime = sec2TimeCodeByPart[partNum][j];
    tTime = tTime + leadTime;
    var tNumPxTilGo = tTime * PXPERSEC;
    var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
    var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
    var tempMatl = new THREE.MeshLambertMaterial({
      color: fretClr[j % 2]
    });
    var tcresEventLength = cresDurs[partNum] * PXPERSEC;
    var teventdurframes = Math.round(cresDurs[partNum] * FRAMERATE);
    var tOffFrm = tGoFrm + teventdurframes;
    var tcresEventGeom = new THREE.CubeGeometry(50, GOFRETHEIGHT + 5, tcresEventLength);
    var tcresEventMesh = new THREE.Mesh(tcresEventGeom, tempMatl);
    tcresEventMesh.position.z = tiGoPx - (tcresEventLength / 2.0);
    tcresEventMesh.position.y = GOFRETHEIGHT;
    tcresEventMesh.position.x = 0;
    tcresEventMesh.name = "cresEvent" + teventMeshIx;
    teventMeshIx++;
    var tnewCresEvent = [true, tcresEventMesh, tGoFrm, tTime, tNumPxTilGo, tiGoPx, tOffFrm, tcresEventLength]; //[gate so tempofret is added to scene only once, mesh, goFrame]
    tcresEventSet.push(tnewCresEvent);
  }
  return tcresEventSet;
}
// FUNCTION: mkEventMatrixSec3 ------------------------------------------- //
function mkEventMatrixSec3Hocket_singlePart(partNum) {
  var tempoFretIx = 0;
  var tTempoFretSet = [];
  let sec3HocketTimeCodeIXtoRun;
  sec3HocketPlayers.forEach((hp, ix) => {
    if (hp = partNum) {
      sec3HocketTimeCodeIXtoRun = ix;
    }
  });

  for (var j = 0; j < sec3HocketTimeCode[sec3HocketTimeCodeIXtoRun].length; j++) {
    for (var k = 0; k < sec3HocketTimeCode[sec3HocketTimeCodeIXtoRun][j].length; k++) {
      var tTimeGopxGoFrm = [];
      var tTime = sec3HocketTimeCode[sec3HocketTimeCodeIXtoRun][j][k];
      tTime = tTime + leadTime;
      var tNumPxTilGo = tTime * PXPERSEC;
      var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
      var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
      var tempMatl = new THREE.MeshLambertMaterial({
        color: fretClr[j % 2]
      });
      var tempSec3HocketFret = new THREE.Mesh(tempoFretGeom, tempMatl);
      tempSec3HocketFret.position.z = tiGoPx;
      tempSec3HocketFret.position.y = GOFRETHEIGHT;
      tempSec3HocketFret.position.x = 0;
      tempSec3HocketFret.name = "tempofret" + tempoFretIx;
      tempoFretIx++;
      var tnewTempoFret = [true, tempSec3HocketFret, tGoFrm, tTime, tNumPxTilGo, tiGoPx]; //[gate so tempofret is added to scene only once, mesh, goFrame]
      tTempoFretSet.push(tnewTempoFret);
    }
  }
  return tTempoFretSet;
}
// FUNCTION: mkEventSection ------------------------------------------- //
function mkEventMatrixSec3Cres_singlePart(partNum) {
  var teventMeshIx = 0;
  var tcresEventSet = [];
  let sec3CresTimeCodeByPartIXtoRun;
  sec3Cres.forEach((pn, ix) => {
    if (pn == partNum) {
      sec3CresTimeCodeByPartIXtoRun = ix;
    }
  });
  for (var j = 0; j < sec3CresTimeCodeByPart[sec3CresTimeCodeByPartIXtoRun].length; j++) {
    var tTimeGopxGoFrm = [];
    var tTime = sec3CresTimeCodeByPart[sec3CresTimeCodeByPartIXtoRun][j];
    tTime = tTime + leadTime;
    var tNumPxTilGo = tTime * PXPERSEC;
    var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
    var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
    var tempMatl = new THREE.MeshLambertMaterial({
      color: fretClr[j % 2]
    });
    var tcresEventLength = cresDurs[partNum] * PXPERSEC;
    var teventdurframes = Math.round(cresDurs[partNum] * FRAMERATE);
    var tOffFrm = tGoFrm + teventdurframes;
    var tcresEventGeom = new THREE.CubeGeometry(50, GOFRETHEIGHT + 5, tcresEventLength);
    var tcresEventMesh = new THREE.Mesh(tcresEventGeom, tempMatl);
    tcresEventMesh.position.z = tiGoPx - (tcresEventLength / 2.0);
    tcresEventMesh.position.y = GOFRETHEIGHT;
    tcresEventMesh.position.x = 0;
    tcresEventMesh.name = "sec3CresEvent" + teventMeshIx;
    teventMeshIx++;
    var tnewCresEvent = [true, tcresEventMesh, tGoFrm, tTime, tNumPxTilGo, tiGoPx, tOffFrm, tcresEventLength]; //[gate so tempofret is added to scene only once, mesh, goFrame]
    tcresEventSet.push(tnewCresEvent);
  }
  return tcresEventSet;
}
// FUNCTION: mkEventMatrixSec3 ------------------------------------------- //
function mkEventMatrixSec3Accel_singlePart(partNum) {
  var tempoFretIx = 0;
  var tTempoFretSet = [];
  let sec3AccelTimeCodeIXtoRun;
  sec3Accel.forEach((pn, ix) => {
    if (pn = partNum) {
      sec3AccelTimeCodeIXtoRun = ix;
    }
  });
  for (var j = 0; j < sec3AccelTimeCode[sec3AccelTimeCodeIXtoRun].length; j++) {
    for (var k = 0; k < sec3AccelTimeCode[sec3AccelTimeCodeIXtoRun][j].length; k++) {
      var tTimeGopxGoFrm = [];
      var tTime = sec3AccelTimeCode[sec3AccelTimeCodeIXtoRun][j][k];
      tTime = tTime + leadTime;
      var tNumPxTilGo = tTime * PXPERSEC;
      var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
      var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
      var tempMatl = new THREE.MeshLambertMaterial({
        color: fretClr[j % 2]
      });
      var tempSec3HocketFret = new THREE.Mesh(tempoFretGeom, tempMatl);
      tempSec3HocketFret.position.z = tiGoPx;
      tempSec3HocketFret.position.y = GOFRETHEIGHT;
      tempSec3HocketFret.position.x = 0;
      tempSec3HocketFret.name = "sec3AccelFret" + tempoFretIx;
      tempoFretIx++;
      var tnewTempoFret = [true, tempSec3HocketFret, tGoFrm, tTime, tNumPxTilGo, tiGoPx]; //[gate so tempofret is added to scene only once, mesh, goFrame]
      tTempoFretSet.push(tnewTempoFret);
    }
  }

  return tTempoFretSet;
}
// FUNCTION: mkEventMatrixSec4 ------------------------------------------- //
function mkEventMatrixSec4_singlePart(partNum) {
  var tempoFretIx = 0;
  var tTempoFretSet = [];
  for (var j = 0; j < sec4TimeCode[partNum].length; j++) {
    var tTimeGopxGoFrm = [];
    var tTime = sec4TimeCode[partNum][j];
    tTime = tTime + leadTime;
    var tNumPxTilGo = tTime * PXPERSEC;
    var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
    var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
    var tempMatl = new THREE.MeshLambertMaterial({
      color: fretClr[0]
    });
    var tempSec3HocketFret = new THREE.Mesh(tempoFretGeom, tempMatl);
    tempSec3HocketFret.position.z = tiGoPx;
    tempSec3HocketFret.position.y = GOFRETHEIGHT;
    tempSec3HocketFret.position.x = 0;
    tempSec3HocketFret.name = "sec4Fret" + tempoFretIx;
    tempoFretIx++;
    var tnewTempoFret = [true, tempSec3HocketFret, tGoFrm, tTime, tNumPxTilGo, tiGoPx]; //[gate so tempofret is added to scene only once, mesh, goFrame]
    tTempoFretSet.push(tnewTempoFret);

  }
  return tTempoFretSet;
}
//</editor-fold> >> END GENERATE EVENT MATRICES FROM SCORE DATA FUNCS END  ////

//<editor-fold> << ANIMATION ENGINE >> ------------------------------------- //
//<editor-fold>  < ANIMATION ENGINE - ENGINE >           //
function animationEngine(timestamp) {
  var t_now = new Date(TS.now());
  t_lt = t_now.getTime() - pieceTimeAdjustment;
  calcDisplayClock(t_lt);
  delta += t_lt - lastFrameTimeMs;
  lastFrameTimeMs = t_lt;
  while (delta >= MSPERFRAME) {
    update(MSPERFRAME, t_lt);
    draw();
    delta -= MSPERFRAME;
  }
  if (animation_isGo) requestAnimationFrame(animationEngine);
}
//</editor-fold> END ANIMATION ENGINE - ENGINE END
//<editor-fold>  < ANIMATION ENGINE - UPDATE >           //
function update(aMSPERFRAME, currTimeMS) {
  framect++;
  // ANIMATE ---------------------- >
  notationObjects.forEach(function(objToAnimate, ix) {
    objToAnimate.animate();
  });
}
//</editor-fold> END ANIMATION ENGINE - UPDATE END
//<editor-fold>  < ANIMATION ENGINE - DRAW >             //
function draw() {
  // GO FRET BLINK TIMER ///////////////////////////////////
  partsToRun.forEach((numPartToRun, ptrIX) => {
    if (framect <= goFretBlink[ptrIX]) {
      goFrets[ptrIX][0].material.color = clr_safetyOrange;
      goFrets[ptrIX][0].geometry = goFretBigGeom;
    } else {
      goFrets[ptrIX][0].material.color = clr_neonGreen;
      goFrets[ptrIX][0].geometry = goFretGeom;
    }
  });
  // RENDER ----------------------- >
  notationObjects.forEach(function(objToRender, ix) {
    objToRender.renderer.render(objToRender.scene, objToRender.camera);
  });
}
//</editor-fold> END ANIMATION ENGINE - DRAW END    //
//</editor-fold>  > END ANIMATION ENGINE  /////////////////////////////////////

//<editor-fold>   < UTILITIES - CLOCK >                  //
let displayClock_div = mkCanvasDiv('displayClock_div', 65, 20, 'yellow');
let displayClock_panel = mkClockPanel(displayClock_div, 'left-bottom');
displayClock_panel.smallify();

function calcDisplayClock(pieceEpochTime) {
  let pieceTimeMS = pieceEpochTime - pieceStartTime_epochTime + (clockAdj * 1000);
  displayClock_TimeMS = pieceTimeMS % 1000;
  displayClock_TimeSec = Math.floor(pieceTimeMS / 1000) % 60;
  displayClock_TimeMin = Math.floor(pieceTimeMS / 60000) % 60;
  displayClock_TimeHrs = Math.floor(pieceTimeMS / 3600000);
  displayClock_div.innerHTML = pad(displayClock_TimeHrs, 2) + ":" + pad(displayClock_TimeMin, 2) + ":" + pad(displayClock_TimeSec, 2);
}
//</editor-fold> END UTILITIES - CLOCK END









/////
