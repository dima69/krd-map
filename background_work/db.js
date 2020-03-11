const redis = require('redis');
const { MongoClient } = require('mongodb');

let mongoDatabase = null;
let redisClient = null;

const collectionName = 'vehicles';

async function initializeDatabase() {
  const mongoUrl = 'mongodb://127.0.0.1:27017';
  const dbName = 'krdmap';
  const dbConnection = await MongoClient.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  mongoDatabase = dbConnection.db(dbName);
}

async function getDatabase() {
  if (!mongoDatabase) await initializeDatabase();
  return mongoDatabase;
}

async function getRedisClient() {
  if (!redisClient) {
    redisClient = redis.createClient();
  }
  return redisClient;
}


module.exports = {
  getDatabase,
  initializeDatabase,
  collectionName,
  getRedisClient,
};
