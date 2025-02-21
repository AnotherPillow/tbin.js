export class tBINTile {
    public properties: Map<string, string> = new Map();
    constructor() {}
}

export class tBINStaticTile extends tBINTile {
    constructor(public indexOnSheet: number, public blendMode: number, public tilesheetName: string) {
        super()
    }
}

export class tBINAnimatedTile extends tBINTile {
    constructor(public frameInterval: number, public frameCount: number) {
        super()
    }

    public frames: tBINStaticTile[] = []
}

export class tBINLayer {
    /**
     * @description {two dimensional array, indexed by tiles[y][x]}
     */
    public tiles: (tBINTile | null)[][] = []
    constructor(public name: string, public widthTiles: number, public heightTiles: number, public visible: boolean, public tileWidthPixels: number, public tileHeightPixels: number) {}
}

export class tBINTiles {
    public tileLayerCount: number;
    public layers: tBINLayer[] = [];

    constructor(private bytes: Uint16Array, private tilesStartIndex: number) {
        let p = tilesStartIndex;
        this.tileLayerCount = this.bytes[p]

        let lastTileElementType: 0x54 | 0x53 | 0x4E | 0x41 | null = null
        
        for (let i = 0; i < this.tileLayerCount; i++) {
            if (p >= this.bytes.length) break;
            const layer_name_length = this.bytes[p += (lastTileElementType == 0x4E ? 1 : 4)]
            p += 3;

            let layer_name = ''
            for (let c = 0; c < layer_name_length; c++) {
                layer_name += String.fromCharCode(this.bytes[++p])
            }

            let layer_visible = this.bytes[++p] > 0
            let layer_width_in_tiles = this.bytes[p += 5]
            let layer_height_in_tiles = this.bytes[p += 4]
            let tile_width_pixels = this.bytes[p += 4]
            let tile_height_pixels = this.bytes[p += 4]

            const layer = new tBINLayer(layer_name, layer_width_in_tiles, layer_height_in_tiles, layer_visible, tile_width_pixels, tile_height_pixels)
            
            p += 7

            let tiles: (tBINTile | null)[][] = []
            let currentSheet = ''

            /* https://github.com/mapeditor/tiled/blob/4ee592fd4c8bc5015614f42cd52c20e259326483/src/plugins/tbin/tbin/Map.cpp#L222 was immesenly helpful as a reference for this. */
            for (let y = 0; y < layer_height_in_tiles; y++) {
                if (!tiles[y]) tiles[y] = []
                let x = 0;
                // for (let x = 0; x < layer_width_in_tiles; x++) {
                do {
                    const tileType = this.bytes[++p]
                    lastTileElementType = tileType as any
                    if (!tiles[y][x]) tiles[y][x] = null
                    switch (tileType) {
                        case 0x54: // 'T'
                            const sheet_name_len = this.bytes[++p]
                            currentSheet = ''
                            p += 3;
                            
                            for (let c = 0; c < sheet_name_len; c++) {
                                currentSheet += String.fromCharCode(this.bytes[++p])
                            }

                            break;
                        case 0x53: // 'S'
                            const index = this.bytes[++p]
                            const blendMode = this.bytes[++p] // no idea what this does, but tiled references it!
                            const s_tile = new tBINStaticTile(index, blendMode, currentSheet);
                            
                            const prop_count = this.bytes[p += 4]
                            if (prop_count > 0) {
                                // need to figure out ones with multiple properties
                                const key_len = this.bytes[p += 4]
                                p += 3
                            
                                let key = ''
                                for (let c = 0; c < key_len; c++) {
                                    key += String.fromCharCode(this.bytes[++p])
                                }

                                const gap = this.bytes[++p]
                                const val_len = this.bytes[++p]
                                p += gap

                                let val = ''
                                for (let c = 0; c < val_len; c++) {
                                    val += String.fromCharCode(this.bytes[++p])
                                }

                                s_tile.properties.set(key, val)
                            }

                            tiles[y][x] = s_tile

                            x++;
                            break;
                        case 0x4E: // 'N'
                            const skipAmount = this.bytes[++p]
                            x += skipAmount
                            p += 3
                            break;
                        case 0x41: // 'A'
                            const int_b0 = this.bytes[++p]
                            const int_b1 = this.bytes[++p]
                            const interval = (int_b1 << 8) | int_b0 // (it's a uint16 (technically uint32, but I won't bother with parsing those rn))

                            const frame_count = this.bytes[p += 3]
                            let currentTilesheet_anim = ''
                            p += 3;
                            
                            const a_tile = new tBINAnimatedTile(interval, frame_count)
                            
                            for (let t = 0; t < frame_count;) {
                                switch (this.bytes[++p]) {
                                    default: // AAAAAAAA
                                        case 0x54: // 'T'
                                            const sheet_name_len = this.bytes[++p]
                                            currentTilesheet_anim = ''
                                            p += 3;
                                            
                                            for (let c = 0; c < sheet_name_len; c++) {
                                                currentTilesheet_anim += String.fromCharCode(this.bytes[++p])
                                            }
                                            
                                            break;
                                        case 0x53: // 'S'
                                            const index = this.bytes[++p]
                                            const blendMode = this.bytes[++p] // no idea what this does, but tiled references it!
                                            const a_sTile = new tBINStaticTile(index, blendMode, currentTilesheet_anim)

                                            const prop_count = this.bytes[p += 4]
                                            if (prop_count > 0) {
                                                // need to figure out ones with multiple properties
                                                const key_len = this.bytes[p += 4]
                                                p += 3
                                            
                                                let key = ''
                                                for (let c = 0; c < key_len; c++) {
                                                    key += String.fromCharCode(this.bytes[++p])
                                                }
                
                                                const gap = this.bytes[++p]
                                                const val_len = this.bytes[++p]
                                                p += gap
                
                                                let val = ''
                                                for (let c = 0; c < val_len; c++) {
                                                    val += String.fromCharCode(this.bytes[++p])
                                                }

                                                a_sTile.properties.set(key, val)
                
                                                ++i;
                                            }

                                            a_tile.frames[t] = a_sTile
                                            p += 3;
                                            t++;
                                            break;
                                        break;

                                }
                            }

                            tiles[y][x] = a_tile

                            x++;
                            break;
                        default: 
                            // AAAAAAAAAAA, need better error handling really.
                            break;
                    }
                } while (x < layer_width_in_tiles && p < this.bytes.length)
                
                // remove the empty elements and replace them with null
                tiles[y] = Array.from(tiles[y], i => i ?? null)
                
                // fill in not-filled elements at the end with null
                if (tiles[y].length < layer_width_in_tiles) {
                    const dif = layer_width_in_tiles - tiles[y].length
                    for (let n = 0; n < dif; n++) {
                        tiles[y].push(null)
                    }
                }
            }

            layer.tiles = tiles
            this.layers[i] = layer
        }
    }
}