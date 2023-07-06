function calculateShortestPaths() {
    const startMarker = markers[0]; // Store point (Marker 1)
    const n = markers.length;
    const visited = new Array(n).fill(false);
    const distances = new Array(n).fill(Infinity);
    const prev = new Array(n).fill(null);
    const weights = new Array(n).fill(0);
    const paths = [];
    const optimalRoutes = [];
  
    distances[0] = 0;
  
    while (true) {
      let minDistance = Infinity;
      let minIndex = -1;
  
      // Find the closest unvisited marker
      for (let i = 0; i < n; i++) {
        if (!visited[i] && distances[i] < minDistance) {
          minDistance = distances[i];
          minIndex = i;
        }
      }
  
      if (minIndex === -1) {
        // No unvisited markers left
        break;
      }
  
      const currentMarker = markers[minIndex];
  
      // Check weight constraint
      const currentWeight = weights[minIndex] + currentMarker.weight;
      if (currentWeight > 20) {
        visited[minIndex] = true;
        continue;
      }
  
      visited[minIndex] = true;
  
      // Update distances to neighboring markers
      for (let j = 0; j < n; j++) {
        if (j === minIndex) {
          continue;
        }
  
        const neighborMarker = markers[j];
        const distance = distanceMatrix[minIndex][j];
        const weight = neighborMarker.weight;
        const trafficFreeFlowTravelTimeAvg = (currentMarker.trafficFreeFlowTravelTimeAvg + neighborMarker.trafficFreeFlowTravelTimeAvg) / 2;
        const trafficConfidenceAvg = (currentMarker.trafficConfidenceAvg + neighborMarker.trafficConfidenceAvg) / 2;
        const priority = neighborMarker.priority;
        const weatherCode = neighborMarker.weatherCode;
  
        // Apply weather conditions
        let travelTime = trafficFreeFlowTravelTimeAvg;
        if (weatherCode >= 500 && weatherCode < 600) {
          travelTime *= 0.7; // Decrease speed by 30%
        } else if (weatherCode >= 600 && weatherCode < 700) {
          travelTime *= 0.6; // Decrease speed by 40%
        }
  
        const newDistance = minDistance + distance / 1000 * travelTime; // Convert distance to kilometers
  
        if (newDistance < distances[j]) {
          distances[j] = newDistance;
          prev[j] = minIndex;
          weights[j] = currentWeight;
        }
      }
    }
  
    // Build paths from the calculated distances and previous nodes
    for (let i = 1; i < n; i++) {
      if (prev[i] === null) {
        // No path to the marker
        continue;
      }
  
      const path = [];
      let currentNode = i;
  
      while (currentNode !== 0) {
        path.unshift(currentNode);
        currentNode = prev[currentNode];
      }
  
      path.unshift(0); // Add the start marker to the path
      paths.push(path);
    }
  
    // Find the optimal routes based on priority and total time
    let currentTime = 0;
    let currentRoute = [];
    let currentWeight = 0;
  
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const lastMarkerIndex = path[path.length - 1];
      const lastMarker = markers[lastMarkerIndex];
      const priority = lastMarker.priority;
      const totalDistance = distances[lastMarkerIndex];
  
      // Apply priority time adjustments
      let priorityTime = 0;
      if (priority === "1") {
        priorityTime = totalDistance * 0.3; // Increase time by 30%
      } else if (priority === "2") {
        priorityTime = totalDistance * 0.6; // Increase time by 60%
      } else if (priority === "3") {
        priorityTime = totalDistance * 0.9; // Increase time by 90%
      }
  
      const totalTime = totalDistance + priorityTime;
  
      // Check weight constraint
      const pathWeight = weights[lastMarkerIndex];
      if (currentWeight + pathWeight > 20) {
        optimalRoutes.push({
          Route: currentRoute,
          Time: currentTime
        });
        currentTime = 0;
        currentRoute = [];
        currentWeight = 0;
      }
  
      currentTime += totalTime;
      currentRoute.push(path);
      currentWeight += pathWeight;
    }
  
    // Add the last route
    if (currentRoute.length > 0) {
      optimalRoutes.push({
        Route: currentRoute,
        Time: currentTime
      });
    }
  
    return optimalRoutes;
  }
  
    // Function to draw a polyline on the map
function drawPolyline(path, color) {
      const pathCoordinates = path.map((markerIndex) => markers[markerIndex].getPosition());
      const polyline = new google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 3,
      });
      polyline.setMap(map);
    }
  
    

  // Usage example
  const optimalRoutes = calculateShortestPaths();
  console.log(optimalRoutes);


  