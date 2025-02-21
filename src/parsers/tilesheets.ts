export class tBINTileProperty {

    public KEY_REGEX = /@TileIndex@(\d+)@([a-zA-Z0-9]+)/

    public tileIndex: number;
    public key: string;
    public value: string;

    constructor(public rawKey: string, _value: string) {
        const [ _, s_index, _key ] = rawKey.match(this.KEY_REGEX)! // let's hope it isn't null
        
        this.tileIndex = Number(s_index)
        this.key = _key
        this.value = _value
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

            for (let j = 0; j < properties_count; j++) {
                const key_len = this.bytes[++p]
                p += 3;
                
                let key = ''
                for (let c = 0; c < key_len; c++) {
                    key += String.fromCharCode(this.bytes[++p])
                }

                const gap = this.bytes[++p]
                const value_len = this.bytes[++p]
                p += gap;

                let value = ''
                for (let c = 0; c < value_len; c++) {
                    value += String.fromCharCode(this.bytes[++p])
                }

                properties.push(new tBINTileProperty(key, value))
            }

            const sheet = new tBINTilesheet(
                displayName, filepath, properties, tile_px_height, tile_px_width, width_in_tiles * tile_px_width, height_in_tiles * tile_px_height
            )

            this.tilesheets.push(sheet)   
            p++;
        }
        this.tilesheetsEnd = p
    }
}