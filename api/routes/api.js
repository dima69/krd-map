const express = require('express');

const router = express.Router();

const { getVehiclesAll, getVehiclesByType, getVehiclesByRouteId } = require('./endpoints');

const ALLOWED_VEHICLES_TYPES = ['trolley', 'bus', 'tram'];

/* GET all Vehicles */
router.get('/vehicles/getAll', async (req, res) => {
  try {
    const apiResponse = await getVehiclesAll();
    return res.json(apiResponse);
  } catch (error) {
    return res.json({ Error: error });
  }
});

// for the (bus|tram|trolley)
router.get('/vehicles/getAllByType', async (req, res) => {
  if (!req.query.type) {
    return res.status(400).json({ Error: 'Empty params list: "bus" or "tram" or "trolley" parameter required!' });
  }
  if (ALLOWED_VEHICLES_TYPES.indexOf(req.query.type) === -1) {
    return res.status(400).json({ Error: 'Wrong params: type=<"bus" or "tram" or "trolley"> parameter required!' });
  }
  try {
    const apiResponse = await getVehiclesByType(req.query.type);
    return res.json(apiResponse);
  } catch (error) {
    return res.status(500).json({ Error: 'Something wrong with remote server. Try later.' });
  }
});

/* GET specific route Vehicles with params */
router.get('/vehicles/getAllByRouteId', async (req, res) => {
  // check if route exists
  if (!req.query.route || !req.query.type) {
    return res.status(400).json({ Error: 'type=<bus,tram,trolley>&route=<routeId> parameter required!' });
  }
  // -1 if not in array
  if (ALLOWED_VEHICLES_TYPES.indexOf(req.query.type) === -1) {
    return res.status(400).json({ Error: 'type=<"bus" or "tram" or "trolley"> parameter required!' });
  }
  try {
    const apiResponse = await getVehiclesByRouteId(req.query.type, req.query.route);
    return res.status(200).json(apiResponse);
  } catch (error) {
    return res.status(500).json({ Error: 'Something wrong with remote server. Try later.' });
  }
});


/* STOPS SECTION */
// @@@ later
// GET all Stops
router.get('/stops/getAll', (req, res) => {
  res.json({ error: 'not yet implemented' });
});

router.get('/stops/getByName', (req, res) => {
  res.json({ error: 'not yet implemented' });
});

module.exports = router;
