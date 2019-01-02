'use strict';

const Tile = {

    init() {
        this.x          = 0;
        this.y          = 0;
        this.height     = Global.TILE_SIZE;
        this.width      = Global.TILE_SIZE;

        this.snapToTile = true;

        this._elm       = document.createElement('canvas');
        this.context    = this._elm.getContext('2d');

        this._elm.style.opacity         = '0.6';
        this._elm.style.pointerEvents   = 'none';

        this.resize(Global.TILE_SIZE, Global.TILE_SIZE);
        this.hide();

        return this;
    },

    resize(width = Global.TILE_SIZE, height = Global.TILE_SIZE) {
        this._elm.height        = height;
        this._elm.width         = width;

        this._elm.style.height  = `${height * Global.scale}px`;
        this._elm.style.width   = `${width * Global.scale}px`;
    },

    move(x = 0, y = 0) {
        if (!this.visible) {
            return;
        }

        this.x = x;
        this.y = y;

        if (this.snapToTile) {
            const tile_size = (Global.TILE_SIZE * Global.scale);
            this.x          = Math.floor(x / tile_size) * tile_size;
            this.y          = Math.floor(y / tile_size) * tile_size;
        }

        this._elm.style.transform = `translate(${this.x}px, ${this.y}px)`;
    },

    hide() {
        this.visible = false;
        this._elm.style.display = 'none';
    },

    show() {
        this.visible = true;
        this._elm.style.display = 'block';
    },

    update() {
        if (UI.toPlace === 'collision') {
            const cTile = Global.collisionTiles[UI.selectedCollision];

            this.resize(cTile.width, cTile.height);

            this.context.clearRect(0, 0, this._elm.width, this._elm.height)
            this.context.drawImage(cTile, 0, 0, cTile.width, cTile.height);
        }
        else {
            const selected = UI.toPlace === 'pattern' ? UI.selectedPattern : UI.selectedEntity;

            if (selected) {
                this.resize(selected.WIDTH, selected.HEIGHT);
    
                this.context.clearRect(0, 0, this._elm.width, this._elm.height)
                this.context.drawImage(selected.canvas, 0, 0, selected.WIDTH, selected.HEIGHT);
            }
        }

        if (!this.visible) {
            this.show();
        }
    },
}