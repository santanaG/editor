'use strict';

UI.EntitiesPanel = {

    init() {
        this.container  = _('.EntitiesPanel-container');
        this.marker     = Object.create(Marker).init();
        this.scaleValue = Global.scale;

        for (var entity of Global.entityArray) {
            this.container.appendChild(entity.canvas);
        }

        // add marker
        this.container.appendChild(this.marker.elm);

        // events
        this.container.addEventListener('mousedown', (e) => this.selectEntity(e));
        this.container.addEventListener('mouseup', () => Viewport.ghostTile.update());
    },

    selectEntity(e) {
        const idx = UI.getIndex(this.container.querySelectorAll('canvas'), e.target);

        if( idx >= 0 ) {
            const entity  = Global.entityArray[idx];

            UI.toPlace          = 'entity';
            UI.selectedEntity   = entity;

            UI.deselectAll();

            this.marker.render(entity.canvas.offsetTop, entity.canvas.offsetLeft, entity.WIDTH, entity.HEIGHT);
            this.marker.show();
            Eventer.dispatch('patternSelected');
        }
        else {
            this.marker.hide();
        }
    },

    deselect() {
        this.marker.hide();
    }
}
