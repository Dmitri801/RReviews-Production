/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    const devURL = `http://localhost:${port}/restaurants`;
    const productionURL = `https://rrapi.restaurantreviews.live`;
    return productionURL;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let networkDataRecieved = false;
    fetch(`${DBHelper.DATABASE_URL}/restaurants`)
      .then(res => res.json())
      .then(restaurants => {
        networkDataRecieved = true;
        callback(null, restaurants);
      })
      .catch(err => {
        if ("indexedDB" in window) {
          readAllData("restaurants").then(data => {
            if (!networkDataRecieved) {
              console.log("From Cache:", data);
              callback(null, data);
            }
          });
        }
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    let networkDataRecieved = false;
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
      .then(res => res.json())
      .then(restaurant => {
        fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`)
          .then(data => data.json())
          .then(reviewData => {
            networkDataRecieved = true;
            restaurant.reviews = reviewData;
            writeData("restaurants", restaurant);
            callback(null, restaurant);
          });
      })
      .catch(err => {
        if ("indexedDB" in window) {
          if (!networkDataRecieved) {
            let restaurantObj = {};
            readAllData("restaurants")
              .then(restaurants => {
                restaurants.forEach(restaurant => {
                  if (restaurant.id == id) {
                    restaurantObj = restaurant;
                    restaurantObj.reviews = [];
                  }
                });
              })
              .then(() => {
                readAllData("reviews").then(reviews => {
                  reviews.forEach(review => {
                    if (review.restaurant_id == id) {
                      restaurantObj.reviews.push(review);
                    }
                  });
                  console.log("From Cache:", restaurantObj);
                  callback(null, restaurantObj);
                });
              });
          }
        }
      });
  }

  static favoriteRestaurant(id, callback) {
    fetch(
      `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=true
    `,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
      .then(res => {
        return res.json();
      })
      .then(restaurant => {
        callback();
      });
  }

  static unfavoriteRestaurant(id, callback) {
    fetch(
      `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=false
    `,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
      .then(res => {
        return res.json();
      })
      .then(restaurant => {
        callback();
      });
  }

  static postNewReview(newReview, callback) {
    fetch(`${DBHelper.DATABASE_URL}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newReview)
    }).then(res => {
      if (res.status === 201) {
        callback();
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `/images/${restaurant.id}-medium.jpg`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */
}
