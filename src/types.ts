import type { tBINTileProperty } from "./parsers/tilesheets";

export interface tBINSuccessResult {

}

export type tBINParseResult = {
    error: 'NOT_TBIN'
} | tBINSuccessResult

export type TilePropertyType = 'bool' | 'int' | 'float' | 'string'