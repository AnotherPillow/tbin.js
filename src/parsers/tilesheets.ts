import type { TilePropertyType } from "../types";

export class tBINTileProperty {

    public KEY_REGEX = /@TileIndex@(\d+)@([a-zA-Z0-9]+)/

    public tileIndex: number;
    public key: string;
    public value: boolean | number | string;

    constructor(public rawKey: string, _value: boolean | number | string, public type: TilePropertyType) {
        const [ _, s_index, _key ] = rawKey.match(this.KEY_REGEX)! // let's hope it isn't null
        
        this.key = _key
        this.value = this.parseValue(_value, type);
        this.tileIndex = Number(s_index)
    }

    private parseValue(value: any, type: TilePropertyType): boolean | number | string {
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

export class tBINTilesheet {
    constructor(public displayName: string, public filename: string, public tileProperties: tBINTileProperty[], public tileHeight: number, public tileWidth: number, public sheetPixelWidth: number, public sheetPixelHeight: number) {}
}

export class tBINTilesheets {
    public tilesheetCount: number;
    public tilesheets: tBINTilesheet[] = []
    public tilesheetsEnd: number;

    all = () => this.tilesheets

    constructor(private bytes: Uint16Array, private tilesheetsStartIndex: number) {
        let p = tilesheetsStartIndex
        
        this.tilesheetCount = this.bytes[p]
        p += 4

        for (let i = 0; i < this.tilesheetCount; i++) {
            const displayName_length = this.bytes[p]
            p += 3
            
            let displayName = ''
            for (let c = 0; c < displayName_length; c++) {
                displayName += String.fromCharCode(this.bytes[++p])
            }
            
            p += 5
            const filepath_length = this.bytes[p]
            p += 3
            let filepath = ''
            for (let c = 0; c < filepath_length; c++) {
                filepath += String.fromCharCode(this.bytes[++p])
            }

            const width_in_tiles = this.bytes[++p]
            const height_in_tiles = this.bytes[p+=4]
            const tile_px_width = this.bytes[p+=4]
            const tile_px_height = this.bytes[p+=4]

            p += 19 // probably some data in there, idk what it is though

            const props_count_b0 = this.bytes[++p]
            const props_count_b1 = this.bytes[++p]
            const properties_count = (props_count_b1 << 8) | props_count_b0

            p += 2

            const properties: tBINTileProperty[] = []

            propertyLoop: for (let j = 0; j < properties_count; j++) {
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
                        alert('hi! this map contains tiledata not yet supported. please contact the developer with the map please thank you')
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
                
                properties.push(new tBINTileProperty(key, value, type_str))
            }

            const sheet = new tBINTilesheet(
                displayName, filepath, properties, tile_px_height, tile_px_width, width_in_tiles * tile_px_width, height_in_tiles * tile_px_height
            )

            this.tilesheets.push(sheet)   
            p++;
            console.log(`finish sheet: ${p} (0x${p.toString(16)})`)
        }
        this.tilesheetsEnd = p
    }
}