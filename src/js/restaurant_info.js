const reviewList = document.getElementById("reviews-list");
const accordion = document.querySelector(".accordion-btn");
const restaurantHours = document.getElementById("restaurant-hours");
const addReviewBtn = document.getElementById("addReviewBtn");
const modal = document.getElementById("mainModal");
const closeBtn = document.getElementById("closeBtn");
const stars = document.querySelectorAll("input[name='star']");
const selectRatingTxt = document.getElementById("selectRatingTxt");
const addReviewForm = document.getElementById("addReviewForm");
const ratingInput = document.getElementById("ratingValue");
const nameInput = document.getElementById("nameInput");
const commentsInput = document.getElementById("commentsInput");
const favoriteContainer = document.getElementById("favoriteBtn");
const snackBar = document.getElementById("snackBar");
const snackBarMsg = document.getElementById("snackbarMsg");
const snackBarDismiss = document.getElementById("snackbarDismiss");
const heartIcon = document.createElement("i");
heartIcon.setAttribute("role", "button");
heartIcon.setAttribute("tabindex", "0");
heartIcon.setAttribute("aria-label", "Add Restaurants to Favorites");

let restaurant;
var newMap;

// Check if browser is running incognito mode
let incognito;
const isIncognito = () =>
  new Promise((resolve, reject) => {
    const fs = window.RequestFileSystem || window.webkitRequestFileSystem;

    if (!fs) {
      reject("Cant determine whether browser is running in incognito mode!");
    }

    fs(
      window.TEMPORARY,
      100,
      resolve.bind(null, false),
      resolve.bind(null, true)
    );
  });

isIncognito()
  .then(res => {
    incognito = res;
  })
  .catch(console.log);

class Toaster {
  constructor(element, message, type) {
    this.element = element;
    this.message = message;
    this.type = type;
  }
  static show(element, message, type) {
    if (type === "error") {
      snackBarMsg.style.color = "red";
    } else if (type === "success") {
      snackBarMsg.style.color = "green";
    }
    snackBarMsg.innerHTML = message;
    element.classList.add("activate");
    document.getElementById("snackbarDismiss").setAttribute("tabindex", "0");
    setTimeout(() => {
      element.classList.remove("activate");
      document.getElementById("snackbarDismiss").setAttribute("tabindex", "-1");
    }, 7700);
  }
  static dismiss(element) {
    element.style.opacity = 0;

    setTimeout(() => {
      element.classList.remove("activate");
      element.style.opacity = 1;
    }, 50);
  }
}

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  const mainContent = document.querySelector("main");
  const map = document.querySelector("#map-container");
  const restImage = document.querySelector("#restaurant-pic");
  const restInfoDiv = document.querySelector("#restaurant-info");
  const mapSection = document.createElement("section");
  const mapDiv = document.createElement("div");

  if (window.innerWidth < 949 && map !== null) {
    mainContent.removeChild(map);
    mapSection.setAttribute("id", "map-container-mobile");
    mapDiv.setAttribute("id", "map");
    mapDiv.setAttribute("role", "application");
    mapDiv.setAttribute("aria-label", "Map for restaurant");
    mapSection.appendChild(mapDiv);
    restInfoDiv.insertBefore(mapSection, restImage);
    setTimeout(() => {
      initMap();
    }, 200);
  } else {
    initMap();
  }
});

