let db;
let objectStore;

let req = indexedDB.open("allowances", 1);
req.onupgradeneeded = function(e) {
    let db = e.target.result;
    objectStore = db.createObjectStore("allowances",{keyPath : "id"});
    objectStore.createIndex("spender", "spender", { unique: false });
    objectStore.createIndex("owner", "owner", { unique: false });
    objectStore.createIndex("symbol", "symbol", { unique: false });
    objectStore.createIndex("tokens", "tokens", { unique: false });
    //self.postMessage("Successfully upgraded db");
};
req.onsuccess = function(e) {
    db = req.result;
};
req.onerror = function(e) {
    self.postMessage("error");
};

self.onmessage = function(event) {
    //console.debug("allowance: ",event);
    if(event.data.query){
        //figure out a query schema.
    }else{
        //console.debug("new allowance item: ",event.data);
        //let request = db.transaction(["allowances"], "readwrite")
          //              .objectStore("allowances")
            //            .put(event.data);
    }
}