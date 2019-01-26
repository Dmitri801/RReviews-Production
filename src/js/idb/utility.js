const dbPromise = idb.open("restaurant-store", 1, db => {
  if (!db.objectStoreNames.contains("restaurants")) {
    db.createObjectStore("restaurants", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("reviews")) {
    db.createObjectStore("reviews", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("syncData")) {
    db.createObjectStore("syncData", { keyPath: "id" });
  }
});

function writeData(st, dataToWrite, primaryKey) {
  return dbPromise.then(db => {
    const tx = db.transaction(st, "readwrite");
    const store = tx.objectStore(st);
    store.put(dataToWrite, primaryKey);
    return tx.complete;
  });
}

function readAllData(st) {
  return dbPromise.then(db => {
    const tx = db.transaction(st, "readwrite");
    const store = tx.objectStore(st);
    return store.getAll();
  });
}

function deleteItemFromData(st, key) {
  return dbPromise
    .then(db => {
      const tx = db.transaction(st, "readwrite");
      const store = tx.objectStore(st);
      store.delete(key);
      return tx.complete;
    })
    .then(() => {
      console.log("Item Deleted");
    });
}
