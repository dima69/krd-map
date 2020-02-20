const debug = require('debug')('krd-map-node:server');
const http = require('http');
const webSocket = require('ws');

const express = require('express');
const path = require('path');
const logger = require('morgan');
const redis = require('redis');

const indexRouter = require('./routes/index');
const apiRouter = require('./api/routes/api');

const backgroundWorker = require('./background_work/worker');

const redisSub = redis.createClient();
const redisClient = redis.createClient();

const port = process.env.PORT || '8000';
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('json spaces', 2);
app.set('port', port);

app.use('/', indexRouter);
app.use('/api', apiRouter);

const server = http.createServer(app);
const wss = new webSocket.Server({ server });

let wsClientsCount = 0;

backgroundWorker();

// IN WSS
// IF ANY CLIENTS CONNECTED
//    CHECK IF JOB.RUNNING ELSE PASS
// IF CLIENTS 0 THEN DELETE JOB
wss.on('connection', (ws, req) => {
  wsClientsCount += 1;
  console.log(`current websocket clients: ${wsClientsCount}`);
  ws.on('message', (data) => {
    console.log(data);
    const msg = JSON.parse(data);
    switch (msg.type) {
      case 'transferData':
        redisClient.get('latest_data', (err, reply) => {
          // reply is null when the key is missing
          if (reply) {
            ws.send(reply);
          }
        });
        break;
      case 'report':
        // @@@ handle reports from clients
        break;
      default:
        break;
    }
  });
  ws.on('close', (code, reason) => {
    wsClientsCount -= 1;
    console.log(`current websocket clients count: ${wsClientsCount}`);
  });
});

redisSub.subscribe('vehiclesdata');
redisSub.on('message', (channel, msg) => {
  wss.clients.forEach((client) => {
    client.send(msg);
  });
});

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string'
    ? `Pipe ${port}`
    : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

module.exports = app;
