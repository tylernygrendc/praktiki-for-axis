export const alphabet = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

export function clearQueue(){
    getQueue().innerHTML = "";
}
export function duplicateNode(node) {
    let clone;
    try{
        clone = node.cloneNode(true);
        clone.id = getRandomId();
        clone.querySelectorAll("*").forEach(child => {
            child.id = getRandomId();
        });
    } catch (error) {
        clone = document.createElement("div");
        console.groupCollapsed(`Could not duplicate ${node}.`);
        console.error(error);
        console.warn(`duplicateNode() returned ${clone} instead.`, clone);
        console.groupEnd();
    } finally {
        return clone;
    }
}
export function getRandomId(){
    let letters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
    let leadingLetters = "";
    for(var i = 0; i < 4; ++i) leadingLetters += letters[Math.floor(Math.random() * 26)];
    let cryptoString = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    return leadingLetters + cryptoString;
}  
export function getQueue(){
    let queue;
    try{
        queue = document.querySelector("#utility-queue");
        if(queue === null) {
            queue = document.createElement("div");
            queue.id = "utility-queue";
            queue.style.display = "none";
            queue["aria-hidden"] = "true";
            document.body.append(queue);
        }
    } catch (error) {
        console.groupCollapsed(`Could not get #extension-queue.`);
        console.error(error);
        console.warn(`getQueue() returned ${queue} instead.`);
        console.groupEnd();
    } finally {
        return queue;
    }
}
export function showPlaceValues(number = 0, quantity = 2) {
    // the number parameter can be typeof string or number
    // coerce it to a string, regardless of type, and split at the decimal
    let str = number.toString().split('.');
    // if the string doesn't have a decimal, add trailing zeros
    if(str.length === 1) return `${str[0]}.00`;
    // if it does has a decimal
    if(str.length > 1) {
        // make sure there are at least place values to match quantity
        if(str[1].length < quantity){
            let trailingZeros = "";
            for(let i = 0; i < quantity; ++i) trailingZeros += "0";
            str[1] += trailingZeros;
        }
        // trim the place values to match quantity
        return `${str[0]}.${str[1].substring(0, quantity)}`;
    }
}