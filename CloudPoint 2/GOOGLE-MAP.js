let markers = [];
let infos = [];
let i = 0;
let k = 0;
let lastPriority = "";
let lastWeight = "";
let distanceMatrix = [];
let warehouseMarker = null;
let routes = [];
let map;
let visitedPoints = [];
let tt1 = [];
let warehouse = [];
let deliveryPoints = [];
let cargoCapacity = 20;

$('#btn1').on('click', function () {
  for (let j = 0; j < i; j++) {
    markers[j].setMap(null);
  }
  warehouseMarker = null;
});

$('#btn2').on('click', function () {
  for (let j = 0; j < k; j++) {
    infos[j].close();  // Close the InfoWindow associated with each marker
  }
});



function initMapqq() {
    map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: { lat: 49.2354, lng: 6.9944 },
    // mapTypeId: google.maps.MapTypeId.HYBRID
  });

  map.addListener('click', function (e) {
    if (!warehouseMarker) {
      // Create warehouse marker
      warehouseMarker = new google.maps.Marker({
        position: e.latLng,
        map: map,
        animation: google.maps.Animation.DROP
      });
  
      var infowindow = new google.maps.InfoWindow({
        content: "Base"
      });
  
      infowindow.open(map, warehouseMarker);
  
      markers[i] = warehouseMarker;
      i++;
    } else {
      // Create regular markers
      var marker = new google.maps.Marker({
        position: e.latLng,
        map: map,
        animation: google.maps.Animation.BOUNCE
      });
  
      for (let j = 0; j < i; j++) {
        markers[j].setAnimation(null); // Stop animation on previous markers
      }
  
      markers[i] = marker;
      i++;
  
      var infowindow = new google.maps.InfoWindow(); // Create a new InfoWindow for each marker
  
      marker.addListener('click', function () {
        var index = markers.indexOf(marker); // Find the index of the clicked marker
        if (index >= 0) {
          infowindow.setContent(infos[index].content); // Set the content of the corresponding InfoWindow
          infowindow.open(map, marker);
        }
      });
  
      map.panTo(e.latLng);
  
      let weatherURL = `https://api.weatherbit.io/v2.0/current?&lat=${e.latLng.lat()}&lon=${e.latLng.lng()}&key=e9e80d9d26bb4e09a560fa5e90ff5a82`;
      let trafficURL = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${e.latLng.lat()},${e.latLng.lng()}&key=wEQ41OxRSOnDLpcMGjH3VpAUEzfX9DKG`;
  
      $.when(
        $.ajax({
          url: weatherURL,
          dataType: 'json'
        }),
        $.ajax({
          url: trafficURL,
          dataType: 'json'
        })
      ).done(function (weatherResponse, trafficResponse) {
        const priority = lastPriority;
        const weight = lastWeight;
        const weatherCode = weatherResponse[0].data[0].weather.code;
        const weather = weatherResponse[0].data[0].weather.description;
        const trafficConfidence = trafficResponse[0].flowSegmentData.confidence;
        let trafficFreeFlowTravelTime = trafficResponse[0].flowSegmentData.currentSpeed;

        // Adjust trafficFreeFlowTravelTime according to weather codes
        if (weatherCode >= 501 && weatherCode <= 504) {
          trafficFreeFlowTravelTime -= trafficFreeFlowTravelTime * 0.3; // 减少30%
        } else if (weatherCode >= 601 && weatherCode <= 604) {
          trafficFreeFlowTravelTime -= trafficFreeFlowTravelTime * 0.084; // 减少8.4%
        }
  
        var infowindow = new google.maps.InfoWindow({
          content: `Priority: ${priority}<br>Weight: ${weight} kg<br>Weather: ${weather}<br>WeatherCode: ${weatherCode}<br>Traffic: ${trafficFreeFlowTravelTime} km/h<br>Confidence: ${trafficConfidence} level`
        });
  
        infowindow.open(map, marker);
        infos[k] = {
          marker: marker,
          infowindow: infowindow,
          content: `Priority: ${priority}<br>Weight: ${weight} kg<br>Weather: ${weather}<br>WeatherCode: ${weatherCode}<br>Traffic: ${trafficFreeFlowTravelTime} km/h<br>Confidence: ${trafficConfidence} level`
        };
        k++;
  
        marker.priority = priority;
        marker.weight = weight;
        marker.weatherCode = weatherCode;
        marker.trafficFreeFlowTravelTime = trafficFreeFlowTravelTime;
  
        createDataFrame(warehouseMarker, markers);
        $('#routebtn').on('click', function () {
          mapLocation()
        });
        $('#routebtnF').on('click', function () {
          zhixian()
        })


      });
    }
  });

  mapLocation()
  $('#routebtn').on('click', function () {
    mapLocation()
  });
  $('#routebtnF').on('click', function () {
    zhixian()
  })


}

function mapLocation() {
  var directionsDisplay;
  var directionsService = new google.maps.DirectionsService();
  var infoWindow;

  function initialize() {
    directionsDisplay = new google.maps.DirectionsRenderer();
    var saar = new google.maps.LatLng(49.2354, 6.9944);
    var mapOptions = {
      zoom: 15,
      center: saar
    };

    directionsDisplay.setMap(map);
    google.maps.event.addDomListener(document.getElementById('routebtn'), 'click', calcRoute);
    infoWindow = new google.maps.InfoWindow(); // 创建InfoWindow对象
  }

  function calcRoute() {
    let tt1 = visitedPoints;
    console.log(tt1)

    var waypoints = [];
    for (let i = 0; i < tt1.length; i++) {
      waypoints.push({
        location: new google.maps.LatLng(parseFloat(tt1[i][0]), parseFloat(tt1[i][1])),
        stopover: false
      });
    }

    var start = new google.maps.LatLng(parseFloat(tt1[0][0]), parseFloat(tt1[0][1]));
    var end = new google.maps.LatLng(parseFloat(tt1[tt1.length - 1][0]), parseFloat(tt1[tt1.length - 1][1]));

    var bounds = new google.maps.LatLngBounds();
    bounds.extend(start);
    bounds.extend(end);
    map.fitBounds(bounds);

    var request = {
      origin: start,
      destination: end,
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, function (response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
        directionsDisplay.setMap(map);
        showMarkers(tt1); // 显示标记
      } else {
        alert("Directions Request from " + start.toUrlValue(6) + " to " + end.toUrlValue(6) + " failed: " + status);
      }
    });
  }

  function showMarkers(tt1) {
    for (let i = 0; i < tt1.length; i++) {
      let position = new google.maps.LatLng(parseFloat(tt1[i][0]), parseFloat(tt1[i][1]));
  
      // 如果是起点或终点，则不显示标记
      if (i === 0 || i === tt1.length - 1) {
        continue;
      }
  
      let marker = new google.maps.Marker({
        position: position,
        label: (i).toString(), // 显示数字，从1开始
        map: map
      });
  
      // 为每个标记添加点击事件，点击时显示InfoWindow
      marker.addListener('click', function () {
        infoWindow.setContent(`Point ${i}`);
        infoWindow.open(map, marker);
      });
    }
  }
  
   

  google.maps.event.addDomListener(window, 'load', initialize);
}



function zhixian() {
  directionsDisplay = new google.maps.DirectionsRenderer();
  var saar = new google.maps.LatLng(49.2354, 6.9944);
  var mapOptions = {
    zoom: 15,
    center: saar
  };

  directionsDisplay.setMap(map);

  const flightPlanCoordinates = [];
  for (let i = 0; i < visitedPoints.length; i++) {
    let [lat, lng] = visitedPoints[i];
    flightPlanCoordinates.push({ lat: lat, lng: lng });
  }

  const flightPath = new google.maps.Polyline({
    path: flightPlanCoordinates,
    geodesic: true,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2,
  });

  flightPath.setMap(map);
}


function createDataFrame() {
  const warehouse = [markers[0].position.lat(), markers[0].position.lng(), 1 / 30];//仓库点的速度默认设为30
  const deliveryPoints = {};

  for (let i = 1; i < markers.length; i++) {
    if (i === 0) continue; // Skip the first marker (warehouse)

    const latLng = [markers[i].position.lat(), markers[i].position.lng()];
    const weight = markers[i].weight;
    const priority = markers[i].priority;
    const speed = 1 / markers[i].trafficFreeFlowTravelTime;
    // trafficFreeFlowTravelTime = trafficResponse[0].flowSegmentData.freeFlowTravelTime;

    deliveryPoints[i - 1] = [...latLng, weight, priority, speed];
  }

  console.log("deliveryPoints =", deliveryPoints);
  // Rest of your code...
  console.log(" warehouse =",  warehouse);
  
  var cargoCapacity = 20;
  visitedPoints = routePlanning(warehouse, deliveryPoints, cargoCapacity);
  // routePlanning1(warehouse, deliveryPoints, cargoCapacity);
  
}


function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function calculateDrivingTime(distance, speed) {
  return distance / speed;
}

function calculatePriority(weight, priority) {
  return weight * priority;
}



function routePlanning(warehouse, deliveryPoints, cargoCapacity) {
  let [baseX, baseY, speedBase] = warehouse;
  let [currentX, currentY, currentSpeedBase] = warehouse;
  let remainingCapacity = cargoCapacity;
  let optimalRoutes = [];

  let visitedPoints_local = []; // Create an empty array to store the visited points
  console.log('P1', baseX, baseY)
  visitedPoints_local.push([currentX, currentY]); // Add warehouse point's coordinates as the first value
  console.log('P2', visitedPoints_local)

  while (Object.keys(deliveryPoints).length > 0) {
    let tdValues = [];

    for (let i in deliveryPoints) {
      let [x, y, weight, priority, speed] = deliveryPoints[i];
      let id = i;
      let distance = calculateDistance(currentX, currentY, x, y);
      let drivingTime = calculateDrivingTime(distance, speed);
      let distanceBase = calculateDistance(baseX, baseY, x, y);
      let drivingTimeBase = calculateDrivingTime(distanceBase, speedBase);

      let tdValue =
        drivingTime * distance +
        ((cargoCapacity - remainingCapacity) / cargoCapacity) *
          drivingTimeBase *
          distanceBase;

      tdValues.push([id, tdValue]);
    }

    tdValues.sort((a, b) => a[1] - b[1]);

    for (let i = 0; i < tdValues.length; i++) {
      tdValues[i][1] = i + 1;
      let [a, b, c, _priority_, d] = deliveryPoints[tdValues[i][0]]
      // For Yu: point [td_rank, priority]
      // A [1, 1]: 1-1 = 0
      // B [2, 3]: 3-2 = 1
      tdValues[i][1] = _priority_ - tdValues[i][1]
    }

    tdValues.sort((a, b) => b[1] - a[1]);

    let nearestPoint = deliveryPoints[tdValues[0][0]];
    let [x, y, weight, priority, speed] = nearestPoint;

    if (weight <= remainingCapacity) {
      delete deliveryPoints[tdValues[0][0]];
      remainingCapacity -= weight;
      optimalRoutes.push(tdValues[0][0]);
      visitedPoints_local.push([x, y]);
      console.log(
        `派送货物至坐标(${x}, ${y})，货物重量为${weight}kg，优先级为${priority}`
      );
      currentX = x;
      currentY = y;
    } else {
      console.log("车辆返回仓库重新装货");
      remainingCapacity = cargoCapacity;
      [currentX, currentY, speedBase] = warehouse;
      visitedPoints_local.push([baseX, baseY]);
    }
  }

  visitedPoints_local.push([baseX, baseY]); // Add warehouse point's coordinates as the last value

  console.log("333bianlidian",visitedPoints_local);
  console.log("所有货物派送完毕，车辆返回仓库");
  return visitedPoints_local;
}



const markerForm = document.getElementById('marker-form');
markerForm.addEventListener('submit', function (event) {
  event.preventDefault(); // 阻止默认提交行为

  const priority = document.getElementById('priority').value;
  const weight = document.getElementById('weight').value;

  const newMarker = {
    priority: priority,
    weight: weight,
    // Add other properties of the marker as needed
  };

  markers.push(newMarker);

  // Optionally, you can update lastPriority and lastWeight variables if needed
  lastPriority = priority;
  lastWeight = weight;

  // Clear the form fields after submission if needed
  document.getElementById('priority').value = '';
  document.getElementById('weight').value = '';
});
