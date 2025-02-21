export class tBINProperties {
    public propertyDictionary: {[key: string]: string} = {};
    public propertiesEnd: number;

    constructor(private bytes: Uint16Array, private startPropertiesIndex: number, private propertiesCount: number) {
        var p = startPropertiesIndex;
        for (let i = 0; i < propertiesCount; i++) {
            const key_length = bytes[p]
            p += 3;
            
            let key = ''
            for (let c = 0; c < key_length; c++) {
                key += String.fromCharCode(this.bytes[++p])
            }
            
            const kv_gap = bytes[++p]
            const value_length = bytes[++p]
            p += kv_gap

            let value = ''
            for (let c = 0; c < value_length; c++) {
                value += String.fromCharCode(this.bytes[++p])
            }

            ++p;
            this.set(key, value)
        }
        this.propertiesEnd = p;
    }

    get = (key: string): string => this.propertyDictionary[key]
    set = (key: string, value: string): string => this.propertyDictionary[key] = value
    all = (): string[] => Object.keys(this.propertyDictionary)
}