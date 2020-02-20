const express = require('express');

const router = express.Router();

const { getVehiclesAll, getVehiclesByType, getVehiclesByRouteId } = require('./endpoints');


/* GET all Vehicles */
router.get('/vehicles/getAll', async (req, res) => {
  // let data = await getVehiclesAll();
  let data = null;
  try {
    data = await getVehiclesAll();
  } catch (error) {
    data = error;
  }
  res.json(data);
});

/* GET specific route Vehicles with params */
router.get('/vehicles/getByRouteId', (req, res) => {
  // getVehicles?type=bus|tram|trolley&route=:id
  if (!req.query.route) {
    res.json({ error: 'route=(id:string) parameter required!' });
  }
  if (!req.query.type) {
    res.json({ error: 'type=(bus|tram|trolley:string) parameter required!' });
  }
  const routeId = req.query.route;
  const vehicleType = req.query.type;
  console.log(routeId, parseInt(vehicleType, 10));
});

// for the (bus|tram|trolley)
router.get('/vehicles/getAllByType', (req, res) => {
  let vehicleType;
  switch (req.query.type) {
    case 'bus':
      vehicleType = 2;
      break;
    case 'tram':
      vehicleType = 3;
      break;
    case 'trolley':
      vehicleType = 1;
      break;
    default:
      vehicleType = req.query.type;
      break;
  }
});

/* STOPS SECTION */
// GET all Stops
router.get('/stops/getAll', (req, res, next) => {
});

// @@@
router.get('/stops/getByName', (req, res, next) => {
});

module.exports = router;
