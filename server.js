var express = require('express');
var app = express();
var path = require('path');
var timesyncServer = require('timesync/server');
var server = require('http').createServer(app);
io = require('socket.io').listen(server);
const fs = require('fs');
const PORT = process.env.PORT || 5000
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/private')));
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});
server.listen(PORT, () => console.log(`Listening on ${ PORT }`));
// TIMESYNC SERVER -------------- >
app.use('/timesync', timesyncServer.requestHandler);
//<editor-fold> << SOCKET IO >> -------------------------------------------- //
io.on('connection', function(socket) {
  //<editor-fold> << pitl >> --------------------------------------------- //
  //<editor-fold>  < START PIECE >                         //
  socket.on('pitl_startpiece', function(data) {
    socket.broadcast.emit('pitl_startpiecebroadcast', {});
    socket.emit('pitl_startpiecebroadcast', {});
  });
  //</editor-fold> END START PIECE END
  //<editor-fold>  < START TIME >                          //
  socket.on('pitl_startTime', function(data) {
    var newStartTime = data.newStartTime;
    socket.broadcast.emit('pitl_startTimeBroadcast', {
      newStartTime: newStartTime
    });
    socket.emit('pitl_startTimeBroadcast', {
      newStartTime: newStartTime
    });
  });
  //</editor-fold> END START TIME END
  //<editor-fold>  < STOP >                                //
  socket.on('pitl_stop', function(data) {
    socket.emit('pitl_stopBroadcast', {});
    socket.broadcast.emit('pitl_stopBroadcast', {});
  });
  //</editor-fold> END STOP END
  //<editor-fold>  < PAUSE >                               //
  socket.on('pitl_pause', function(data) {
    socket.emit('pitl_pauseBroadcast', {
      pauseState: data.pauseState,
      pauseTime: data.pauseTime
    });
    socket.broadcast.emit('pitl_pauseBroadcast', {
      pauseState: data.pauseState,
      pauseTime: data.pauseTime
    });
  });
  //</editor-fold> END PAUSE END
  //<editor-fold>  < READY >                               //
  socket.on('pitl_ready', function(data) {
    socket.emit('pitl_readyBroadcast', {
      playerNumReady: data.playerNumReady,
    });
    socket.broadcast.emit('pitl_readyBroadcast', {
      playerNumReady: data.playerNumReady,
    });
  });
  //</editor-fold> END READY END

  //</editor-fold> >> END pitl END  //////////////////////////////////////////
}); // End Socket IO
//</editor-fold> >> END SOCKET IO END  ////////////////////////////////////////
