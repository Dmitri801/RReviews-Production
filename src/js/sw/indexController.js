if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("../../serviceWorker.js")
      .then(res => res)
      .catch(err => console.log(`Service Worker Encountered an error: ${err}`));
  });
}

// IndexDB
if (!("indexedDB" in window)) {
  console.log("This browser doesn't support IndexedDB");
}
