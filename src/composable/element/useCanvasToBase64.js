import pako from 'pako';

function utf8Decode(bytes) {
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
        let byte = bytes[i];
        if (byte < 0x80) {
            str += String.fromCharCode(byte); // ASCII
        } else if (byte > 0xBF && byte < 0xE0) {
            let next = bytes[++i];
            str += String.fromCharCode((byte & 0x1F) << 6 | (next & 0x3F));
        } else if (byte > 0xDF && byte < 0xF0) {
            let next1 = bytes[++i], next2 = bytes[++i];
            str += String.fromCharCode(
                (byte & 0x0F) << 12 | (next1 & 0x3F) << 6 | (next2 & 0x3F)
            );
        }
    }
    return str;
}

const input = atob('SDRzSQ==');
const output = atob('Q29tZnlVSQ==');
export const useBase64ToCanvasJson = (x) => {
    let g = null;
    let base64Data = x.replace(output,input)
    let binaryStr = atob(base64Data);
    let bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    let jsonString;
    const isGzip = base64Data.startsWith('H4sI');
    try {
        if (isGzip) {
            const decompressedData = pako.inflate(bytes);
            jsonString = utf8Decode(decompressedData);
        } else {
            jsonString = utf8Decode(bytes);
        }
    } catch (error) {
        jsonString = utf8Decode(bytes);
    }
    g = JSON.parse(jsonString);
    return g;
}

export const useCanvasJsonToBase64 = (canvasJson) => {
    if (!canvasJson) return;
    const jsonString = JSON.stringify(canvasJson);
    const bytes = new TextEncoder().encode(jsonString);
    const compressedData = pako.gzip(bytes);
    let binary = '';
    const len = compressedData.length;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(compressedData[i]);
    }
    let base64Data = btoa(binary);
    base64Data = base64Data.replace(input, output);
    return base64Data;
}