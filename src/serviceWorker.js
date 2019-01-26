if (typeof idb === "undefined") {
  self.importScripts("js/idb/idb.js");
}

self.importScripts("js/idb/utility.js");

const cacheName = "v9";

const cacheAssets = [
  "index.html",
  "restaurant.html",
  "/css/styles.css",
  "/css/responsive.css",
  "/js/main.js",
  "/js/restaurant_info.js",
  "/js/dbhelper.js"
];

// Call install event

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(cacheAssets);
    })
  );
});

// Call Activate Event

self.addEventListener("activate", event => {
  // Remove unwanted caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cache => cache !== cacheName)
          .map(cacheNamesToDelete => caches.delete(cacheNamesToDelete))
      );
    })
  );
});

// Call Fetch Event
self.addEventListener("fetch", event => {
  const port = 1337;
  const url = `https://rrapi.restaurantreviews.live/restaurants`;

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then(res => {
        const clonedRes = res.clone();
        clonedRes.json().then(restaurantData => {
          restaurantData.forEach(restObj => {
            writeData("restaurants", restObj);
          });
        });
        return res;
      })
    );
  } else if (
    event.request.url.includes(`https://rrapi.restaurantreviews.live/reviews`)
  ) {
    event.respondWith(
      fetch(event.request).then(res => {
        const clonedRes = res.clone();
        clonedRes.json().then(reviewData => {
          reviewData.forEach(reviewObj => {
            writeData("reviews", reviewObj);
          });
        });
        return res;
      })
    );
  } else {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          // Make Copy/Clone
          const resClone = res.clone();
          caches.open(cacheName).then(cache => {
            // Add Response To Cache
            cache.put(event.request, resClone);
          });
          return res;
        })
        .catch(err => caches.match(event.request).then(res => res))
    );
  }
});

// Call sync event

self.addEventListener("sync", event => {
  console.log("[Service Worker] background syncing..", event);
  if (event.tag === "syncNewReview") {
    console.log("[Service Worker] syncing new review");
    event.waitUntil(
      readAllData("syncData").then(syncedData => {
        for (let newData of syncedData) {
          fetch(`https://rrapi.restaurantreviews.live/reviews`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: newData.id,
              restaurant_id: newData.restaurant_id,
              name: newData.name,
              rating: newData.rating,
              comments: newData.comments
            })
          })
            .then(res => {
              res.json().then(resData => {
                if (res.ok) {
                  deleteItemFromData("syncData", resData.id);
                }
              });
            })
            .catch(err => console.log(err));
        }
      })
    );
  }

  if (event.tag === "syncFavorite") {
    console.log("[Service Worker] syncing favorite request");
    event.waitUntil(
      readAllData("syncData").then(syncedData => {
        for (let newData of syncedData) {
          fetch(
            `https://rrapi.restaurantreviews.live/restaurants/${
              newData.restaurantId
            }/?is_favorite=true`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json"
              }
            }
          )
            .then(res => {
              res.json().then(resData => {
                if (res.ok) {
                  console.log(resData, newData.id);
                  deleteItemFromData("syncData", newData.id);
                }
              });
            })
            .catch(err => console.log(err));
        }
      })
    );
  }
  if (event.tag === "syncUnfavorite") {
    console.log("[Service Worker] syncing unfavorite request");
    event.waitUntil(
      readAllData("syncData").then(syncedData => {
        for (let newData of syncedData) {
          fetch(
            `https://rrapi.restaurantreviews.live/restaurants/${
              newData.restaurantId
            }/?is_favorite=false`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json"
              }
            }
          )
            .then(res => {
              res.json().then(resData => {
                if (res.ok) {
                  console.log(resData, newData.id);
                  deleteItemFromData("syncData", newData.id);
                }
              });
            })
            .catch(err => console.log(err));
        }
      })
    );
  }
});
