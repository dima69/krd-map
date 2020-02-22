const csv = require('@fast-csv/parse');
const axios = require('axios').default;
const redis = require('redis');
const { CronJob } = require('cron');
const { getDatabase, collectionName } = require('./db');

const redisPub = redis.createClient();

const gpsDataUrl = 'http://marsruty.ru/krasnodar/gps.txt';


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

function parseDataMod(csvData) {
  return new Promise((resolve, reject) => {
    let parsedData = [];
    csv.parseString(csvData,
      {
        // headers: ['vehType', 'routeId', 'lat', 'lng', 'speed', 'degree', 'vehId'],
        // ignoreEmpty: true,
      })
      .validate((row) => row[0] !== '4')
      .on('data', (row) => parsedData.push(row))
      .on('end', (rowCount) => {
        parsedData.forEach((currentItem) => {
          currentItem[2] /= 1000000; // @@@ hack
          currentItem[3] /= 1000000; // convert latitude and longitude
          currentItem.pop(); // removes last index from array which is always empty
        });
        let asd = Object.create({});
        asd = {
          date_parsed: new Date(),
          vehicles_data: parsedData,
        };
        console.log(`parsed ${rowCount} items`);
        resolve(asd);
      });
  });
}

let lastModifiedDate;

async function initBackgroundWorker() {
  const job = new CronJob('0-59/5 * * * * *', (async () => { // '* * * * * *', '0-59/5 * * * * *
    console.log('getting new data:');
    const response = await axios.get(gpsDataUrl);
    const modifiedDate = new Date(response.headers['last-modified']);
    if (modifiedDate > lastModifiedDate || lastModifiedDate === undefined) {
      console.log('new data lets go');
      lastModifiedDate = modifiedDate;
      const gpsDataJson = await parseDataMod(response.data);
      const database = await getDatabase();
      // await database.collection(collectionName).deleteMany({});
      await database.collection(collectionName).insertMany([
        { data: gpsDataJson.vehicles_data, date_parsed: gpsDataJson.date_parsed }]);
      // send to redis
      const msg = JSON.stringify({ type: 'vehicles', text: gpsDataJson.vehicles_data });
      redisPub.set('latest_data', msg);
      redisPub.publish('vehiclesdata', msg);
    }
  }));
  job.start();
}

module.exports = initBackgroundWorker;
