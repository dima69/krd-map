const csv = require('@fast-csv/parse');
const axios = require('axios').default;
const redis = require('redis');
const { CronJob } = require('cron');
const { getDatabase, collectionName } = require('./db');

const redisPub = redis.createClient();

const gpsDataUrl = 'http://marsruty.ru/krasnodar/gps.txt';

async function getVehiclesDataJSON() {
  const parsedData = [];
  let date;
  try {
    const response = await axios.get(gpsDataUrl);
    let last_modified = response.headers['last-modified'];
    date = new Date(last_modified);
    date.setSeconds(date.getSeconds() + 5);
  } catch (error) {
    console.log(error);
  }
}

function parseData(csvData) {
  return new Promise((resolve, reject) => {
    let parsedData = [];
    csv.parseString(csvData,
      {
        headers: ['vehType', 'routeId', 'lat', 'lng', 'speed', 'degree', 'vehId'],
        discardUnmappedColumns: true,
      })
      .validate((row) => row.vehType !== '4')
      .on('data', (row) => parsedData.push(row))
      .on('end', (rowCount) => {
        parsedData.forEach(currentItem => {
          currentItem.lat /= 1000000;
          currentItem.lng /= 1000000;
        });
        console.log(`parsed ${rowCount} items`);
        resolve(parsedData);
      });
  });
}
let lastModifiedDate;

const job = new CronJob('* * * * * *', (async () => { // '* * * * * *', '0-59/5 * * * * *
  console.log(`last_modData: ${lastModifiedDate}`);
  const response = await axios.get(gpsDataUrl);
  const modifiedDate = new Date(response.headers['last-modified']);
  console.log(`modifiedData: ${modifiedDate}`);
  if (modifiedDate > lastModifiedDate || lastModifiedDate === undefined) {
    console.log('new data lets go');
    lastModifiedDate = modifiedDate;
    const gpsDataJson = await parseData(response.data);
    const database = await getDatabase();
    await database.collection(collectionName).deleteMany({});
    await database.collection(collectionName).insertMany(gpsDataJson);
    // send to redis
    const msg = JSON.stringify({ type: 'info', text: gpsDataJson });
    redisPub.publish('vehiclesdata', msg);
  }
  //
}));

job.start();
