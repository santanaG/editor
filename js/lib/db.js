'use strict';

const DB = {

    async init(dbName = 'db', version = 1, storeName = 'store') {
        // config
        this.dbName     = dbName;
        this.dbVersion  = version;
        this.storeName  = storeName;

        this.db;

        return await new Promise( (resolve, reject) => {
            let request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.log(`failed to load DB: ${this.dbName}`);
                reject();
            }
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log(`successfully connected to DB: ${this.dbName}`);
                resolve();
            }
            request.onupgradeneeded = (event) => {
                let db = event.target.result;

                if( !db.objectStoreNames.contains(this.storeName) ) {
                    db.createObjectStore(this.storeName);
                }
            }
        });

    },

    // IndexedDB is a (mostly) asynchronous API, so provide the option for a callback.
    setItem(key, value) {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction([this.storeName], 'readwrite');
            let store       = transaction.objectStore(this.storeName);

            let request = store.put(value, key);

            request.onsuccess = () => {
                console.log('DB saved!');
                resolve();
            }
            request.onerror = () => {
                reject(`could not set item: ${key} on ${this.storeName}`);
            }
        });
    },

    getItem(key) {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction(this.storeName, 'readonly');
            let store       = transaction.objectStore(this.storeName);
    
            let request = store.get(key);
    
            request.onsuccess = (e) => {
                resolve(e.target.result);
            }
            request.onerror = () => {
                reject(`could not get item: ${key} from ${this.storeName}`);
            }
        });
    },

    clear() {
        let transaction = this.db.transaction(this.storeName, 'readwrite');
        let store       = transaction.objectStore(this.storeName);

        store.clear();
    }
}
