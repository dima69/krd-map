const csv = require('@fast-csv/parse');
const axios = require('axios').default;
const redis = require('redis');
const { CronJob } = require('cron');
const { getDatabase, collectionName } = require('./db');

// const redisPub = redis.createClient();
const redisClient = redis.createClient();
const redisBatch = redisClient.batch();

const gpsDataUrl = 'http://marsruty.ru/krasnodar/gps.txt';
let lastModifiedDate; // will store last-modified-data from HTTP response


function parseGpsData(csvData) {
  return new Promise((resolve, reject) => {
    const parsedData = [];
    csv.parseString(csvData,
      {
        headers: ['vehType', 'routeId', 'lat', 'lng', 'speed', 'degree', 'vehId'],
        discardUnmappedColumns: true,
      })
      .validate((row) => row.vehType !== '4')
      .on('data', (row) => parsedData.push(row))
      .on('end', () => {
        parsedData.forEach((currentRow) => {
          currentRow.lat /= 1000000;
          currentRow.lng /= 1000000;
          switch (currentRow.vehType) {
            case '1':
              currentRow.vehType = 'trolley';
              break;
            case '2':
              currentRow.vehType = 'bus';
              break;
            case '3':
              currentRow.vehType = 'tram';
              break;
            default:
              break;
          }
        });
        resolve(parsedData);
      });
  });
}

function redisInsert(vehiclesData) {
  return new Promise((resolve, reject) => {
    redisBatch.flushdb();
    const counters = { tram: 0, bus: 0, trolley: 0 };
    // eslint-disable-next-line no-restricted-syntax
    for (const vehicle of vehiclesData) {
      counters[vehicle.vehType] += 1;
      const keyTemplate = `vehicles:${vehicle.vehType}:${counters[vehicle.vehType]}`;
      redisBatch.hmset(keyTemplate, vehicle);
    }
    redisBatch.exec((err, res) => {
      resolve(res.length);
    });
  });
}

function redisPublish(vehiclesData) {
  return new Promise((resolve, reject) => {
    const data = [];
    vehiclesData.forEach((currentRow) => {
      data.push(Object.values(currentRow));
    });

    // prepare WebSocket message and publish it to RedisPubSub channel
    const pubSubMessage = JSON.stringify({ type: 'vehicles', text: data });
    redisClient.publish('vehicles_data', pubSubMessage, (publisherErr, publisherReply) => {
      if (publisherErr) reject(new Error(publisherErr));
      // store WebSocket message in RedisDB that we can send it later for newly connected clients
      // because WebSocket messages sent every ~1 seconds by CronJob so client doesn't have to wait
      redisClient.set('latest_vehicles_data', pubSubMessage, (err, reply) => {
        if (err) reject(new Error(err));
        resolve(reply);
      });
    });
  });
}

async function insertToMongoDB(gpsData, modifiedDate) {
  const database = await getDatabase();
  await database.collection(collectionName).insertMany([
    { data: gpsData, date_parsed: modifiedDate }]);
}

// cron time: '*/5 * * * * *' == every 5 started from the 0. (0, 5, 10, 15 ...etc)
// cron time: '* * * * * *' == every second
function initBackgroundWorker() {
  console.log('init background worker');
  const job = new CronJob('* * * * * *', (async () => {
    const gpsDataRaw = await axios.get(gpsDataUrl);
    const responseBody = gpsDataRaw.data;
    // '1' || 'number' in response == something wrong on remote server
    if (responseBody === 'number') {
      console.log(`${responseBody} in response, something wrong with the GPS server`);
    } else {
      const modifiedDate = new Date(gpsDataRaw.headers['last-modified']);
      if (modifiedDate > lastModifiedDate || lastModifiedDate === undefined) {
        console.log('Got fresh data! Parsing..');
        lastModifiedDate = modifiedDate;
        const data = await parseGpsData(responseBody);
        const [pubSubMsgStatus, insertedRows, mongoResult] = await Promise.all([
          redisPublish(data),
          redisInsert(data),
          insertToMongoDB(data, modifiedDate), // for later use, analytics @@@ not yet
        ]);
        console.info(`redisPubSub message status: ${pubSubMsgStatus}, rows inserted: ${insertedRows}`);
      }
    }
  }));
  job.start();
}

module.exports = initBackgroundWorker;