snackBarDismiss.addEventListener("click", () => {
  Toaster.dismiss(snackBar);
});
snackBarDismiss.addEventListener("keydown", e => {
  if (e.keyCode == 13) {
    Toaster.dismiss(snackBar);
  }
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map("map", {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

// Init Map Function on screen change
initMapOnScreenChange = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map("map", {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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

      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName("id");
  if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

function favoriteRestaurantSync(restaurantId) {
  const favoriteData = {
    id: Date.now(),
    restaurantId
  };
  if ("serviceWorker" in navigator && "SyncManager" in window && !incognito) {
    navigator.serviceWorker.ready.then(sw => {
      writeData("syncData", favoriteData).then(data => {
        return sw.sync
          .register("syncFavorite")
          .then(() => {
            if (!navigator.onLine) {
              Toaster.show(
                snackBar,
                "You have no internet! We'll send the request when there's a connection 🤗 ",
                "error"
              );
              heartIcon.classList.add("favorite");
              heartIcon.setAttribute("aria-pressed", "true");
            } else {
              heartIcon.classList.add("favorite");
              heartIcon.setAttribute("aria-pressed", "true");
              Toaster.show(
                snackBar,
                "Restaurant added to favorites!",
                "success"
              );
            }
          })
          .catch(err => {
            console.log(err);
          });
      });
    });
  } else {
    DBHelper.favoriteRestaurant(restaurantId, () => {
      console.log("Background Sync Unsupported");
      heartIcon.classList.add("favorite");
      Toaster.show(snackBar, "Restaurant added to favorites!", "success");
    });
  }
}

function unfavoriteRestaurantSync(restaurantId) {
  const unfavoriteData = {
    id: Date.now(),
    restaurantId
  };
  if ("serviceWorker" in navigator && "SyncManager" in window && !incognito) {
    navigator.serviceWorker.ready.then(sw => {
      writeData("syncData", unfavoriteData).then(data => {
        return sw.sync
          .register("syncUnfavorite")
          .then(() => {
            if (!navigator.onLine) {
              Toaster.show(
                snackBar,
                "You have no internet! We'll send the request when there's a connection 🤗 ",
                "error"
              );
              heartIcon.classList.remove("favorite");
              heartIcon.setAttribute("aria-pressed", "false");
            } else {
              heartIcon.classList.remove("favorite");
              heartIcon.setAttribute("aria-pressed", "false");
              Toaster.show(
                snackBar,
                "Restaurant removed from favorites!",
                "success"
              );
            }
          })
          .catch(err => {
            console.log(err);
          });
      });
    });
  } else {
    console.log("Background Sync Unsupported");
    DBHelper.unfavoriteRestaurant(restaurantId, () => {
      heartIcon.classList.remove("favorite");
      Toaster.show(snackBar, "Restaurant removed from favorites!", "success");
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  if (
    restaurant.is_favorite == "true" ||
    heartIcon.classList.contains("favorite")
  ) {
    heartIcon.className = "fas fa-heart";
    heartIcon.classList.add("favorite");
    heartIcon.setAttribute("aria-pressed", "true");
    heartIcon.addEventListener("click", () => {
      if (heartIcon.classList.contains("favorite")) {
        unfavoriteRestaurantSync(restaurant.id);
      } else {
        favoriteRestaurantSync(restaurant.id);
      }
    });
    heartIcon.addEventListener("keydown", e => {
      if (e.keyCode == 13) {
        if (heartIcon.classList.contains("favorite")) {
          unfavoriteRestaurantSync(restaurant.id);
        } else {
          favoriteRestaurantSync(restaurant.id);
        }
      }
    });
    favoriteContainer.appendChild(heartIcon);
  }

  if (
    restaurant.is_favorite == "false" ||
    false ||
    !heartIcon.classList.contains("favorite")
  ) {
    heartIcon.className = "fas fa-heart";
    heartIcon.classList.remove("favorite");
    heartIcon.setAttribute("aria-pressed", "false");
    heartIcon.addEventListener("click", () => {
      if (!heartIcon.classList.contains("favorite")) {
        favoriteRestaurantSync(restaurant.id);
      } else {
        unfavoriteRestaurantSync(restaurant.id);
      }
    });
    heartIcon.addEventListener("keydown", e => {
      if (e.keyCode == 13) {
        if (!heartIcon.classList.contains("favorite")) {
          favoriteRestaurantSync(restaurant.id);
        } else {
          unfavoriteRestaurantSync(restaurant.id);
        }
      }
    });
    favoriteContainer.appendChild(heartIcon);
  }
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const address = document.getElementById("restaurant-address");
  address.innerHTML = `<i id="address-icon" class="fas fa-map-marker-alt"></i> ${
    restaurant.address
  }`;
  const title = document.getElementById("restaurant-title");
  title.innerHTML = restaurant.name;
  title.setAttribute("tabindex", "-1");
  const restImage = document.querySelector("#restaurant-pic");
  const mainPictureSrc = document.createElement("source");
  mainPictureSrc.setAttribute(
    "srcset",
    `/webpimg/${restaurant.id}-medium.webp`
  );
  const smallImgSrc = document.querySelector(".src-small-pic");
  smallImgSrc.setAttribute("srcset", `/images/${restaurant.id}-small.jpg`);
  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute("alt", `Image for ${restaurant.name}`);
  restImage.insertBefore(mainPictureSrc, restImage.childNodes[0]);
  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // Add title to review form
  const reviewFormHeader = document.getElementById("addReviewHeader");
  reviewFormHeader.innerHTML += restaurant.name;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    day.classList.add("restaurant-hours-day");
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById("reviews-content");
  const title = document.createElement("h3");
  title.innerHTML = "Reviews";
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement("li");
  const name = document.createElement("p");
  const reviewHead = document.createElement("div");
  const reviewContent = document.createElement("div");
  function generateStars(star, reviewRating) {
    let totalStars = "";
    while (reviewRating > 0) {
      totalStars += star;
      reviewRating--;
    }
    return `
     <div class="stars">
      ${totalStars}
     </div>
    `;
  }
  reviewHead.setAttribute("class", "review-head");
  name.innerHTML = review.name;
  name.setAttribute("class", "review-name");
  reviewHead.appendChild(name);

  const date = document.createElement("p");

  let reviewDate = moment(review.createdAt).format("dddd, MMMM Do YYYY");

  date.innerHTML = reviewDate;
  date.setAttribute("class", "review-date");
  reviewHead.appendChild(date);

  li.appendChild(reviewHead);
  reviewContent.setAttribute("class", "review-content");
  const rating = document.createElement("p");
  rating.innerHTML = ` ${generateStars("⭐", review.rating)}`;
  rating.setAttribute("class", "review-rating");
  reviewContent.appendChild(rating);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  comments.setAttribute("class", "review-comments");
  reviewContent.appendChild(comments);

  li.appendChild(reviewContent);
  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

// Accordion
accordion.addEventListener("click", () => {
  accordionOperator();
});

function accordionOperator() {
  if (accordion.getAttribute("aria-expanded") === "false") {
    accordion.classList.add("active");
    restaurantHours.style.display = "block";
    restaurantHours.style.maxHeight = `${restaurantHours.scrollHeight}px`;
    accordion.setAttribute("aria-expanded", "true");
  } else if (accordion.getAttribute("aria-expanded") === "true") {
    accordion.classList.remove("active");
    restaurantHours.style.maxHeight = 0;
    accordion.setAttribute("aria-expanded", "false");
  }
}

// Screen event listener

window.addEventListener("resize", () => {
  const mainContent = document.querySelector("main");
  const map = document.querySelector("#map-container");
  const mobileMap = document.querySelector("#map-container-mobile");
  const restImage = document.querySelector("#restaurant-pic");
  const restInfoDiv = document.querySelector("#restaurant-info");
  const mapSection = document.createElement("section");
  const mapDiv = document.createElement("div");

  if (window.innerWidth < 949 && map !== null) {
    mainContent.removeChild(map);
    mapSection.setAttribute("id", "map-container-mobile");
    mapDiv.setAttribute("id", "map");
    mapDiv.setAttribute("role", "application");
    mapDiv.setAttribute("aria-label", "Map for restaurant");
    mapSection.appendChild(mapDiv);
    restInfoDiv.insertBefore(mapSection, restImage);
    setTimeout(() => {
      initMapOnScreenChange();
    }, 200);
  } else if (window.innerWidth > 949 && map === null) {
    restInfoDiv.removeChild(mobileMap);
    mapSection.setAttribute("id", "map-container");
    mapDiv.setAttribute("id", "map");
    mapDiv.setAttribute("role", "application");
    mapDiv.setAttribute("aria-label", "Map for restaurant");
    mapSection.appendChild(mapDiv);
    mainContent.appendChild(mapSection);
    setTimeout(() => {
      initMapOnScreenChange();
    }, 200);
  }
});

// Modal -- ADD A REVIEW
const reviewMessage = [
  "Select A Rating",
  "It was terrible!",
  "Not impressed..",
  "Not bad, not too good.",
  "I liked it.",
  "Awesome, fantastic!"
];

addReviewBtn.addEventListener("click", openReviewModal);
closeBtn.addEventListener("click", e => {
  closeReviewModal();
});
window.addEventListener("click", outsideModalClick);
function openReviewModal(e) {
  modal.style.display = "block";
  setStarRating();
  document.getElementById("wrapper").setAttribute("aria-hidden", true);
  document.getElementById("wrapper").setAttribute("aria-disabled", true);
  document.getElementById("nameInput").focus();
  document.addEventListener("keydown", setEscapeToCloseModal);
  document.addEventListener("keydown", trapTabKey);
}
function closeReviewModal(onReviewSubmit) {
  modal.style.display = "none";
  document.getElementById("wrapper").setAttribute("aria-hidden", false);
  document.removeEventListener("keydown", setEscapeToCloseModal);
  document.removeEventListener("keydown", trapTabKey);
  if (!onReviewSubmit) {
    addReviewBtn.focus();
  } else {
    snackBar.setAttribute("tabindex", "0");
    snackBar.focus();
    setTimeout(() => {
      snackBar.setAttribute("tabindex", "-1");
    }, 3000);
  }
}

function outsideModalClick(e) {
  if (e.target === modal) {
    closeReviewModal();
  }
}

function trapTabKey(e) {
  if (e.keyCode === 9 && document.activeElement.value === "Submit") {
    closeBtn.focus();
  }
  if (e.keyCode === 9 && document.activeElement.nodeName === "BUTTON") {
    e.preventDefault();
    nameInput.focus();
  }
}

function setEscapeToCloseModal(e) {
  if (e.keyCode === 27) {
    closeReviewModal();
  }
}

function setStarRating() {
  stars.forEach((star, index) => {
    star.addEventListener("change", event => {
      setRating(event.target);
    });
    star.addEventListener("keydown", event => {
      if (event.keyCode == 13) {
        setRating(event.target);
      }
      if (event.keyCode == 39 || event.keyCode == 40) {
        event.preventDefault();
        if (index !== 0) {
          setRating(
            stars[index].previousSibling.previousSibling.previousSibling,
            event
          );
        } else {
          setRating(stars[4], event);
        }
      }
      if (event.keyCode == 37 || event.keyCode == 38) {
        event.preventDefault();

        if (index == 4) {
          setRating(stars[0], event);
        } else {
          setRating(stars[index].nextSibling.nextSibling.nextSibling, event);
        }
      }
    });
  });

  selectRatingTxt.innerHTML =
    reviewMessage[parseInt(ratingInput.getAttribute("data-rating"))];
}

// TextArea scroll listen
commentsInput.addEventListener("scroll", event => {
  if (commentsInput.scrollTop !== 0) {
    document.querySelector('label[for="comments"]').style.opacity = 0;
  } else if (commentsInput.scrollTop === 0) {
    document.querySelector('label[for="comments"]').style.opacity = 1;
  }
});

// Star rating select

function setRating(element) {
  ratingInput.setAttribute("data-rating", element.value);
  element.checked = true;
  element.focus();
  selectRatingTxt.innerHTML =
    reviewMessage[parseInt(ratingInput.getAttribute("data-rating"))];
  stars.forEach(star => {
    if (star.checked) {
      star.setAttribute("tabindex", "0");
    } else {
      star.setAttribute("tabindex", "-1");
    }
  });
}

// Review Submission POST

addReviewForm.addEventListener("submit", e => {
  e.preventDefault();
  submitReviewForm();
});

function submitReviewForm(restaurant = self.restaurant) {
  if (ratingInput.getAttribute("data-rating") == 0) {
    Toaster.show(snackBar, "Rating is required.", "error");
    stars[4].focus();
  } else {
    let newReview = {
      id: Date.now(),
      restaurant_id: restaurant.id,
      name: nameInput.value,
      rating: parseInt(ratingInput.getAttribute("data-rating")),
      comments: commentsInput.value
    };
    if ("serviceWorker" in navigator && "SyncManager" in window && !incognito) {
      navigator.serviceWorker.ready.then(sw => {
        writeData("syncData", newReview).then(data => {
          return sw.sync
            .register("syncNewReview")
            .then(() => {
              if (!navigator.onLine) {
                Toaster.show(
                  snackBar,
                  "You have no internet! We'll send the review when there's a connection 🤗 ",
                  "error"
                );
                closeReviewModal(true);
                reviewList.appendChild(createReviewHTML(newReview));
                clearReviewInputs();
              } else {
                Toaster.show(snackBar, "Review Added!", "success");
                closeReviewModal(true);
                reviewList.appendChild(createReviewHTML(newReview));
                clearReviewInputs();
              }
            })
            .catch(err => {
              console.log(err);
            });
        });
      });
    } else {
      DBHelper.postNewReview(newReview, () => {
        console.log("Background Sync Unsupported");
        Toaster.show(snackBar, "Review Added!", "success");
        closeReviewModal(true);
        reviewList.appendChild(createReviewHTML(newReview));
        clearReviewInputs();
      });
    }
  }
}

function clearReviewInputs() {
  ratingInput.setAttribute("data-rating", "0");
  stars.forEach(star => {
    star.checked = false;
  });
  nameInput.value = "";
  commentsInput.value = "";
}
