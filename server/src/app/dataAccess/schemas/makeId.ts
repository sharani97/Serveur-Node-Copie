export function idify(name:string) {
    return name.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "_");
}