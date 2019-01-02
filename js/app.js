'use strict';

/**

    Editor();

    This is the main object which glues all the components together.
    Upon initialisation, we:
    - Load the listed assets.
    - Initialise the database.
    - Load data. If there was local data, then add any new objects from the config. If not, use the config data.
    - Setup the UI.
    - Setup the Viewport, Map and layers.
    - Render the map.
    - Setup events.

 **/

const Editor = {

    async init(config = {}) {

        // set up a global object for use throughout the app.
        window.Global           = {};

        // Set Globals
        Global.TILE_SIZE        = config.tile_size  || 8;
        Global.scale            = config.scale      || 3;
        Global.assetPath        = config.asset_path || '';

        Global.world            = {};
        Global.tilesetsArray    = []; // array of Sprite objects
        Global.collisionTiles   = []; // array of canvas elements
        Global.entityArray      = []; // array of Entity objects

        // some initialisation stuff
        this.maps               = config.maps       || [{ "name": "default", "width": 32, "height": 22 }];
        this.layers             = config.layers     || [{ "name": "bg" }];
        this.tilesets           = config.tilesets   || [];
        this.entities           = config.entities   || [];
        this.animations         = config.animations || [];
        this.saveTimeoutID      = null;

        // construct the internal data structure
        Global.world.maps = [];
        for (const mapObj of this.maps) {
            const obj = {
                name: mapObj.name,
                width: mapObj.width,
                height: mapObj.height,
                layers: [],
            };
            for (const layerObj of this.layers) {
                obj.layers.push({
                    name: layerObj.name,
                });
            }
            Global.world.maps.push(obj);
        }

        // load all the things!
        await DB.init('editor', 1, 'world');
        await this.loadData();
        await this.loadAssets();
        this.createWorldObjects();
        UI.init({maps: this.maps, layers: this.layers});
        Viewport.init();
        this.setupEvents();
    },

    /**
     * Loops through the provided list of assets and loads them into memory.
     * Returns a promise.
     */
    loadAssets() {
        const promises = [];

        // loop through the provided tilesetsand create an array of promises
        for (const tileset of this.tilesets) {
            const sprite = Object.create(Sprite);
            Global.tilesetsArray.push(sprite);

            promises.push(sprite.init(tileset.name, Global.assetPath + tileset.src));
        }

        return Promise.all(promises);
    },

    createWorldObjects() {

        // Entities
        for (const item of this.entities) {
            // create the entity
            const entity = Object.create(Entity).init(item.id, item.tileset, item.data);
            entity.render();

            Global.entityArray.push(entity);
        }

        // Collisions
        for (var tile = 1; tile <= 5; tile++) {
            let canvas          = document.createElement('canvas');
            let context         = canvas.getContext('2d');

            canvas.width        = Global.TILE_SIZE;
            canvas.height       = Global.TILE_SIZE;
            context.fillStyle   = 'rgba(255, 0, 0, 0.3)';
            context.strokeStyle = 'rgba(255, 0, 0, 0.9)';

            switch (tile) {
                case 1: // full tile collision
                    context.fillRect(0, 0, Global.TILE_SIZE, Global.TILE_SIZE);
                    context.strokeRect(0.5, 0.5, Global.TILE_SIZE-1, Global.TILE_SIZE-1);
                    break;
                case 2: // top left corner
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(Global.TILE_SIZE, 0);
                    context.lineTo(0, Global.TILE_SIZE);
                    context.closePath();
                    context.fill();

                    context.beginPath();
                    context.moveTo(Global.TILE_SIZE, 0)
                    context.lineTo(0, Global.TILE_SIZE);
                    context.stroke();
                    break;
                case 3: // top right corner
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(Global.TILE_SIZE, Global.TILE_SIZE);
                    context.lineTo(Global.TILE_SIZE, 0);
                    context.closePath();
                    context.fill();

                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(Global.TILE_SIZE, Global.TILE_SIZE);
                    context.stroke();
                    break;
                case 4: // bottom right corner
                    context.beginPath();
                    context.moveTo(Global.TILE_SIZE, 0); // top right
                    context.lineTo(0, Global.TILE_SIZE); // bottom left
                    context.lineTo(Global.TILE_SIZE, Global.TILE_SIZE); // bottom right
                    context.closePath();
                    context.fill();

                    context.beginPath();
                    context.moveTo(Global.TILE_SIZE, 0)
                    context.lineTo(0, Global.TILE_SIZE);
                    context.stroke();
                    break;
                case 5: // bottom left corner
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(0, Global.TILE_SIZE);
                    context.lineTo(Global.TILE_SIZE, Global.TILE_SIZE);
                    context.closePath();
                    context.fill();

                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(Global.TILE_SIZE, Global.TILE_SIZE);
                    context.stroke();
                    break;
            }

            // scale
            canvas.style['width']  = `${Global.TILE_SIZE * Global.scale}px`;
            canvas.style['height'] = `${Global.TILE_SIZE * Global.scale}px`;

            Global.collisionTiles.push(canvas);
        }
    },

    /**
     * Listen for certain events set certain functions to trigger.
     */
    setupEvents() {
        Eventer.on('addPattern',    () => this.save() );
        Eventer.on('addCollision',  () => this.save() );
        Eventer.on('addEntity',     () => this.save() );
        Eventer.on('deleteTile',    () => this.save() );
        Eventer.on('export',        () => this.exportData() );
        Eventer.on('selectMap',     async (idx) => {
            console.log('saving map...', idx);
            localStorage.setItem('selectedMap', idx);
        });
        _('.Modal .copy').addEventListener('click', () => {
            this.copyContent();
        });
        _('.Modal .import').addEventListener('click', () => {
            this.importDB( _('.Modal-content').innerText );
            UI.Modal.hide();
            Viewport.currentMap = Global.world.maps[0];
            Viewport.currentMap.setup();
            Viewport.render();
        });

        document.addEventListener('keyup', (e) => {            
            if (e.keyCode === 27) { // ESC
                UI.deselectAll();
                Viewport.ghostTile.hide();
                UI.toPlace = null;
                UI.selectedPattern = null;
            }
        });
    },

    buildWorld() {
        let world = {};

        world.version   = CONFIG.version;
        world.tile_size = Global.TILE_SIZE;
        world.maps      = [];

        for (var map of Global.world.maps) {
            world.maps.push({
                "name":     map.name,
                "width":    map.TILES_WIDE,
                "height":   map.TILES_HIGH,
                "layers":   map.layers.map((layer) => layer.export()),
            });
        }

        return world;
    },

    /**
     * Save all map data.
     */
    save() {
        clearTimeout(this.saveTimeoutID);

        this.saveTimeoutID = setTimeout(function () {
            console.log('saving...');

            const world = Editor.buildWorld();

            DB.setItem('world', world);
        }, 1000);
    },

    /**
     * Load map data
     */
    async loadData() {

        const result = await DB.getItem('world');

        let world   = {};
        world.maps  = [];

        // level data found. Load it.
        if( result !== undefined ) {
            console.log('world found');

            // loop over the maps and layers we got from the CONFIG and
            // apply any data stored for them. 
            for (let i = 0; i < Global.world.maps.length; i++) {
                const item = result.maps.find((obj) => obj.name === Global.world.maps[i].name);

                if (item) {
                    for (let j = 0; j < Global.world.maps[i].layers.length; j++) {
                        const l = item.layers.find((obj) => obj.name === Global.world.maps[i].layers[j].name);
                        if (l) {
                            Global.world.maps[i].layers[j].data         = l.data;
                            Global.world.maps[i].layers[j].tilesetNames = l.tilesetNames;
                        }
                    }
                }
            }
        }

        // construct the map and layer world objects
        for (const mapConfig of Global.world.maps) {
            let map = Object.create(GameMap);
            map.init({
                name: mapConfig.name,
                width: mapConfig.width,
                height: mapConfig.height
            }, mapConfig.layers);

            world.maps.push(map);
        }

        // store the map data globally.
        Global.world = world;
    },

    /**
     * Super destructive. Clears the whole database.
     */
    deleteData() {
        DB.clear();
    },


    /**
     * Each tileset is given a GID (Not actually sure what the G is for, I picked up the idea from Tiled editor) but what it does is give
     * a tileset an ID so we can figure out which atlas a particular tile belongs to.
     *
     * Example:
     * A cell is saved with an ID of 187. By iterating backwards through the atlases, we can compare the ID against the GIDs and determine which range it sits in:
     * GID 1: 0
     * GID 2: 127
     * GID 3: 206
     * - 187 is less than 206 but larger than 127, so it is from the second atlas.
     *
     * Generally speaking, each GID is either the number of the previous atlas (plus 1) or the next chosen interval up (multiples of 128 or something)
     */
    calculateAtlasGIDs() {
        let gids            = {};
        let previousCount   = 0;

        for (var tileset of Global.tilesetsArray) {
            gids[tileset.name]  = previousCount;
            previousCount       += tileset.TILES_WIDE * tileset.TILES_HIGH;
        }

        return gids;
    },

    /**
     * Export the DB to a JSON string.
     * No optimisations made. Need the output as close to how the DB saves it as possible so we can import it back in.
     */
    exportDB() {
        const startTime = window.performance.now();
        
        const world = Editor.buildWorld();
        const str   = prettify(JSON.stringify(world));
        
        const endTime = window.performance.now();
        console.log(`Export for save time: ${endTime - startTime}ms`)
        return str;
    },

    /**
     * Import the DB from a JSON string.
     */
    importDB(worldStr = '') {
        if (worldStr === '') {
            return;
        }

        const parsed = JSON.parse(worldStr);

        console.log('importing...');

        const world = {};
        world.maps = [];

        for (var cfg of parsed.maps) {
            let map = Object.create(GameMap);
            map.init(cfg, cfg.layers);

            world.maps.push(map);
        }

        // store the map data globally.
        Global.world = world;
        console.log('world imported!');
    },

    /**
     * Export the world to a JSON string.
     * Here we optimise the output to be smaller and more efficient. Designed to be
     * consumed by the game instead of this app.
     */
    exportData() {
        const startTime = window.performance.now();

        // convert the internal data to a game’s level structure.
        const world = {};

        // add tile size
        world.tile_size = Global.TILE_SIZE;

        // calculate sprite GIDs
        const atlasGIDs = this.calculateAtlasGIDs();

        // add tilesets
        world.tilesets = [];

        for (var tileset of Global.tilesetsArray) {
            const gid = atlasGIDs[ tileset.name ] || 0;

            world.tilesets.push({
                id:     tileset.name,
                name:   tileset.filename,
                width:  tileset.width,
                height: tileset.height,
                gid,
            });
        }

        // add maps
        world.maps = {};

        // loop over the maps
        for (var map of Global.world.maps) {
            world.maps[map.name]                = {};
            world.maps[map.name]['layers']      = [];
            world.maps[map.name]['tiles_wide']  = map.TILES_WIDE;
            world.maps[map.name]['tiles_high']  = map.TILES_HIGH;

            // loop over the layers
            for (var layer of map.layers) {

                // now we need to go one step further and calculate the GIDs for each tile.
                // (for typical layers)
                let newIndexes = [];

                if( layer.name === 'collision' ) {
                    newIndexes = layer.data; // no change
                }
                else if( layer.name === 'entities' ) {
                    newIndexes = layer.data; // no change
                }
                else {
                    for (var i = 0; i < layer.data.length; i++) {
                        const gid = atlasGIDs[ layer.tilesetNames[i] ] || 0;
                        const idx = layer.data[i] === null ? null : (layer.data[i] + gid);
                        newIndexes.push(idx);
                    }
                }

                world.maps[map.name]['layers'].push({
                    name: layer.name,
                    data: newIndexes
                });

            }
        }

        // add animations
        world.animations = [];

        for(var obj of this.animations) {
            const gid       = atlasGIDs[ obj.tileset ] || 0;
            const newArr    = [];

            for(var i = 0; i < obj.tiles.length; i++) {
                newArr.push(obj.tiles[i] + gid);
            }

            world.animations.push(newArr);
        }

        // I now know that JSON.stringify does have a way to prettify code (third param), but in this case it’s too eager.
        // It also splits the arrays by their commas which makes for large numbers of lines; precisely what I’m trying to avoid.
        const worldStr = prettify( JSON.stringify(world) );

        UI.Modal.show();
        UI.Modal.content(worldStr);
        _('.Modal .copy').style.display = 'inline-block';
        
        const endTime = window.performance.now();
        console.log(`Export time: ${endTime - startTime}ms`)
    },

    /**
     * Export the world to a JSON string.
     * Here we optimise the output to be smaller and more efficient.
     */
    importData() {},

    copyContent() {
        let code = document.querySelector('.Modal-content code');
        let range;
        let selection;

        if (document.body.createTextRange) {
            range = document.body.createTextRange();
            range.moveToElementText(code);
            range.select();
        } else if (window.getSelection) {
            selection = window.getSelection();
            range = document.createRange();
            range.selectNodeContents(code);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        try {
            let successful = document.execCommand('copy');
            let msg = successful ? 'successful' : 'unsuccessful';
            console.log('Copying text command was ' + msg);
        } catch (err) {
            console.log('Oops, unable to copy');
        }
    },

}
