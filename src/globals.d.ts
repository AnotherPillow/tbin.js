import { tBIN } from ".";

declare global {
    interface Window {
        tBIN: typeof tBIN;
    }
    
}

declare global {
    var tBIN: tBIN;
}