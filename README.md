# Super JS Adventure Tile Editor

A fairly basic tile editor built specifically to create maps for [Super JS Adventure](https://github.com/gablaxian/super-js-adventure)

## Running the Editor

This app is built to be as simple to run as possible. You can clone this repo then double-click the `index.html` file and it will run!

The editor makes great use of local storage (there is no import yet) so while it doesn’t matter what URL it runs under, e.g. `file:///Users/you/file.html`, `http://localhost:3000` or `https://something.local`. But once you start making maps, you will need to stay using that URL so that the storage persists.

## Misc

Toggle `fill` and drag over the viewport to fill an area with a tile or pattern.
Toggle `erase` to enable erasing of single cells. Click and drag to delete cells quicker.
`esc` - deselects any selected tile/pattern/collision/entity

There is an 'API only' command, `DB.clear()`, which allows you to delete all the contents of the DB in case you want to start all over again. To run it, open up the browser's console and run it.