import arrayCompare from "./helpers/arrayCompare";
import { tBINMeta } from "./parsers/metadata";
import { tBINProperties } from "./parsers/properties";
import { tBINTiles } from "./parsers/tiles";
import { tBINTilesheets } from "./parsers/tilesheets";
import type { tBINParseResult } from "./types";

import * as exportAs from './export/index'
import type { tBINExporter } from "./export/exporter";

export class tBIN { // tiled says tBIN so I say tBIN
    constructor() {}
    public buffer: ArrayBuffer = new ArrayBuffer();
    public bytes: Uint16Array = new Uint16Array();

    public meta: tBINMeta | undefined;
    public properties: tBINProperties | undefined;
    public tilesheets: tBINTilesheets| undefined;
    public tiles: tBINTiles | undefined;

    async load(_ab: ArrayBuffer): Promise<tBINParseResult> {
        this.buffer = _ab
        this.bytes = new Uint16Array(this.buffer)
        this.meta = new tBINMeta(this.bytes)
        this.properties = new tBINProperties(this.bytes, this.meta.propertiesStartIndex, this.meta.propertiesCount)
        this.tilesheets = new tBINTilesheets(this.bytes, this.properties.propertiesEnd)
        this.tiles = new tBINTiles(this.bytes, this.tilesheets.tilesheetsEnd)

        if (!this.meta.validiateTbin()) {
            return {
                error: 'NOT_TBIN'
            }
        }

        // debugger;

        return {}
    }

    export(type: 'tmx'): string {
        if (this.bytes.length == 0) return '';
        let exporter: tBINExporter;
        switch (type) {
            case 'tmx':
                exporter = new exportAs.ExportTMX(this)
                break;
            default: 
                return ''
        }

        const output = exporter.export()
        return output
    }
}


//@ts-ignore
var window: Window = window ?? {}
//@ts-ignore
window.tBIN = globalThis.tBIN = tBIN