

export function numberToHex(color: number) {
    return  "#" + color.toString(16).padStart(6, "0");
}

export function hexToNumber(colorHex: string) {
    const [_, color] = colorHex.split("#")
    return parseInt(color, 16);
}