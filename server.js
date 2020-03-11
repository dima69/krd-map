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

wss.on('connection', (ws, req) => {
  wsClientsCount += 1;
  console.log(`current websocket clients: ${wsClientsCount}`);
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    switch (msg.type) {
      case 'transferData':
        redisClient.get('latest_vehicles_data', (err, reply) => {
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
  ws.on('close', () => {
    wsClientsCount -= 1;
    console.log(`current websocket clients count: ${wsClientsCount}`);
  });
});

redisSub.subscribe('vehicles_data');
redisSub.on('message', (channel, msg) => {
  wss.clients.forEach((client) => {
    client.send(msg);
  });
});

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}

backgroundWorker();
server.listen(port);
// server.on('connection', () => ());
server.on('error', (onError) => console.log(onError));
server.on('listening', onListening);

module.exports = app;
