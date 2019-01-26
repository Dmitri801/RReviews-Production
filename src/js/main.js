let restaurants, neighborhoods, cuisines;
var newMap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      networkDataRecieved = true;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");

  cuisines.forEach(cuisine => {
    const option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map("map", {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",
    {
      mapboxToken:
        "pk.eyJ1IjoiZGotc2hhcjg4IiwiYSI6ImNqbnVjbWRlcjEzNzIzcHByNW9mcHU4ZGkifQ.g5uLeXHIcB1KRvrt4u14HQ",
      maxZoom: 18,
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: "mapbox.streets"
    }
  ).addTo(newMap);

  updateRestaurants();
};
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  restaurants.forEach((restaurant, index) => {
    if (index < 3) {
      ul.append(createRestaurantHTML(restaurant));
    }
  });
  addMarkersToMap();
};

// Add event listener to lazy load images
window.addEventListener("scroll", (event, restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  if (window.scrollY > 1 && ul.children.length <= 3) {
    console.log("Lazy loadin' fam..");
    restaurants.forEach((restaurant, index) => {
      if (index > 3) {
        ul.append(createRestaurantHTML(restaurant));
      }
    });
  }
});

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement("li");
  const pictureElement = document.createElement("picture");
  const srcElementOne = document.createElement("source");
  const srcElementTwo = document.createElement("source");
  const srcElementMain = document.createElement("source");
  const image = document.createElement("img");
  image.className = "restaurant-img";
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute("alt", `Image for ${restaurant.name}`);
  srcElementOne.setAttribute(
    "media",
    "(min-width: 1148px) and (max-width: 1372px)"
  );

  srcElementTwo.setAttribute("media", "(max-width: 446px)");
  srcElementOne.setAttribute("srcset", `/webpimg/${restaurant.id}-small.webp`);
  srcElementTwo.setAttribute("srcset", `/webpimg/${restaurant.id}-small.webp`);
  srcElementMain.setAttribute(
    "srcset",
    `/webpimg/${restaurant.id}-medium.webp`
  );
  pictureElement.appendChild(srcElementMain);
  pictureElement.appendChild(srcElementOne);
  pictureElement.appendChild(srcElementTwo);
  pictureElement.appendChild(image);
  li.append(pictureElement);

  const name = document.createElement("h2");
  name.innerHTML = restaurant.name;
  li.append(name);

  const addressContainer = document.createElement("div");
  addressContainer.className = "restaurant-address-container";

  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.className = "restaurant-neighborhood";
  addressContainer.append(neighborhood);

  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  addressContainer.append(address);
  li.append(addressContainer);
  const more = document.createElement("a");
  more.innerHTML = "View Details";
  more.setAttribute("aria-label", `View Details for ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    }); 
    self.markers.push(marker);
  });
} */
