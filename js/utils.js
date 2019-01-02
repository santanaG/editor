'use strict';

// A set of useful functions.

const Utils = {

    getTilesetByName(name) {
        for(const tileset of Global.tilesetsArray) {
            if( tileset.name === name ) {
                return tileset;
            }
        }
    },

}
