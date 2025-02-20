import arrayCompare from "./helpers/arrayCompare";
import { tBINMeta } from "./parsers/metadata";
import { tBINProperties } from "./parsers/properties";
import { tBINTilesheets } from "./parsers/tilesheets";
import type { tBINParseResult } from "./types";

export class tBIN { // tiled says tBIN so I say tBIN
    constructor() {}
    public buffer: ArrayBuffer = new ArrayBuffer();
    public bytes: Uint16Array = new Uint16Array();

    private meta: tBINMeta | undefined;
    private properties: tBINProperties | undefined;
    private tilesheets: tBINTilesheets| undefined;

    async load(_ab: ArrayBuffer): Promise<tBINParseResult> {
        this.buffer = _ab
        this.bytes = new Uint16Array(this.buffer)
        this.meta = new tBINMeta(this.bytes)
        this.properties = new tBINProperties(this.bytes, this.meta.propertiesStartIndex, this.meta.propertiesCount)
        this.tilesheets = new tBINTilesheets(this.bytes, this.properties.propertiesEnd)

        // NOTE TO SELF: search for 280000001E000000 in grandpasshedoutside for layout of thing (40, 30, 16, 16)

        if (!this.meta.validiateTbin()) {
            return {
                error: 'NOT_TBIN'
            }
        }

        debugger;

        return {}
    }

}

//@ts-ignore
window.tBIN = globalThis.tBIN = tBIN