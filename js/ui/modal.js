'use strict';

UI.Modal = {
    _overlay        : _('.Overlay'),
    _modal          : _('.Modal'),
    _modalContent   : _('.Modal-content'),
    _modalFooter    : _('.Modal-footer'),
    _close          : _('.Modal-close'),

    init() {
        this.hide();
        this._close.addEventListener('click', () => this.hide());
    },

    show() {
        this._overlay.style.display = 'block';
        this._modal.style.display   = 'block';
    },

    hide() {
        this._overlay.style.display     = 'none';
        this._modal.style.display       = 'none';
        this._modalContent.innerText    = '';

        __('.Modal .Button').forEach((elm) => elm.style.display = 'none');
    },

    //------------------------

    content(str = '') {
        const pre   = document.createElement('pre');
        const code  = document.createElement('code');

        code.innerText = str;
        pre.appendChild(code);
        this._modalContent.appendChild(pre);
    },
}
