const XBox = [
    4, 10, 9, 2, 13, 8, 0, 14, 6, 11, 1, 12, 7, 15, 5, 3,
    14, 11, 4, 12, 6, 13, 15, 10, 2, 3, 8, 1, 0, 7, 5, 9,
    5, 8, 1, 13, 10, 3, 4, 2, 14, 15, 12, 7, 6, 0, 9, 11,
    7, 13, 10, 1, 0, 8, 9, 15, 14, 4, 6, 12, 11, 2, 5, 3,
    6, 12, 7, 1, 5, 15, 13, 8, 4, 10, 9, 14, 0, 3, 11, 2,
    4, 11, 10, 0, 7, 2, 1, 13, 3, 6, 8, 5, 9, 12, 15, 14,
    13, 11, 4, 1, 3, 15, 5, 9, 0, 10, 14, 7, 6, 8, 2, 12,
    1, 15, 13, 0, 5, 7, 10, 4, 9, 2, 3, 14, 6, 11, 8, 12
];


const H0 = 0x12345678;

// Дополнение текста до 8 байт
function enteredText(text) {
    let addingLength = 8 - (text.length % 8);
    if (addingLength === 8) return text;
    let adding = String.fromCharCode(addingLength).repeat(addingLength);
    console.log(`Дополнение текста: ${adding}`);
    return text + adding;
}

function RoundOfEncryption32(str) {
    let part32 = 0;
    for (let i = 0; i < str.length; i++) {
        part32 += str.charCodeAt(i) << (8 * i);
    }
    return part32;
}

function Part32InLine(part32) {
    let str = '';
    for (let i = 0; i < 4; i++) {
        str += String.fromCharCode((part32 >> (8 * i)) & 0xFF);
    }
    console.log(`Part32InLine: ${part32.toString(16)} -> ${str}`);
    return str;
}

function GenerateAdditionalKeys(key) {
    if (key.length !== 32) {
        console.error("Ключ должен быть строкой из 32 символов в 16-ричной системе.");
        return [];
    }

    if (!/^[0-9a-fA-F]{32}$/.test(key)) {
        console.error("Ключ содержит недопустимые символы. Используйте только 0-9, a-f, A-F.");
        return [];
    }

    let addkeys = [];
    for (let i = 0; i < 8; i++) {
        let keyPart = key.slice(i * 4, (i + 1) * 4);
        let keyNum = parseInt(keyPart, 16);
        if (isNaN(keyNum)) {
            console.error(`Некорректный ключ: ${keyPart}`);
            return [];
        }
        addkeys.push(keyNum);
    }
    console.log(`GenerateAdditionalKeys: ${key} -> [${addkeys.join(', ')}]`);
    return addkeys;
}

function F(R) {
    let result = 0;
    for (let i = 0; i < 8; i++) {
        let byte = (R >> (4 * i)) & 0xF;
        let xBoxValue = XBox[(i * 16) + byte];
        result |= xBoxValue << (4 * i);
    }
    console.log(`F: ${R.toString(16)} -> ${result.toString(16)}`);
    return result;
}

function leftShift11(R) {
    let result = ((R << 11) | (R >>> (32 - 11))) >>> 0;
    console.log(`leftShift11: ${R.toString(16)} -> ${result.toString(16)}`);
    return result;
}

function encryptBlock(block, key) {
    console.log(`encryptBlock: block = ${block}, key = ${key}`);
    let addkeys = GenerateAdditionalKeys(key);
    if (addkeys.length === 0) {
        console.error("Не удалось сгенерировать подключи.");
        return "";
    }

    let L = RoundOfEncryption32(block.slice(0, 4));
    let R = RoundOfEncryption32(block.slice(4, 8));

    for (let i = 1; i <= 32; i++) {
        let V = R;
        let j = (i < 25) ? (i - 1) % 8 : (32 - i) % 8;
        R = (R + addkeys[j]) % Math.pow(2, 32);
        R = F(R);
        R = leftShift11(R);
        R = R ^ L;
        L = V;
    }
    let result = Part32InLine(L) + Part32InLine(R);
    console.log(`encryptBlock result: ${result}`);
    return result;
}

function hashFunction(text, key) {
    console.log(`hashFunction: text = ${text}, key = ${key}`);

    if (key.length !== 32) {
        console.error("Ключ должен быть строкой из 32 символов в 16-ричной системе.");
        return "00000000";
    }

    key = key.toLowerCase().replace(/\s/g, '');

    let paddedText = enteredText(text);

    let H = H0;

    for (let i = 0; i < paddedText.length; i += 8) {
        let Mi = paddedText.slice(i, i + 8);

        let HStr = Part32InLine(H);

        let encryptedHiMinus1 = encryptBlock(HStr, key);

        let encryptedHiMinus1Num = RoundOfEncryption32(encryptedHiMinus1);
        let HiMinus1Num = H;

        let HiNum = encryptedHiMinus1Num ^ HiMinus1Num;

        H = HiNum;
    }

    let hash = H.toString(16).padStart(8, '0');
    console.log(`hashFunction result: ${hash}`);
    return hash;
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('hashButton').addEventListener('click', function () {
        let text = document.getElementById('text').value;
        let key = document.getElementById('key').value;
        let hash = hashFunction(text, key);
        document.getElementById('result').value = hash;
    });
});