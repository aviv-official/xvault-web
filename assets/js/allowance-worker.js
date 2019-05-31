let db;
let objectStore;

let req = indexedDB.open("allowances", 1);
req.onupgradeneeded = function(e) {
    let db = e.target.result;
    objectStore = db.createObjectStore("allowances",{ keyPath: ['symbol','owner','spender']});
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
        console.debug("new allowance item: ",event.data);
        let request;
        if(event.data.value != 0){
            console.debug("adding or updating item");
            request = db.transaction(["allowances"], "readwrite")
                            .objectStore("allowances")
                            .put(event.data);
        }else{
            console.debug("deleting item");
            request = db.transaction(["allowances"], "readwrite")
                            .objectStore("allowances")
                            .delete([event.data.symbol,event.data.owner,event.data.spender]);
        }
        console.debug("allowance result: ",request);
    }
}