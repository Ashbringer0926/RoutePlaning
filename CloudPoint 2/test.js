function routePlanning(warehouse, deliveryPoints, cargoCapacity) {
  let [baseX, baseY, speedBase] = warehouse;
  let [currentX, currentY, currentSpeedBase] = warehouse;
  let remainingCapacity = cargoCapacity;
  let optimalRoutes = [];

  let visitedPoints = []; // Create an empty array to store the visited points

  visitedPoints.push([baseX, baseY]); // Add warehouse point's coordinates as the first value

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
    }

    tdValues.sort((a, b) => b[1] - a[1]);

    let nearestPoint = deliveryPoints[tdValues[0][0]];
    let [x, y, weight, priority, speed] = nearestPoint;

    if (weight <= remainingCapacity) {
      delete deliveryPoints[tdValues[0][0]];
      remainingCapacity -= weight;
      optimalRoutes.push(tdValues[0][0]);
      visitedPoints.push([x, y]);
      console.log(
        `派送货物至坐标(${x}, ${y})，货物重量为${weight}kg，优先级为${priority}`
      );
      currentX = x;
      currentY = y;
    } else {
      console.log("车辆返回仓库重新装货");
      remainingCapacity = cargoCapacity - weight;
      [currentX, currentY, speedBase] = warehouse;
      visitedPoints.push([baseX, baseY]);
    }
  }

  visitedPoints.push([baseX, baseY]); // Add warehouse point's coordinates as the last value

  console.log("333bianlidian",visitedPoints);
  console.log("所有货物派送完毕，车辆返回仓库");
  return visitedPoints;
}