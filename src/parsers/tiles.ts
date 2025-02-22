import type { TilePropertyType } from "../types";

export class tBINTile {
    public type: 'static' | 'animated' | '' = ''
    public properties: Map<string, string> = new Map();
    constructor() {}
}

export class tBINStaticTile extends tBINTile {
    public type: 'static' = 'static' as 'static'
    constructor(public indexOnSheet: number, public blendMode: number, public tilesheetName: string) {
        super()
    }
}

export class tBINAnimatedTile extends tBINTile {
    public type: 'animated' = 'animated' as 'animated'
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

    public properties: Map<string, boolean | number | string> = new Map();
    
    public _parsePropertyValue(value: any, type: TilePropertyType): boolean | number | string {
        switch (type) {
            case 'string':
                return value.toString();
            case 'bool':
                return value > 0
            case 'float':
                return parseFloat(value.toString())
            case 'int':
                return Number(value.toString())
        }
    }
}

export class tBINTiles {
    public tileLayerCount: number;
    public layers: tBINLayer[] = [];

    constructor(private bytes: Uint16Array, private tilesStartIndex: number) {
        console.log(`tiles start ${tilesStartIndex} (0x${tilesStartIndex.toString(16)})`)
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

            console.log(`layer ${i}. name length: ${layer_name_length} - name: ${layer_name}. name finished at ${p} (0x${p.toString(16)})`)

            let layer_visible = this.bytes[++p] > 0
            let layer_width_in_tiles = this.bytes[p += 5]
            let layer_height_in_tiles = this.bytes[p += 4]
            let tile_width_pixels = this.bytes[p += 4]
            let tile_height_pixels = this.bytes[p += 4]
            let layer_property_count = this.bytes[p += 4]

            const layer = new tBINLayer(layer_name, layer_width_in_tiles, layer_height_in_tiles, layer_visible, tile_width_pixels, tile_height_pixels)
            
            p += 3
            if (layer_property_count > 0) {
                

                propertyLoop: for (let j = 0; j < layer_property_count; j++) {
                    const key_len = this.bytes[++p]
                    console.log(key_len, p, p.toString(16))
                    p += 3;
                    
                    let key = ''
                    for (let c = 0; c < key_len; c++) {
                        key += String.fromCharCode(this.bytes[++p])
                    }
    
                    console.log(key)
    
                    const type_int = this.bytes[++p]
                    let type_str: TilePropertyType = '' as TilePropertyType
                    switch (type_int) {
                        case 0:
                            type_str = 'bool'
                            break;
                        case 1:
                            type_str = 'int'
                            break;
                        case 2:
                            type_str = 'float'
                            break;
                        case 3:
                            type_str = 'string'
                            break;
                        default:
                            type_str  = 'int' // AAAAAAAAAAAAAAAAAAAAAAAAAA
                            break;
                    }
                    console.log(type_int, type_str)
                    
                    let value = (type_str == 'string' ? '' : 0)
                    
                    switch (type_str) {
                        case 'string':
                            const value_len = this.bytes[++p]
                            p+=3;
                            for (let c = 0; c < value_len; c++) {
                                value += String.fromCharCode(this.bytes[++p])
                            }
                            break;
                        case 'bool': // will always be a uint8
                            value = this.bytes[++p]
                            break;
                        case 'float': // idk how do I aprse a float?
                            alert('hi! this map contains layer properties not yet supported. please contact the developer with the map please thank you')
                            continue propertyLoop;
                            break;
                        case 'int': // technically uint32, but that's a later time deal
                            const int_value_b0 = this.bytes[++p]
                            const int_value_b1 = this.bytes[++p]
                            const int_value = (int_value_b1<< 8) | int_value_b0
                            value = int_value
                            break;
                        default: // no it's not
                            break;
                    }
    
                    console.log(value)
                    
                    layer.properties.set(
                        key,
                        layer._parsePropertyValue(value, type_str)
                    )
                }

                
            }

            let tiles: (tBINTile | null)[][] = []
            let currentSheet = ''

            /* https://github.com/mapeditor/tiled/blob/4ee592fd4c8bc5015614f42cd52c20e259326483/src/plugins/tbin/tbin/Map.cpp#L222 was immesenly helpful as a reference for this. */
            for (let y = 0; y < layer_height_in_tiles; y++) {
                if (!tiles[y]) tiles[y] = []
                let x = 0;
                // for (let x = 0; x < layer_width_in_tiles; x++) {
                do {
                    console.log(`doing tile x/y ${x}${y}`)
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
                            const s_index_b0 = this.bytes[++p]
                            const s_index_b1 = this.bytes[++p]
                            const index = (s_index_b1 << 8) | s_index_b0

                            const blendMode = this.bytes[p += 3] // no idea what this does, but tiled references it!
                            const s_tile = new tBINStaticTile(index, blendMode, currentSheet);
                            
                            const prop_count = this.bytes[++p]
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