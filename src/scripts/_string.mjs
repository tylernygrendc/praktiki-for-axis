export function camelCase(string = "") {
    return string.split(/-|[A-Z]|_|\s/g).reduce((acc, cv, i) => {
        return i === 0 ? acc += cv : acc += `${cv.charAt(0).toUpperCase()}${cv.slice(1)}`;
    }, "");
}
export function capitalize(string = "") {
    return string.split(" ").reduce((acc, cv, i, initialArray) => {
        return i < initialArray.length - 1 ? 
            acc += `${cv.charAt(0).toUpperCase() + cv.slice(1)} `: 
            `${cv.charAt(0).toUpperCase() + cv.slice(1)}`;
    }, "");
}
export function kebabCase(string){
    return string.split(/[A-Z]|_|\s/g).reduce((acc, cv, i, initialArray) => {
        return i < initialArray.length - 1 ? acc += `${cv.toLowerCase()}-`: acc += cv.toLowerCase();
    }, "");
}
export function splice(string = "", start = 0, deleteCount = 0, item = "") {
    return [...string].splice(start, deleteCount, item).reduce((acc, cv) => {
        return acc += cv;
    }, "");
}