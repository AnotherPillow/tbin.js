import type { tBINTileProperty } from "./parsers/tilesheets";

export interface tBINSuccessResult {

}

export type tBINParseResult = {
    error: 'NOT_TBIN'
} | tBINSuccessResult