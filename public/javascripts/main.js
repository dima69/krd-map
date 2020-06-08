// import * as L from 'leaflet';
// const L = require('leaflet');
// import {  } from "";


// console.log(object);
const map = L.map('mapid').setView([45.032894, 39.021949], 13);

const openStreetMapTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  preferCanvas: true,
});

openStreetMapTiles.addTo(map);

const markersLayer = L.layerGroup();
// const ciLayer = canvasIconLayer({}).addTo(map);
// console.log(ciLayer);

// const icon = L.icon({
//   iconUrl: 'img/pothole.png',
//   iconSize: [20, 18],
//   iconAnchor: [10, 9],
// });

// const markers = [];
// for (let i = 0; i < 10000; i++) {
//   const marker = L.marker([45.0578 + Math.random() * 1.8, 38.9487 + Math.random() * 3.6], { icon }).bindPopup(`I Am ${i}`).bindTooltip(i, { permanent: true, direction: 'bottom', offset: [-2, 5] });
//   markers.push(marker);
// }
// ciLayer.addLayers(markers);

const wsAdress = `ws://${window.location.host}`;
const wSocket = new WebSocket(wsAdress);

wSocket.onopen = function sendMsgSocket() {
  const msg = { type: 'transferData' };
  wSocket.send(JSON.stringify(msg));
};

function drawCustomIcon(vehicleType) {
  let classVehicleType;
  switch (vehicleType) {
    case 'bus':
    case '2':
      classVehicleType = 'bus-icon';
      break;
    case 'tram':
    case '3':
      classVehicleType = 'tram-icon';
      break;
    case 'trolley':
    case '1':
      classVehicleType = 'trolley-icon';
      break;
    default:
      break;
  }
  return L.divIcon({
    className: `vehicle-${classVehicleType}`,
  });
}


/*
* [2, 14, 34.00, 46.00, 30, 180, 466]
* item[0] = vehicle type (1=trolley, 2=bus, 3=tram)
* item[1] = route id
* item[2] = latitude
* item[3] = longitude
* item[4] = speed
* item[5] = degree, vehicle's movement direction
* item[6] = vehicle id
*/
function drawMarkersMod(vehiclesData) {
  markersLayer.clearLayers();
  vehiclesData.forEach((item) => {
    let marker = L.marker([item[3], item[2]],
      { icon: drawCustomIcon(item[0], item[1]) })
      .bindPopup(`${item[6]}<br>route:${item[1]}<br>speed:${item[4]}<br>degree:${item[5]}`);
    marker.addTo(markersLayer);
  });
  markersLayer.addTo(map);
}

// @@@ create marker_vehicleid
// marker_vehicleid.setLatLng()
function drawMarkersAsync(vehiclesData) {
  return new Promise((resolve, reject) => {
    markersLayer.clearLayers();
    vehiclesData.forEach((item) => {
      let marker = L.marker([item[3], item[2]],
        { icon: drawCustomIcon(item[0], item[1]) })
        .bindPopup(`${item[6]}<br>route:${item[1]}<br>speed:${item[4]}<br>degree:${item[5]}`);
      marker.addTo(markersLayer);
    });
    resolve(markersLayer.addTo(map));
  });
}

function addMarkersLayerToMap() {
  return new Promise((resolve, reject) => {
    resolve(markersLayer.addTo(map));
  });
}

// add Marker to markersLayer
function addMarkerToMarkersLayers(marker) {
  return new Promise((resolve, reject) => {
    // const markersLayer = L.layerGroup();
    L.marker([marker[3], marker[2]],
      { icon: drawCustomIcon(marker[0], marker[1]) })
      .bindPopup(`${marker[6]}<br>route:${marker[1]}<br>speed:${marker[4]}<br>degree:${marker[5]}`)
      .addTo(map);
  });
}

async function drawMarkersAs(vehiclesData) {
  markersLayer.clearLayers();
  let generatedResponse = [];
  const promises = vehiclesData.map((vehicle) => {
    let myMark = L.marker([vehicle[3], vehicle[2]])
      .bindPopup(`${vehicle[6]}<br>route:${vehicle[1]}<br>speed:${vehicle[4]}<br>degree:${vehicle[5]}`)
      .addTo(map);
    markersLayer.addTo(map);
    generatedResponse.push(myMark);
  });
  console.log(generatedResponse);
  await Promise.all(promises);
  // return markersLayer.addTo(map);
}

function* iterateMarkers(vehicles) {
  for (let vehicle_type in vehicles) {
    let vehicle_routes = vehicles[vehicle_type];
    for (let route_id in vehicle_routes) {
      let route = vehicle_routes[route_id];
      for (let marker of route) {
        let [vehicle_id, latitude, longitude, speed, degree] = marker;
        yield { vehicle_type, route_id, vehicle_id, latitude, longitude, speed, degree };
      }
    }
  }
}

function* iterateMarkerNew(vehicles) {
  // eslint-disable-next-line no-restricted-syntax
  for (let vehicle of vehicles) {
    let { vehType, routeId, lat, lng, speed, degree, vehId } = vehicle;
    yield { vehType, routeId, lat, lng, speed, degree, vehId };
  }
}

function drawMarkers(vehiclesData) {
  // markersLayer.clearLayers();
  // eslint-disable-next-line no-restricted-syntax
  for (let { vehType, routeId, lat, lng, speed, degree, vehId } of iterateMarkerNew(vehiclesData)) {
    const marker = L.marker([lat, lng], { icon: drawCustomIcon(vehType) })
      .bindPopup(`${vehType}<br>route:${routeId}<br>speed:${speed}<br>${degree}`);
    marker.addTo(map);
  }
  // markersLayer.addTo(map);
}


wSocket.onmessage = async function parseData(event) {
  const msg = JSON.parse(event.data);
  switch (msg.type) {
    case 'vehicles':
      await drawMarkersAs(msg.text);
      break;
    case 'info':
      // @@@ parse information messages from server like:
      // add on map
      console.log(msg);
      break;
    default:
      break;
  }
};
