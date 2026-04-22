// deterministic hash to give the genres pop
// lets the same genre always render with the same color without having to store colors in the db
export function stringToColor(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash)
    }

    const h = hash % 360            // hue (0-360)
    const s = 50                    // lower saturation = more muted
    const l = 40                    // higher lightness = softer/faded

    return `hsl(${h}, ${s}%, ${l}%)`
}