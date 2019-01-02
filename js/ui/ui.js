'use strict';

// use this as a global repo for UI values.
const UI = {

    init(config = {}) {
        const maps      = config.maps       || [];
        const layers    = config.layers     || [];
        const tilesets  = config.tilesets   || [];
        const patterns  = config.patterns   || [];
        const entities  = config.entities   || [];

        // states
        this.deleteMode = false;
        this.fillMode   = false;

        // init
        UI.MapsPanel.init(maps);
        UI.LayersPanel.init(layers);
        UI.TilesetsPanel.init(tilesets);
        UI.PatternsPanel.init(patterns);
        UI.CollisionsPanel.init();
        UI.EntitiesPanel.init(entities);
        UI.Modal.init();

        // not sure where to put this yet
        this.setupEvents();

        // Screen drag/drop selection box
        this.setupScreenSelectionBox();
    },

    setupEvents() {
        _('.tabs').addEventListener('click', (e) => {
            let target = e.target;
            let _tabs = __('.tabs [data-tab]');

            for (const tab of _tabs) {
                tab.classList.remove('active');
            }

            target.classList.add('active');

            if (target.getAttribute('data-tab') !== null) {
                let tab = target.getAttribute('data-tab');

                // hide all tab content
                for (const tabContainer of __('.tab-container [data-tab]')) {
                    tabContainer.style['display'] = 'none';
                }

                // show desired content
                _(`.tab-container [data-tab="${tab}"]`).style['display'] = 'block';
            }
        });

        _('.fill').addEventListener('click', () => {
            if (this.fillMode) {
                _('.fill').classList.remove('isActive');
                this.fillMode = false;
                Eventer.dispatch('fillMode', false);
            }
            else {
                _('.fill').classList.add('isActive');
                this.fillMode = true;
                Eventer.dispatch('fillMode', true);
            }
        });

        _('.delete').addEventListener('click', () => {
            if (this.deleteMode) {
                _('.delete').classList.remove('isActive');
                this.deleteMode = false;
                Eventer.dispatch('deleteMode', false);
            }
            else {
                _('.delete').classList.add('isActive');
                this.deleteMode = true;
                Viewport.ghostTile.hide();
                Eventer.dispatch('deleteMode', true);

                // hide all the markers
                UI.deselectAll();
            }
        });

        _('.InfoPanel .export').addEventListener('click', () => Eventer.dispatch('export'));

        _('.InfoPanel .save').addEventListener('click', () => {
            const dbStr = Editor.exportDB();
            UI.Modal.show();
            UI.Modal.content(dbStr);
            _('.Modal .copy').style.display = 'inline-block';
        });

        _('.InfoPanel .load').addEventListener('click', () => {
            UI.Modal.show();
            _('.Modal .import').style.display = 'inline-block';
            _('.Modal-content').contentEditable = true;
            _('.Modal-content').focus();
        });

        Eventer.on('patternSelected', () => {
            this.deleteMode = false;
            _('.delete').classList.remove('isActive');
        });

        Eventer.on('fillMode', (active) => {
            this.deleteMode = false;
            _('.delete').classList.remove('isActive');
            this.selectionEnabled = active;
        });

        Eventer.on('deleteMode', () => {
            this.fillMode = false;
            _('.fill').classList.remove('isActive');
        });

        _('.ZoomPanel-slider').addEventListener('change', () => {
            let val = _('.ZoomPanel-slider').value;
            _('.ZoomPanel-factor').innerText = (25 * Math.pow(2, (val - 1))) + '%';

            Global.scale = _('.ZoomPanel-slider').value;
            Viewport.scale(_('.ZoomPanel-slider').value);
        });
    },

    setupScreenSelectionBox() {
        this._screen = _('.Screen');
        this._selectionBox = document.createElement('div');
        this._selectionBox.setAttribute('class', 'TileSelectionBox');
        this._selectionBox.style['display'] = 'none';

        this.selectionEnabled = false;
        this.snapToTile = true;
        this.selectionVisible = false;
        this.dragging = false;
        this.startX = 0;
        this.startY = 0;

        this._screen.appendChild(this._selectionBox);

        this._screen.addEventListener('mousedown', (e) => {
            if (this.selectionEnabled) {
                this.dragging = true;
                this.scaledTile = (Global.TILE_SIZE * Global.scale);
                this.startX = e.pageX;
                this.startY = e.pageY;

                if (this.snapToTile) {
                    const relX = (e.pageX + this._screen.scrollLeft);
                    const relY = (e.pageY + this._screen.scrollTop);
                    this.startX = (relX - (relX % this.scaledTile)) - this._screen.scrollLeft;
                    this.startY = (relY - (relY % this.scaledTile)) - this._screen.scrollTop;
                }

                this._selectionBox.style.top = `${this.startY}px`;
                this._selectionBox.style.left = `${this.startX}px`;
            }
        });
        this._screen.addEventListener('mouseup', () => {
            if (this.selectionEnabled) {
                this.dragging = false;
                this.selectionVisible = false;
                this._selectionBox.style['display'] = 'none';
            }
        });
        this._screen.addEventListener('mousemove', (e) => {
            if (this.selectionEnabled) {
                this.mouseX = e.pageX;
                this.mouseY = e.pageY;

                if (this.snapToTile) {
                    const relX = (e.pageX + this._screen.scrollLeft);
                    const relY = (e.pageY + this._screen.scrollTop);
                    this.mouseX = (relX - (relX % this.scaledTile) + this.scaledTile) - this._screen.scrollLeft;
                    this.mouseY = (relY - (relY % this.scaledTile) + this.scaledTile) - this._screen.scrollTop;
                }

                if (this.dragging) {
                    if (!this.selectionVisible) {
                        this._selectionBox.style['display'] = 'block';
                        this._selectionVisible = true;
                    }
                    this._selectionBox.style.height = `${this.mouseY - this.startY}px`;
                    this._selectionBox.style.width = `${this.mouseX - this.startX}px`;
                }
            }
        });
    },

    // Helper function
    getIndex(list, item) {
        let count = 0;
        for(var l of list) {
            if( l == item ) {
                break;
            }
            count++;
        }
        return count == list.length ? -1 : count; // if the count is the same as the length of the list, no item was found. Return -1.
    },

    deselectAll() {
        UI.CollisionsPanel.deselect();
        UI.PatternsPanel.deselect();
        UI.TilesetsPanel.deselect();
        UI.EntitiesPanel.deselect();
    }
};
