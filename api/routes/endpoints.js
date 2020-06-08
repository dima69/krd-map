const redis = require('redis');
const { getDatabase, collectionName, getRedisClient } = require('../../background_work/db');

const redisClient = redis.createClient();
const redisBatch = redisClient.batch();


// @@@ make it in single Object
function getVehiclesAll() {
  return new Promise((resolve, reject) => {
    const matchParam = 'vehicles:*';
    redisClient.scan('0', 'MATCH', matchParam, 'COUNT', '1000', (scanErr, keys) => {
      if (scanErr) throw scanErr;

      keys[1].forEach((currentKey) => {
        redisBatch.hgetall(currentKey, (keyErr, values) => {
          if (keyErr) reject(new Error(keyErr));
        });
      });
      redisBatch.exec((err, reply) => {
        resolve(reply);
      });
    });
  });
}

function getVehiclesByType(vehType) {
  return new Promise((resolve, reject) => {
    const matchParam = `vehicles:${vehType}:*`;
    redisClient.scan('0', 'MATCH', matchParam, 'COUNT', '1000', (scanErr, keys) => {
      if (scanErr) throw scanErr;

      keys[1].forEach((currentKey) => {
        redisBatch.hgetall(currentKey, (keyErr, values) => {
          if (keyErr) reject(new Error(keyErr));
        });
      });
      redisBatch.exec((err, reply) => {
        resolve(reply);
      });
    });
  });
}

function getVehiclesByRouteId(vehType, routeId) {
  return new Promise((resolve, reject) => {
    const resp = [];
    const matchParam = `vehicles:${vehType}:*`;
    redisClient.scan('0', 'MATCH', matchParam, 'COUNT', '1000', (scanErr, keys) => {
      if (scanErr) throw scanErr;

      keys[1].forEach((currentKey) => {
        redisBatch.hgetall(currentKey, (keyErr, values) => {
          if (keyErr) reject(new Error(keyErr));
        });
      });
      redisBatch.exec((err, reply) => {
        reply.forEach((currentItem) => {
          if (currentItem.routeId === routeId.toUpperCase()) {
            resp.push(currentItem);
          }
        });
        resolve(resp);
      });
    });
  });
}

module.exports = {
  getVehiclesAll,
  getVehiclesByRouteId,
  getVehiclesByType,
};
