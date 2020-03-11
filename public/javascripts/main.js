const map = L.map('mapid').setView([45.032894, 39.021949], 13);

const openStreetMapTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

openStreetMapTiles.addTo(map);

const markersLayer = L.layerGroup();

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
function drawMarkers(vehicles_json) {
  markersLayer.clearLayers();
  vehicles_json.forEach((item) => {
    let marker = L.marker([item.lng, item.lat],
      { icon: drawCustomIcon(item.vehType, item.routeId) })
      .bindPopup(`${item.vehId}<br>route:${item.routeId}<br>speed:${item.speed}<br>degree:${item.degree}`);
    marker.addTo(markersLayer);
  });
  markersLayer.addTo(map);
}

wSocket.onmessage = function parseData(event) {
  const msg = JSON.parse(event.data);
  switch (msg.type) {
    case 'vehicles':
      drawMarkersMod(msg.text);
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
