import { GENERATABLE_CHARS } from "src/constants/variables";


export function generateRandomString(length: number) {
    let str = '';
    for (let i = 0; i < length; ++i) {
        const index = Math.floor(Math.random() * GENERATABLE_CHARS.length);
        str += GENERATABLE_CHARS[index];

    }
    
    return str;
}