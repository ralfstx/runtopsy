/* global L */
(function() {

  window.runtopsy.MapView = {
    create
  };

  function create(id) {

    let map = L.map(id);
    let currentLayer;
    let mapTileLayer;

    return {
      showTiles,
      showActivity
    };

    function showTiles(accessToken) {
      mapTileLayer && mapTileLayer.removeFrom(map);
      mapTileLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>,'
          + ' Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        // alternative: 'mapbox.streets'
        id: 'mapbox.outdoors',
        accessToken
      }).addTo(map);
    }

    function showActivity(activity) {
      let allPoints = activity.records
        .map(record => record.position)
        .filter(point => point != null);
      let polyline = L.polyline(allPoints, { color: 'red' });
      map.fitBounds(polyline.getBounds(), { padding: [10, 10] });
      currentLayer && currentLayer.removeFrom(map);
      polyline.addTo(map);
      currentLayer = polyline;
    }

  }

})();
