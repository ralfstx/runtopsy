/* global L */
(function() {

  window.runtopsy.MapView = {
    create
  };

  function create(id) {

    let map = L.map(id);
    let mapTileLayer;
    let trackLayer;
    let markerLayer;

    return {
      showTiles,
      showActivity,
      showPosition
    };

    function showTiles(accessToken) {
      mapTileLayer && mapTileLayer.removeFrom(map);
      trackLayer && trackLayer.removeFrom(map);
      markerLayer && markerLayer.removeFrom(map);
      mapTileLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>,'
          + ' Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        // alternative: 'mapbox.streets'
        id: 'mapbox.outdoors',
        accessToken
      }).addTo(map);
      trackLayer = L.polyline([], {
        color: '#ff5555'
      }).addTo(map);
      markerLayer = L.circleMarker([0, 0], {
        radius: 8,
        fillColor: 'steelblue',
        fillOpacity: 0.9,
        stroke: 0
      }).addTo(map);
    }

    function showActivity(activity) {
      if (!trackLayer) return;
      let allPoints = !activity ? [] : activity.records
        .map(record => record.position)
        .filter(point => point != null);
      trackLayer.setLatLngs(allPoints);
      map.fitBounds(trackLayer.getBounds(), { padding: [10, 10] });
    }

    function showPosition(position) {
      if (!markerLayer) return;
      if (position) {
        markerLayer.addTo(map);
        markerLayer && markerLayer.setLatLng(position);
      } else {
        markerLayer.removeFrom(map);
      }
    }

  }

})();
