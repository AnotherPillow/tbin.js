import arrayCompare from "../helpers/arrayCompare"

export class tBINMeta {
    public TBIN_FORMAT_BYTES: Uint16Array = new Uint16Array([0x74, 0x42, 0x49, 0x4E])
    public selfMapName: string | null = null;
    private selfMapNameLength: number;
    
    public propertiesStartIndex: number;
    public propertiesCount: number;

    constructor(private bytes: Uint16Array) {
        this.selfMapNameLength = this.bytes[6]
        console.log(this.bytes)
        if (this.selfMapNameLength > 0) {
            this.selfMapName = ''
            for (let i = 0; i < this.selfMapNameLength; i++) {
                this.selfMapName += String.fromCharCode(this.bytes[0xA + i]) // 9 is the end index of the base metadata bytes
            }
        }
        this.propertiesStartIndex = 0x09 + this.selfMapNameLength + 9 // why is it 9? I don't know, but it seems to be! (this is the start of the length, etc for the property, not the actual property)
        this.propertiesCount = this.bytes[0x0E + this.selfMapNameLength]
    }

    public validiateTbin(): boolean {
        const firstFour = this.bytes.slice(0, 4)
        return arrayCompare(Array.from(this.TBIN_FORMAT_BYTES),
            Array.from(firstFour))
    }
}