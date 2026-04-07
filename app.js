// mapboxgl.accessToken = window.MAPBOX_TOKEN;

// ===== INIT MAP =====
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/dark-v11",
  center: [105.84, 21.02],
  zoom: 12,
});

let vehicles = {};
let source;
let marker;

// ===== LOAD DATA =====
async function loadInitial() {
  const res = await fetch("http://localhost:3000/vehicles");
  const data = await res.json();

  data.forEach(v => {
    vehicles[v.id] = v;
  });
}

// ===== GEOJSON =====
function toGeoJSON() {
  return {
    type: "FeatureCollection",
    features: Object.values(vehicles).map(v => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [v.lng, v.lat],
      },
    })),
  };
}

// ===== ADD LAYER =====
function addLayer() {
  map.addSource("vehicles", {
    type: "geojson",
    data: toGeoJSON(),
  });

  map.addLayer({
    id: "vehicles-layer",
    type: "circle",
    source: "vehicles",
    paint: {
      "circle-radius": 3,
      "circle-color": "#00ff00",
    },
  });

  source = map.getSource("vehicles");
}

// ===== UPDATE MAP =====
function updateMap() {
  if (!source) return;
  source.setData(toGeoJSON());
}

// ===== WS =====
function connectWS() {
  const ws = new WebSocket("ws://localhost:8080");

  ws.onmessage = (event) => {
    const updates = JSON.parse(event.data);

    updates.forEach(v => {
      vehicles[v.id] = v;
    });

    updateMap();
  };

  ws.onclose = () => {
    setTimeout(connectWS, 1000);
  };
}

// ===== SEARCH =====
const input = document.getElementById("searchInput");
const suggestionsBox = document.getElementById("suggestions");

let debounceTimer;

async function searchPlace(query) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=vn&limit=5&access_token=${mapboxgl.accessToken}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.features;
}

function renderSuggestions(places) {
  suggestionsBox.innerHTML = "";

  places.forEach(place => {
    const div = document.createElement("div");
    div.className = "suggestion";
    div.innerText = place.place_name;

    div.onclick = () => {
      const [lng, lat] = place.center;

      if (marker) marker.remove();

      marker = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(map);

      map.flyTo({
        center: [lng, lat],
        zoom: 15,
      });

      suggestionsBox.innerHTML = "";
      input.value = place.place_name;
    };

    suggestionsBox.appendChild(div);
  });
}

// ===== INPUT SEARCH =====
input.addEventListener("input", () => {
  const value = input.value.trim();

  if (!value) {
    suggestionsBox.innerHTML = "";
    return;
  }

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    const places = await searchPlace(value);
    renderSuggestions(places);
  }, 300);
});

// ===== ENTER SEARCH =====
input.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    const places = await searchPlace(input.value);

    if (places.length) {
      const [lng, lat] = places[0].center;

      map.flyTo({
        center: [lng, lat],
        zoom: 15,
      });
    }
  }
});

// ===== INIT =====
map.on("load", async () => {
  await loadInitial();
  addLayer();
  connectWS();
});
