const { getDatabase, collectionName } = require('../../background_work/db');


async function getVehiclesAll() {
  const database = await getDatabase();
  const data = await database.collection(collectionName).find({}).toArray();
  // const data = await database.collection(collectionName).find({});
  return data;
}

async function getVehiclesByType(vehType) {
  const database = await getDatabase();
  const data = await database.collection(collectionName).find({ vehType }).toArray();
  return data;
}

async function getVehiclesByRouteId(routeId) {
  const database = await getDatabase();
  const data = await database.collection(collectionName).find({ routeId }).toArray();
  return data;
}

module.exports = {
  getVehiclesAll,
  getVehiclesByRouteId,
  getVehiclesByType,
};
