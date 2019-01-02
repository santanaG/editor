const CONFIG = {
    version: "0.1",

    tile_size:  8,
    scale:      3,
    asset_path: "images/",

    grids: [
        [8, 8],
    ],

    // e.g { "name": "example", "width": 32, "height": 22 }
    maps: null,

    // the customisable tileset layers.
    // Required layers like collisions and entities are added automatically
    // e.g { "name": "background" }
    layers: null,

    // e.g { "name": "example", "src": "example.png" }
    tilesets: null,

    // e.g. { "tileset": "example", "data": [1, 2] }
    patterns: null,

    // e.g. { "id": "bush1", "tileset": "example", "data": [1, 2] },
    entities: null,

    // e.g. { "tileset": "example", "tiles": [1, 2, 3] },
    animations: null,
}