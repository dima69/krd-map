const map = L.map('mapid').setView([45.032894, 39.021949], 13);

const openStreetMapTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

openStreetMapTiles.addTo(map);

const markersLayer = L.layerGroup();

const wSocket = new WebSocket('ws://192.168.1.5:8000');

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

function drawMarkersOld(vehicles) {
  markersLayer.clearLayers();
  vehicles.forEach((item) => {
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
      drawMarkersOld(msg.text);
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
