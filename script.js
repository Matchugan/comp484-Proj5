let map;
let currentQuestionLocation = 0;
let correctAnswers = 0;



const locations = [
  {
    name: "University Library",
    lat: 34.24017663318601, 
    lng: -118.52938035983966,
    radius: 45
  },
  {
    name: "Byramian Hall",
    lat: 34.24045286980874, 
    lng: -118.53085240263087,
    radius: 45
  },
  {
    name: "Jacaranda",
    lat: 34.241407,
    lng: -118.528534,
    radius: 45
  },
  {
    name: "Maple Hall",
    lat: 34.237634,
    lng: -118.531232,
    radius: 45
  },
  {
    name: "Nordhoff Hall",
    lat: 34.23641446765731,
    lng: -118.53056622031148,
    radius: 45
  }

];

const csun = {
    lat: 34.239359920845786,  
    lng: -118.52932789473849
};

const libraryStart = {
  lat: 34.24017663318601,
  lng: -118.52938035983966
};

async function initMap() {
  

const {ColorScheme} = await google.maps.importLibrary("core")
const { Map, Circle} = await google.maps.importLibrary("maps");
const { spherical} = await google.maps.importLibrary("geometry");
const { DistanceMatrixService } = await google.maps.importLibrary("routes");

const distanceService = new DistanceMatrixService();

  map = new Map(document.getElementById("map"), {
    center: csun,
    zoom: 17,
    mapTypeId: "roadmap",
    colorScheme: ColorScheme.DARK,

    //prevent zooming and panning 
    gestureHandling: "none",
    zoomControl: false,

    //trying to get rid of labels
    styles: [
      {
        featureType: "all",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  });
  
  showLocation();
  map.addListener("dblclick", function (event) {
    checkUserAnswer( event.latLng, spherical, Circle, distanceService);
  });
}

function showLocation() {
  const currentQuestionSection = document.getElementById("current-question");

  if (currentQuestionLocation >= locations.length) {
    currentQuestionSection.innerHTML =
      "Quiz Finished! You got " + correctAnswers + " out of " + locations.length + " correct.";
    return;
  }

  const point = locations[currentQuestionLocation];

  currentQuestionSection.innerHTML =
    "Where is the location: " + point.name;
}

function checkUserAnswer(chosenArea, areaTool, drawTool, distanceService) {
  if (currentQuestionLocation >= locations.length) {
    return;
  }

  const point = locations[currentQuestionLocation];

  const correctArea = new google.maps.LatLng(point.lat, point.lng);

  const distance = areaTool.computeDistanceBetween(chosenArea, correctArea);

  const withinArea = distance <= point.radius;

  if (withinArea) {
    correctAnswers++;
  }

  drawChosenAreaBox(point, withinArea, drawTool);
  
  getWalkingDistanceFromLibrary(point, withinArea, distanceService);
  
  currentQuestionLocation++;
  
  showLocation();
}

function drawChosenAreaBox(location, withinArea, Circle){
  new Circle({
    map: map,
    center: {
      lat: location.lat,
      lng: location.lng
    },
    radius: location.radius,
    strokeColor: withinArea ? "green" : "red",
    strokeOpacity: 1,
    strokeWeight: 2,
    fillColor: withinArea ? "green" : "red",
    fillOpacity: 0.3

  });
}

function addResultToPage(location, withinArea, walkingDistance, walkingTime) {
  const resultsSection = document.getElementById("results");

  const resultBox = document.createElement("div");

  resultBox.classList.add("result-box");

  if (withinArea) {
    resultBox.classList.add("correct-result");
    resultBox.innerHTML =
      "Where is " + location.name + "? Correct!<br>" +
      "Walking distance from University Library: " +
      walkingDistance + ", about " + walkingTime + ".";
  } else {
    resultBox.classList.add("wrong-result");
    resultBox.innerHTML =
      "Where is " + location.name + "? Incorrect!<br>" +
      "Walking distance from University Library: " +
      walkingDistance + ", about " + walkingTime + ".";
  }

  resultsSection.appendChild(resultBox);
}

function getWalkingDistanceFromLibrary(location, withinArea, distanceService) {
  const destination = new google.maps.LatLng(location.lat, location.lng);

  distanceService.getDistanceMatrix(
    {
      origins: [libraryStart],
      destinations: [destination],
      travelMode: google.maps.TravelMode.WALKING
    },
    function (response, status) {
      if (status === "OK") {
        const result = response.rows[0].elements[0];

        const walkingDistance = result.distance.text;
        const walkingTime = result.duration.text;

        addResultToPage(location, withinArea, walkingDistance, walkingTime);
      } else {
        addResultToPage(location, withinArea, "distance", " time");
      }
    }
  );
}