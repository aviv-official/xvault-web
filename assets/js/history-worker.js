let db;
let objectStore;

let req = indexedDB.open("history", 1);
req.onupgradeneeded = function(e) {
    let db = e.target.result;
    objectStore = db.createObjectStore("history",{keyPath : "id"});
    objectStore.createIndex("from", "from", { unique: false });
    objectStore.createIndex("to", "to", { unique: false });
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
    
    if(event.data.query){
        let objectStore = db.transaction("history").objectStore("history");
        let res = [];
        console.debug("history query: ",event.data.query);
        let query = event.data.query;
        objectStore.openCursor().onsuccess = (evt)=>{
            let cursor = evt.target.result;
            if(cursor){
                //console.debug("cursor: ",cursor);
                if(cursor.value[query.key] == query.value){
                    res.push(cursor.value);
                }
                cursor.continue();
            }else{
                //console.debug("results: ",res);
                self.postMessage({type: "history", key:query.key, value: query.value, result:res});
            }
        }
    }else{
        //console.debug("new history item: ",event.data);
        let request = db.transaction(["history"], "readwrite")
                        .objectStore("history")
                        .put(event.data);
    }
}