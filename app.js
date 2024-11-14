// @ts-check

/**
 * For ppsspp hooking of ULUS10566 version of Dissidia 012
 * 
 * File name:
 * 0x08871288
 * {a0:s}
 * 
 * File hash (in big endian hex):
 * 0x08871428
 * {v0}
 */

const pack = require('./package.json');
const {
    bireader,
    biwriter
} = require('bireader');
const fs = require('fs');
const path = require('path');
const { 
    Logger,
    C_HEX,
    PROGRAM,
    DIR_NAME,
    exit,
    ask,
} = require('./src/common');

// Set commands to program for
PROGRAM
  .name('dissida_filelist')
  .description(`${C_HEX.blue}Dissidia 012 file list creator and unpacker${C_HEX.reset}`)
  .version(pack.version)

  .option(`-h, --hash <string>`,           `Input a single file path string to see if it matches any hashes. Will add any matching file paths to local PACKAGE_INFO.json file. Can also use wildcards characters for inserting character codes or numbers. See --help for details. Can also use a .txt file with --text for muliple entries.`)
  
  .option('-p, --package_info <string>',   'Input path of PACKAGE_INFO.BIN file to create a fresh PACKAGE_INFO.json file.')

  .option(`-e, --extract <string>`,        'Extracts all files from the input PACKAGE.BIN file.')

  .option(`-c, --compile <string>`,        'Compiles a new PACKAGE_INFO.BIN file based off of input PACKAGE_INFO.json.')

  .option(`-r, --replace <string>`,        'Input path of file to add / replace in PACKAGE.BIN (name doesn\'t matter). Use with --filename for PACKAGE_INFO filename entry match. PACKAGE.BIN and PACKAGE_INFO.json must be in root directory.')

  .option(`-f, --filename <string>`,       'Input path filename matching in PACKAGE_INFO.json of file being replacing in the PACKAGE.BIN file. PACKAGE.BIN and PACKAGE_INFO.json must be in root directory. Craetes new PACKAGE_INFO.BIN too.')

  .option(`-t, --text <string>`,           `Batch version of --hash. Input a text file and it will hash each line for a file match.`)

PROGRAM.addHelpText("after",`
${C_HEX.yellow}Note:${C_HEX.reset} The best way to find file names is by playing the ${C_HEX.blue}ULUS10566${C_HEX.reset} version of the game on a PPSSPP and hooking 0x08871288 with a log of {a0:s}. You can then use ${C_HEX.yellow}--hash='path/to/voice_eth100.dat'${C_HEX.reset} to see if there is any match. 
    
You can also use ${C_HEX.yellow}wildscards${C_HEX.reset} for character codes and increasing numbers. ${C_HEX.yellow}%2s${C_HEX.reset} and ${C_HEX.yellow}%3s${C_HEX.reset} adds 2 and 3 letter character codes (character and series codes), ${C_HEX.yellow}%5s${C_HEX.reset} and ${C_HEX.yellow}%6s${C_HEX.reset} for 5 and 6 letter character codes (inculdes numbers), and ${C_HEX.yellow}%1d to %5d${C_HEX.reset} numbers (0-9, 0-99 etc) like ${C_HEX.yellow}--hash='voice/sounds/battle_%3s1%1d0.at3'${C_HEX.reset} (example: ${C_HEX.yellow}voice/sounds/battle_sev120.at3${C_HEX.reset}). 

${C_HEX.red}WARNING:${C_HEX.reset} False positive as possible, so do use sparingly!`)
PROGRAM.parse(process.argv);

/**
 * Command line arguments.
 */
const ARGV = PROGRAM.opts();

const input_set = new Set([
    /^-h/,  /^--hash/,
    /^-p/,  /^--package_info/,
    /^-e/,  /^--extract/,
    /^-c/,  /^--compile/,
    /^-r/,  /^--replace/,
    /^-f/,  /^--filename/,
    /^-t/,  /^--text/,
  ]);

function filterByRegex(strings, regexSet) {
    return strings.filter(str => ![...regexSet].some(regex => regex.test(str) ));
}
  
const _INPUT_FILE = filterByRegex(process.argv.slice(2), input_set)[0];

Logger.info(`Commands:`);
Logger.info(ARGV);
if(_INPUT_FILE != undefined){
    Logger.info(`File:`);
    Logger.info(_INPUT_FILE);
}

const name_2 = [
    "wo",     // Wol
    "ga",     // Garland
    "fn",     // Firion
    "em",     // Emperor
    "on",     // Onion
    "cd",     // Cod
    "ce",     // Cecil
    "ca",     // Kain
    "gb",     // Golbez
    "bu",     // Bartz
    "ed",     // Exdeath
    "gi",     // Gilgamesh
    "ti",     // Terra
    "cf",     // Kefka
    "cl",     // Cloud
    "tf",     // Tifa
    "ae",     // ? Aerith
    "sf",     // Sephiroth
    "sq",     // Squall
    "la",     // Laguna
    "am",     // Ultimeica
    "zi",     // Zidane
    "kj",     // Kuja
    "td",     // Tidus
    "yu",     // Yuna
    "je",     // Jecht
    "sh",     // Shantotto
    "pr",     // Prishe
    "va",     // Vaan
    "li",     // Lightning
    "gs",     // Gabranth
    "co",     // Cosmos
    "ch",     // Faral Chaos
    "na",     // Narriator

    "on",     // FFI
    "tw",     // FFII
    "th",     // FFIII
    "fo",     // FFIV
    "fi",     // FFV
    "si",     // FFVI
    "se",     // FFVII
    "eh",     // FFVIII
    "ni",     // FFIX
    "te",     // FFX
    "gs",     // Guest
    "or",     // Dissidia Original
];

const name_3 = [
    "one",    // FFI
    "two",    // FFII
    "thr",    // FFIII
    "for",    // FFIV
    "fiv",    // FFV
    "six",    // FFVI
    "sev",    // FFVII
    "eht",    // FFVIII
    "nin",    // FFIX
    "ten",    // FFX
    "gst",    // Guest
    "org"     // Dissidia Original
];

const name_5 = [
    "on100",  // Wol
    "on200",  // Garland
    "tw100",  // Firion
    "tw200",  // Emperor
    "th100",  // Onion
    "th200",  // Cod
    "fo100",  // Cecil
    "fo110",  // Kain
    "fo200",  // Golbez
    "fi100",  // Bartz
    "fi200",  // Exdeath
    "fi210",  // Gilgamesh
    "si100",  // Terra
    "si200",  // Kefka
    "se100",  // Cloud
    "se110",  // Tifa
    "se120",  // Aerith
    "se200",  // Sephiroth
    "eh100",  // Squall
    "eh110",  // Laguna
    "eh200",  // Ultimeica
    "ni100",  // Zidane
    "ni200",  // Kuja
    "te100",  // Tidus
    "te110",  // Yuna
    "te200",  // Jecht
    "gs100",  // Shantotto
    "gs110",  // Prishe
    "gs120",  // Vaan
    "gs130",  // Lightning
    "gs200",  // Gabranth
    "or100",  // Cosmos
    "or700",  // Shinryu
    "or800",  // Mog
    "or200",  // Chaos
    "or210",  // Faral Chaos
];

const name_6 = [
    "one100", // Wol
    "one200", // Garland
    "two100", // Firion
    "two200", // Emperor
    "thr100", // Onion
    "thr200", // Cod
    "for100", // Cecil
    "for110", // Kain
    "for200", // Golbez
    "fiv100", // Bartz
    "fiv200", // Exdeath
    "fiv210", // Gilgamesh
    "six100", // Terra
    "six200", // Kefka
    "sev100", // Cloud
    "sev110", // Tifa
    "sev120", // Aerith
    "sev200", // Sephiroth
    "eht100", // Squall
    "eht110", // Laguna
    "eht200", // Ultimeica
    "nin100", // Zidane
    "nin200", // Kuja
    "ten100", // Tidus
    "ten110", // Yuna
    "ten200", // Jecht
    "gst100", // Shantotto
    "gst110", // Prishe
    "gst120", // Vaan
    "gst130", // Lightning
    "gst200", // Gabranth
    "org100", // Cosmos
    "org700", // Shinryu
    "org800", // Mog
    "org200", // Chaos
    "org210", // Faral Chaos
];

/**
 * Regular expression to match
 * %2s, %3s, %5s and %6s strings
 * %1d, %2d, %3d, %4d and %5d numbers.
 */
const place_holders = /%[1-6][sd]/g;

/**
 * Extensions for different file types based of of magic guess.
 */
const exts = {
    "RIFF":        "at3",
    "ARC\u0001":   "objx",
    "MPK ":        "mpk",
    "OMG.":        "gmo",
    "DES4":        "id",
    "PSF":         "SFO",
    "MIG.":        "gim",
    "\u0002":      "exex", // can also be .se
    "\u0004":      "se",
    "\u0001":      "cosx",
    "SSCF":        "scd",
    "�PNG":       "png",
    "TIM2":        "tm2",
    "SEQ ":        "sequence",
    "drr":         "drr",
    "dec":         "dec",
    "dur":         "dur",
    "due":         "due",
    "dpr":         "dpr",
    "EXsW":        "txt",
    "dpc":         "dpc",

    "LRWD":        "bin",
    "mess":        "bin",
    "menu":        "bin",
    "mlng":        "bin",
    "VOLD":        "bin",
    "�\u0001":    "bin",
    "�\u0002":    "bin",
    "ef":          "bin",
    "\u0005":      "bin",
    "\u0006":      "bin",
    "PBTL":        "bin",
    "TPMC":        "bin",
    "\u0002\t":    "bin",
    "ACMD":        "bin",
    "\u0001!":     "bin",
    "SMSC":        "bin",
    "SRSC":        "bin",
    "CLSM":        "bin",
    "\u0004u":     "bin",
    "SRMC":        "bin",
 
    "WLCN":        "data", // unknown
    "P\u0002":     "data", // unknown
    "\u0005\u0001":"data", // unknown
    "\u0001\u0002":"data", // unknown
    "KPSH":        "data", // unknown
    "SDCV":        "data", // unknown
    "��":        "data", // unknown
    "\u0016\u0017":"data", // unknown
    "":            "data", // blank file
};

/**
 * %2s, %3s, %5s and %6s strings
 * %1d, %2d, %3d, %4d and %5d numbers.
 * 
 * @param {string} template string to replace
 * @returns {string[]} array of strings
 */
function generateReplacements(template) {
    const placeholderRegex = /%([1-6])([sd])/;  // Match %1d, %2s, etc.

    // Recursively replace placeholders in the template
    
    /**
     * Recursively replaces placeholders in a string with generated values.
     * 
     * This function identifies placeholders in the format of %Nd or %Ns
     * within the input string and generates all possible combinations
     * by replacing them with predefined strings or numbers. For example:
     * %2s is replaced with elements from the `name_2` array, %3d with numbers
     * from 000 to 999, and so on.
     * 
     * @param {string} str - The string containing placeholders to be replaced.
     * @returns {string[]} An array of all possible strings generated by
     * replacing the placeholders.
     */
    function replacePlaceholders(str) {
        const match = str.match(placeholderRegex);
        
        // If no more placeholders, return the string as-is
        if (!match) return [str];

        const [placeholder, width, type] = match;
        const generatedStrings = [];

        // Generate strings based on placeholder type and width
        switch (`${width}${type}`) {

            case '2s':
                for (let i = 0; i < name_2.length; i++) {
                    generatedStrings.push(str.replace(placeholder, name_2[i]));
                }
                break;
            case '3s':  
                for (let i = 0; i < name_3.length; i++) {
                    generatedStrings.push(str.replace(placeholder, name_3[i]));
                }
                break;
            case '5s':
                for (let i = 0; i < name_5.length; i++) {
                    generatedStrings.push(str.replace(placeholder, name_5[i]));
                }
                break;
            case '6s':
                for (let i = 0; i < name_6.length; i++) {
                    generatedStrings.push(str.replace(placeholder, name_6[i]));
                }
                break;

            case '1d':  // %1d -> generates numbers 0-9
                for (let i = 0; i <= 9; i++) {
                    generatedStrings.push(str.replace(placeholder, `${i}`));
                }
                break;
            case '2d':  // %2d -> generates numbers 00-99
                for (let i = 0; i <= 99; i++) {
                    generatedStrings.push(str.replace(placeholder, i.toString().padStart(2, '0')));
                }
                break;
            case '3d':  // %3d -> generates numbers 000-999
                for (let i = 0; i <= 999; i++) {
                    generatedStrings.push(str.replace(placeholder, i.toString().padStart(3, '0')));
                }
                break;
            case '4d':  // %4d -> generates numbers 0000-9999
                for (let i = 0; i <= 9999; i++) {
                    generatedStrings.push(str.replace(placeholder, i.toString().padStart(4, '0')));
                }
                break;
            case '5d':  // %5d -> generates numbers 00000-99999
                for (let i = 0; i <= 99999; i++) {
                    generatedStrings.push(str.replace(placeholder, i.toString().padStart(5, '0')));
                }
                break;

            default:
                break;
        }

        // Recursively replace remaining placeholders in each generated string
        let finalResults = [];
        for (const generated of generatedStrings) {
            finalResults = finalResults.concat(replacePlaceholders(generated));
        }

        return finalResults;
    }

    return replacePlaceholders(template);
  }

/**
 * Checks if a string contains %s or %d placeholders.
 *
 * @param {string} str - The string to test.
 * @returns {boolean} - True if %s or %d is found, otherwise false.
 */
function hasPlaceholders(str) {
    return place_holders.test(str);
};

/**
 * Converts a Big Endian hex string to a Little Endian integer.
 *
 * @param {string} hexStr - The Big Endian hex string.
 * @returns {number} The Little Endian integer.
 */
function bigEndianHexToLittleEndianInt(hexStr) {
    // Ensure the hex string has an even number of characters (pairs of bytes)
    if (hexStr.length % 2 !== 0) {
        hexStr = '0' + hexStr;
    }

    // Split into byte pairs, reverse, and join back into a string
    // @ts-ignore
    const littleEndianHex = hexStr.match(/../g).reverse().join('');
    
    // Parse the reversed hex string as an integer (base 16)
    return parseInt(littleEndianHex, 16);
};

/**
 * for CRC32
 */
const hash_table = [
    0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x28, 0x28, 0x28, 0x28, 0x28, 0x20, 0x20,
    0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
    0x88, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10,
    0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10,
    0x10, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x10, 0x10, 0x10, 0x10, 0x10,
    0x10, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02,
    0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x10, 0x10, 0x10, 0x10, 0x20,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

/**
 * Dissidia 012 PACKAGE_INFO.BIN file name hasher
 * 
 * @param {string} input - file name
 */
function hash(input){

    let v10 = new Int32Array(1);  // Initial hash value
    v10[0] =  -1;
    let v8 = new Int32Array(1);
    for (let idx = 0; idx < input.length; idx++) {

        v8[0] = input.charCodeAt(idx); // Get ASCII code of character

        // Adjust v8 if the least significant bit of hashTable[v8] is 1
        if ((hash_table[v8[0]] & 1) !== 0) {
            v8[0] += 32;
        }

        // XOR the shifted character value into v10
        v10[0] ^= v8[0] << 24;

        // Iterate 8 times to perform bitwise transformations on v10
        for (let i = 0; i < 8; i++) {
            const v13 = v10[0] >= 0; // Check the sign of v10
            v10[0] *= 2;
            if (!v13) {
                v10[0] ^= 0x4C11DB7; // XOR with the polynomial
            }
        }
    }
    return ~v10[0] >>> 0; // Return as unsigned 32-bit integer
};

/**
 * Converts a number to a 4-byte hexadecimal string.
 *
 * @param {number} num - The number to convert (0 to 2^32 - 1).
 * @returns {string} The 4-byte hexadecimal representation.
 */
function to4ByteHex(num) {
    if (num < 0 || num > 0xFFFFFFFF) {
        throw new RangeError("Number must be between 0 and 2^32 - 1.");
    }
    // @ts-ignore
    return num.toString(16).padStart(8, '0').match(/../g).reverse().join(''); // Ensure 8 hex characters (4 bytes)
};

/**
 * Reads a PACKAGE_INFO.BIN file and returns a map of hashes to objects with properties
 * - filename: the original file name
 * - hex: the 4-byte hexadecimal string representation of the hash
 * - offset: the offset in the PACKAGE.BIN file where the file is located
 * - size: the size of the file
 * - unk1: an unknown byte that is probably related to the file's compression
 * - type: the 4-byte type string of the file (only set if package_data is provided)
 *
 * @param {Buffer} info_data - the PACKAGE_INFO.BIN file
 * @param {bireader?} package_data - the PACKAGE.BIN file (optional)
 * @returns {Object.<number, {filename:string, hex:string, offset:number, size:number, unk1:number, type?:string}>}
 */
function read_info(info_data, package_data = null){
    const br = new bireader(info_data);
    br.le();
    const magic = br.uint();
    if(magic != 537461272){
        throw new Error(`Bad PACKAGE_INFO.BIN file (wrong magics ${magic})`);
    }
    const pack = br.string({length:4});
    if(pack != 'pack'){
        throw new Error(`Bad PACKAGE_INFO.BIN file (wrong header ${pack})`);
    }
    const count = br.uint();
    br.skip(4);
    /**
     * @type {Object.<number, {filename:string, hex:string, offset:number, size:number, unk1:number, type?:string}>}
     */
    const ret = {};
    for(let i=0; i<count; i++){
        const hash = br.uint();
        const offset = br.uint() * 2048;
        const size = br.bit24();
        const unk1 = br.ubyte();
        ret[hash] = {
            filename: "",
            hex: to4ByteHex(hash),
            offset: offset,
            size: size,
            unk1: unk1,
        };
        if(package_data){
            package_data.FSeek(offset);
            ret[hash].type = package_data.string({length:4})
        }
    }
    return ret;
};


/**
 * Creates a PACKAGE_INFO.json file with the hashes from the PACKAGE_INFO.BIN file and the names from the PACKAGE.BIN file.
 * If the PACKAGE_INFO.json file already exists, it asks if you want to overwrite it.
 * If you cancel the overwrite, it creates a PACKAGE_INFO_new.json file instead.
 * If it can't write the file, it logs an error and exits.
 * @param {string} PATH_TO_INFO - The path to the PACKAGE_INFO.BIN file.
 * @throws {Error} - If there is an issue reading the data.
 * @returns {Promise<void>} - A promise that resolves when the function is done.
 */
async function _MAKE_PACKAGE_INFO(PATH_TO_INFO){
    try {
        const PACKAGE_INFO_DATA = fs.readFileSync(PATH_TO_INFO);
        const PACKAGE_DATA_LOC = path.join(path.dirname(PATH_TO_INFO), "PACKAGE.BIN");
        var PACKAGE_DATA;
        if(fs.existsSync(PACKAGE_DATA_LOC)){
            Logger.info(`${C_HEX.green}Found PACKAGE.BIN in same direcotry.${C_HEX.reset} Will include meta data.`);
            const PACKAGE_DATA_READ = fs.readFileSync(PACKAGE_DATA_LOC);
            PACKAGE_DATA = new bireader(PACKAGE_DATA_READ);
        }
        const info = read_info(PACKAGE_INFO_DATA, PACKAGE_DATA);
        const new_loc = path.join(path.dirname(PATH_TO_INFO), "PACKAGE_INFO.json");
        // check if we can write the file
        if(fs.existsSync(new_loc)){
            // ask to replace   
            const answer = await ask("PACKAGE_INFO.json file exists. The new file won't have any files names. Do you want to overwrite it?");
            if(answer){
                // replace file
                fs.writeFileSync(new_loc, JSON.stringify(info,null,4));
                Logger.info("Replaced PACKAGE_INFO.json");
                Logger.info(new_loc);
                return await exit();
            } else {
                // creation canceled
                try {
                    const new_loc2 = path.join(path.dirname(PATH_TO_INFO), "PACKAGE_INFO_new.json");
                    if(!fs.existsSync(new_loc2)){
                        fs.writeFileSync(new_loc2, JSON.stringify(info,null,4));
                        Logger.info("PACKAGE_INFO_new.json created!");
                        Logger.info(new_loc2);
                        return await exit();
                    } else {
                        Logger.warn("PACKAGE_INFO.json creation canceled");
                        return await exit();
                    }
                } catch (error) {
                    Logger.error("Issue writing PACKAGE_INFO.json.");
                    Logger.error(error);
                    return await exit();
                }
            }
        } else {
            // write file and finish
            fs.writeFileSync(new_loc, JSON.stringify(info,null,4));
            Logger.info("PACKAGE_INFO.json created!");
            Logger.info(new_loc);
            return await exit();
        }
    } catch(error){
        Logger.error("Issue reading PACKAGE.BIN.");
        Logger.error(error);
        return await exit();
    }
};

/**
 * File size short hand. Example: ``1.5kb``.
 * 
 * @param {number} bytes - Size
 * @returns {string} formatted
 */
function _formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + 'kb';
    } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(2) + 'mb';
    } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + 'gb';
    }
}

/**
 * Loading bar function.
 * 
 * @param {number} totalSteps - total pos
 * @param {number} currentStep - current pos
 * @param {boolean|undefined} withSize - shows size of file as well
 * @returns {number}
 */
function _consoleLoadingBar(totalSteps, currentStep, withSize = false) {
    var barLength = 40;
    // Calculate the percentage completed
    const percentage = (currentStep / totalSteps) * 100;

    // Calculate the number of bars to display
    const bars = Math.floor((barLength * currentStep) / totalSteps);

    // Create the loading bar string
    const loadingBar = '[' + '='.repeat(bars) + '>'.repeat(bars < barLength ? 1 : 0) + ' '.repeat(barLength - bars) + ']';

    // Print the loading bar to the console
    process.stdout.clearLine(0); // Clear the previous line
    process.stdout.cursorTo(0); // Move the cursor to the beginning of the line
    process.stdout.write(
        `${C_HEX.green}${loadingBar}${C_HEX.reset} - ${percentage.toFixed(2)}%` +
        (withSize 
            ? ` of ${_formatFileSize(totalSteps)} / ${_formatFileSize(currentStep)}`
            : ` - ${currentStep} of ${totalSteps}`)
    );
    return 1;
};

/**
 * Extracts files from PACKAGE.BIN to the same directory, using the paths specified in PACKAGE_INFO.json.
 * 
 * @param {string} PATH_TO_DATA - path to PACKAGE.BIN file
 * @returns {Promise<any>} - true if extraction complete, false otherwise
 */
async function _EXTRACT_PACKAGE_DATA(PATH_TO_DATA){
    try {

        const PACKAGE_DATA = fs.readFileSync(PATH_TO_DATA);
        const br = new bireader(PACKAGE_DATA);
        const BASE_PATH = path.dirname(PATH_TO_DATA);
        const PACKAGE_INFO_LOC = path.join(BASE_PATH, "PACKAGE_INFO.json");

        if(!fs.existsSync(PACKAGE_INFO_LOC)){
            Logger.error("Couldn't find PACKAGE_INFO.json in PACKAGE.BIN folder.");
            Logger.error(PACKAGE_INFO_LOC);
            await exit();
        }

        const PACKAGE_INFO = JSON.parse(fs.readFileSync(PACKAGE_INFO_LOC).toString());

        const FILES = Object.values(PACKAGE_INFO).sort((a,b)=>a.offset - b.offset);

        const NUM_OF_FILES = FILES.length;

        Logger.info("Starting extraction to:");
        Logger.info(BASE_PATH);

        for (let i = 0; i < NUM_OF_FILES; i++) {
            try {

                const FILE = FILES[i];
                
                br.FSeek(FILE.offset);
                const file_data = br.extract(FILE.size);
                var FILE_PATH = path.join(BASE_PATH,FILE.filename);

                if( FILE.filename == "" ||
                    FILE.filename == undefined
                ){
                    const new_ext = exts[FILE.type] ? exts[FILE.type] : "data";
                    const new_name = FILE.hex + "." + new_ext;
                    FILE_PATH = path.join(BASE_PATH, new_name);
                }
            
                fs.writeFileSync(FILE_PATH,file_data);

                _consoleLoadingBar(NUM_OF_FILES, i + 1);

            } catch (error) {
                process.stdout.write('\n');
                Logger.error("Couldn't write data.");
                Logger.error(error);
                await exit();
            }
        }
        process.stdout.write('\n');

        Logger.info("Extract finished!");

        return true;

    } catch (error){
        Logger.error("Issue extraction from PACKAGE_INFO.");
        Logger.error(error);
        return await exit();
    }
};

async function _MAKE_PACKAGE_INFO_BIN(PATH_TO_JSON){
    try {
        const JSON_DATA = JSON.parse(fs.readFileSync(PATH_TO_JSON).toString());
        const NEW_PATH = path.join(path.dirname(PATH_TO_JSON), "PACKAGE_INFO.BIN" );
        const FILES = Object.values(JSON_DATA);
        const NUM_OF_FILES = FILES.length;
        Logger.info("Starting PACKAGE_INFO.BIN creation!");
        const bw = new biwriter(Buffer.alloc(0x3000));
        bw.le();
        bw.uint(537461272);
        bw.uint(1801675120); // pack
        bw.uint(NUM_OF_FILES);
        bw.uint(0);
        for (let i = 0; i < NUM_OF_FILES; i++) {
            const FILE = FILES[i];
            bw.uint(FILE.hash);
            bw.uint(FILE.offset / 2048);
            bw.bit24(FILE.size);
            bw.ubyte(FILE.unk1);
            _consoleLoadingBar(NUM_OF_FILES, i + 1);
        }
        process.stdout.write('\n');
        Logger.info("Finished PACKAGE_INFO.BIN creation!");
        bw.trim();
        const NEW_DATA = bw.get();
        
        if(fs.existsSync(NEW_PATH)){
            Logger.warn("PACKAGE_INFO.BIN exists in folder!");
            Logger.warn(NEW_PATH);
            const answer = await ask("Overwrite PACKAGE_INFO.BIN file?");
            if(answer){
                fs.writeFileSync(NEW_PATH, NEW_DATA);
                Logger.warn("New PACKAGE_INFO.BIN created!");
                return await exit();
            } else {
                Logger.warn("New PACKAGE_INFO.BIN canceled!");
                return await exit();
            }
        } else {
            fs.writeFileSync(NEW_PATH, NEW_DATA);
            Logger.warn(NEW_PATH);
            Logger.warn("New PACKAGE_INFO.BIN created!");
            return await exit();
        }

    } catch (error) {
        process.stdout.write('\n');
        Logger.error("Issue reading PACKAGE_INFO.BIN data.");
        Logger.error(error);
        return await exit();
    }
}

/**
 * Checks if the given hash has a filename associated with it in the file_list, and if not,
 * assigns the given string as the filename.
 * 
 * @param {Object} file_list - an object where the keys are the file hashes and the values are objects with filename and other properties.
 * @param {number} hsh - the hash of the file to check.
 * @param {String} str - the string to assign as the filename if it doesn't already have one.
 */
function check_name(file_list, hsh, str){
    if(file_list[hsh]){
        if(file_list[hsh].filename == ""){
            Logger.info(`${C_HEX.green}Found${C_HEX.reset}:`, str);
            file_list[hsh].filename = str;
            return 1;
        } else {
            Logger.warn(`${C_HEX.yellow}${hsh}${C_HEX.reset} already logged as: ${C_HEX.yellow}${file_list[hsh].filename}${C_HEX.reset}`);
            return 0;
        }
    }
    return 0;
};

/**
 * Reads a text file line by line, hashes each line, and checks if the hash
 * is associated with a filename in the provided file list. If no filename
 * is found, assigns the line as the filename.
 *
 * @param {string} TXT_FILE - The path to the text file to read.
 * @param {Object} JSON_DATA - An object mapping file hashes to their metadata, including filenames.
 * @param {string} PATH_TO_JSON - The path to the PACKAGE_INFO.json file.
 * @returns {Promise<any>} - Returns 1 if a new filename is assigned, 0 if the hash already has a filename, or does nothing if the hash is not found.
 */
async function read_text(TXT_FILE, JSON_DATA, PATH_TO_JSON){
    const TEXT_DATA = fs.readFileSync(TXT_FILE, 'utf8').split('\n');
    var amount = 0;
    for (let i = 0; i < TEXT_DATA.length; i++) {
        const str = TEXT_DATA[i].trim();
        if(hasPlaceholders(str)){
            Logger.info("Wildscards detected!");
            Logger.info("Creating an array of strings.");
            Logger.info(`${C_HEX.yellow}Note${C_HEX.reset}: False positive as possible so use sparingly.`);
            
            const str_arays = generateReplacements(str);
            const len = str_arays.length;
            for (let i = 0; i < str_arays.length; i++) {
                const str_path = str_arays[i];
                const hash_num = hash(str_path);
                Logger.info(`${C_HEX.yellow}[${i+1} of ${len}]${C_HEX.reset}: Path:`, str_path);
                Logger.info(`${C_HEX.yellow}[${i+1} of ${len}]${C_HEX.reset}: Number:`, hash_num);
                Logger.info(`${C_HEX.yellow}[${i+1} of ${len}]${C_HEX.reset}: Hex:`, to4ByteHex(hash_num));
                amount += check_name(JSON_DATA, hash_num, str_path);
            }
        } else {
            const hash_num = hash(str);
            Logger.info("Path:", str);
            Logger.info("Number:", hash_num);
            Logger.info("Hex:", to4ByteHex(hash_num));
            amount += check_name(JSON_DATA, hash_num, str);
        }  
    }

    Logger.info(`${C_HEX.green}Found ${amount} matches!${C_HEX.reset}`);
    fs.writeFileSync(PATH_TO_JSON, JSON.stringify(JSON_DATA,null,4));
    Logger.info("Updated PACKAGE_INFO.json file!");
    return await exit();
};

/**
 * Calculates the maximum size aligned to the nearest multiple of 2048 bytes.
 * 
 * If the input size is less than 2048, returns 2048. Otherwise, adjusts the size
 * to the next multiple of 2048 if it is not already aligned.
 * 
 * @param {number} size - The original size in bytes.
 * @returns {number} The adjusted size, aligned to 2048 bytes.
 */
function max_size(size) {
    if(size < 2048){
        return 2048;
    }
    var value = size % 2048;

    if (value) {
        return size + (2048 - value);
    } else {
        return size;
    }
};

/**
 * Replaces the file in PACKAGE.BIN file with the given replacement data.
 * If the replacement file is larger than the original file, it logs an error and exits.
 * If the file is not found in PACKAGE_INFO.json, it logs an error and exits.
 * Otherwise, it backs up the PACKAGE.BIN and PACKAGE_INFO.json files, updates the PACKAGE.BIN file,
 * and updates the PACKAGE_INFO.json file with the new size.
 * 
 * @param {string} PATH_TO_JSON - The path to the PACKAGE_INFO.json file.
 * @param {string} PATH_TO_DATA - The path to the PACKAGE.BIN file.
 * @param {Buffer} REPLACEMENT_DATA - The path to the replacement data file.
 * @param {string} filename - The filename of the file to be replaced.
 * @returns {Promise<void>} - A promise that resolves when the function is done.
 */
async function _REPLACE_FILE(PATH_TO_JSON, PATH_TO_DATA, REPLACEMENT_DATA, filename){
    const hash_num = hash(filename);
    const JSON_DATA = JSON.parse(fs.readFileSync(PATH_TO_JSON).toString());
    const MASTER_DATA = fs.readFileSync(PATH_TO_DATA);
    const PULL = JSON_DATA[hash_num];
    if( PULL != undefined ){
        const maxium_size = max_size(PULL.size);
        if(REPLACEMENT_DATA.byteLength > maxium_size){
            Logger.error("Replacement file size is too big.");
            Logger.error("Replacement Size:", REPLACEMENT_DATA.byteLength);
            Logger.error("Max Size:", maxium_size);
            return await exit();
        }
        const answer = await ask(`Sure you want to replace file ${filename}?`);
        if(answer){
            Logger.info("Backuping up data:", PATH_TO_JSON);
            fs.writeFileSync(`${PATH_TO_JSON}.backup`, JSON.stringify(JSON_DATA,null,4));
            Logger.info("Backuping up data:", PATH_TO_DATA);
            fs.writeFileSync(`${PATH_TO_DATA}.backup`, MASTER_DATA);
            PULL.size = REPLACEMENT_DATA.byteLength;
            const bw = new biwriter(MASTER_DATA);
            bw.strict = false;
            bw.goto(maxium_size); // max the file size
            bw.goto(PULL.offset);
            bw.replace(REPLACEMENT_DATA);
            fs.writeFileSync(PATH_TO_DATA, bw.get());
            fs.writeFileSync(PATH_TO_JSON, JSON.stringify(JSON_DATA,null,4));
            Logger.info("Updated PACKAGE.BIN file!");
            Logger.info("Updated PACKAGE_INFO.json file!");
            await _MAKE_PACKAGE_INFO_BIN(PATH_TO_JSON);
            return await exit();
        } else {
            Logger.info("Not replacing file.");
            return await exit();
        } 
    } else {
        Logger.error("Can not find file in file PACKAGE_INFO.json.");
        Logger.error(filename);
        return await exit();
    }
}

// Starts app
(async function () {

    var has_package_bin = false;
    if(_INPUT_FILE && path.basename(_INPUT_FILE).toLocaleLowerCase() == "package.bin"){
        has_package_bin = true;
    }

    var has_package_info_bin = false;
    if(_INPUT_FILE && path.basename(_INPUT_FILE).toLocaleLowerCase() == "package_info.bin"){
        has_package_info_bin = true;
    }

    var has_package_info_json = false;
    if(_INPUT_FILE && path.extname(_INPUT_FILE).toLocaleLowerCase() == 'json'){
        has_package_info_json = true;
    }

    var has_txt_file = false;
    if(_INPUT_FILE && path.extname(_INPUT_FILE).toLocaleLowerCase() == 'txt'){
        has_txt_file = true;
    }

    if(ARGV.replace && ARGV.filename){
        const {replace, filename} = ARGV;
        const PATH_TO_JSON = path.join(DIR_NAME, 'PACKAGE_INFO.json');
        if(!fs.existsSync(PATH_TO_JSON)){
            Logger.error("PACKAGE_INFO.json not in root directory.");
            Logger.error(PATH_TO_JSON);
            await exit();
        }
        const PATH_TO_DATA = path.join(DIR_NAME, 'PACKAGE.BIN');
        if(!fs.existsSync(PATH_TO_JSON)){
            Logger.error("PACKAGE.BIN not in root directory.");
            Logger.error(PATH_TO_DATA);
            await exit();
        }
        if(!fs.existsSync(replace)){
            Logger.error("Can not read replacement file.");
            Logger.error(replace);
            await exit();
        }
        try {
            const REPLACEMENT_DAT = fs.readFileSync(replace);
            Logger.info("Replacing file:", filename);
            await _REPLACE_FILE(PATH_TO_JSON, PATH_TO_DATA, REPLACEMENT_DAT, filename);
        } catch (error) {
            Logger.error("Issue replacing PACKAGE.BIN file.");
            Logger.error(error);
            await exit();
        }
    } else
    if(ARGV.text || has_txt_file){
        const TXT_INPUT = _INPUT_FILE || ARGV.compile.replace(/^=/,"");
        try {
            if(fs.existsSync(TXT_INPUT)){
                const PATH_TO_JSON = path.join(DIR_NAME, 'PACKAGE_INFO.json');
                if(!fs.existsSync(PATH_TO_JSON)){
                    Logger.error("PACKAGE_INFO.json not in root directory.");
                    Logger.error(PATH_TO_JSON);
                    await exit();
                }
                const JSON_DATA = JSON.parse(fs.readFileSync(PATH_TO_JSON).toString());
                await read_text(TXT_INPUT, JSON_DATA, PATH_TO_JSON);
            } else {
                Logger.error("File does not exist!");
                Logger.error(TXT_INPUT);
                await exit();
            }
        } catch (error) {
            Logger.error("Issue reading txt file.");
            Logger.error(error);
            await exit();
        }
    } else 
    if(ARGV.hash){
        const hash_str = ARGV.hash.replace(/^=/,"");
        try {
            const PATH_TO_JSON = path.join(DIR_NAME, 'PACKAGE_INFO.json');
            if(hasPlaceholders(hash_str)){
                if(fs.existsSync(PATH_TO_JSON)){
                    const JSON_DATA = JSON.parse(fs.readFileSync(PATH_TO_JSON).toString());
                    Logger.info("Wildscards detected!");
                    Logger.info("Creating an array of strings.");
                    Logger.info(`${C_HEX.yellow}Note${C_HEX.reset}: False positive as possible so use sparingly.`);
                    
                    const str_arays = generateReplacements(hash_str);
                    const len = str_arays.length;
                    var found = 0;
                    for (let i = 0; i < str_arays.length; i++) {
                        const str_path = str_arays[i];
                        const hash_num = hash(str_path);
                        Logger.info(`${C_HEX.yellow}[${i+1} of ${len}]${C_HEX.reset}: Path:`, str_path);
                        Logger.info(`${C_HEX.yellow}[${i+1} of ${len}]${C_HEX.reset}: Number:`, hash_num);
                        Logger.info(`${C_HEX.yellow}[${i+1} of ${len}]${C_HEX.reset}: Hex:`, to4ByteHex(hash_num));
                        found += check_name(JSON_DATA, hash_num, str_path);
                    }
                    Logger.info(`${C_HEX.green}Found ${found} matches!${C_HEX.reset}`);
                    fs.writeFileSync(PATH_TO_JSON, JSON.stringify(JSON_DATA,null,4));
                    Logger.info("Updated PACKAGE_INFO.json file!");
                    await exit();
                } else {
                    Logger.error("Couldn't find local PACKAGE_INFO.json to save the data.");
                    Logger.error(PATH_TO_JSON);
                    await exit();
                }
            } else {
                const hash_num = hash(hash_str);
                Logger.info("Path:", hash_str);
                Logger.info("Number:", hash_num);
                Logger.info("Hex:", to4ByteHex(hash_num));
                if(fs.existsSync(PATH_TO_JSON)){
                    const JSON_DATA = JSON.parse(fs.readFileSync(PATH_TO_JSON).toString());
                    check_name(JSON_DATA, hash_num, hash_str);
                    fs.writeFileSync(PATH_TO_JSON, JSON.stringify(JSON_DATA,null,4));
                    Logger.info("Updated PACKAGE_INFO.json file!");
                    await exit();
                } else {
                    Logger.error("Couldn't find local PACKAGE_INFO.json to save the data.");
                    Logger.error(PATH_TO_JSON);
                    await exit();
                }
            }
        } catch (error) {
            Logger.error("Issue reading PACKAGE_INFO.json data.");
            Logger.error(error);
            await exit();
        }
    } else 
    if(ARGV.compile|| has_package_info_json){
        const package_json = _INPUT_FILE || ARGV.compile.replace(/^=/,"");
        try {
            Logger.info("PACKAGE_INFO.BIN creation triggered!");
            if(fs.existsSync(package_json)){
                const PATH_TO_JSON = package_json;
                await _MAKE_PACKAGE_INFO_BIN(PATH_TO_JSON);
            } else {
                // trys for default location
                Logger.warn("Couldn't find PACKAGE_INFO.json in input path.");
                Logger.warn(package_json);
                const PATH_TO_JSON = path.join(DIR_NAME, 'PACKAGE_INFO.json');
                if(!fs.existsSync(PATH_TO_JSON)){
                    Logger.error("Could not find PACKAGE_INFO.json.");
                    Logger.error(PATH_TO_JSON);
                    await exit();
                }
                await _MAKE_PACKAGE_INFO_BIN(PATH_TO_JSON);
            }
        } catch (error) {
            Logger.error("Issue reading PACKAGE_INFO.json.");
            Logger.error(error);
            await exit();
        } 
    } else
    if (ARGV.package_info || has_package_info_bin) {
        const package_info = _INPUT_FILE || ARGV.package_info.replace(/^=/,"");
        Logger.info("PACKAGE_INFO.json creation triggered!");
        try {
            // trys the input string as path
            if(fs.existsSync(package_info)){
                const PATH_TO_INFO = package_info;
                await _MAKE_PACKAGE_INFO(PATH_TO_INFO);
            } else {
                // trys for default location
                Logger.warn("Couldn't find PACKAGE_INFO.BIN in input path.");
                Logger.warn(package_info);
                Logger.warn("Falling back to execute directory.");
                const PATH_TO_INFO = path.join(DIR_NAME, 'PACKAGE_INFO.BIN');
                if(!fs.existsSync(PATH_TO_INFO)){
                    Logger.error("Could not find PACKAGE_INFO.BIN.");
                    Logger.error(PATH_TO_INFO);
                    await exit();
                }
                await _MAKE_PACKAGE_INFO(PATH_TO_INFO);
            }
        } catch (error) {
            Logger.error("Issue reading PACKAGE_INFO.BIN.");
            Logger.error(error);
            await exit();
        }
    } else 
    if(ARGV.extract || has_package_bin){
        const extract = _INPUT_FILE || ARGV.extract.replace(/^=/,"");
        // trys the input string as path
        Logger.info("PACKAGE.BIN extract triggered!");
        const answer = await ask("This will unpack all files in the directory of the PACKAGE.BIN file. Continue?");
        if(answer){
            try {
                if(fs.existsSync(extract)){
                    const PATH_TO_DATA = extract;
                    await _EXTRACT_PACKAGE_DATA(PATH_TO_DATA);
                } else {
                    // trys for default location
                    Logger.warn("Couldn't find PACKAGE.BIN in input path.");
                    Logger.warn(extract);
                    Logger.warn("Falling back to execute directory.");
                    const PATH_TO_DATA = path.join(DIR_NAME,"PACKAGE.BIN");
                    if(!fs.existsSync(PATH_TO_DATA)){
                        Logger.error("Could not find PACKAGE.BIN.");
                        Logger.error(PATH_TO_DATA);
                        await exit();
                    }
                    await _EXTRACT_PACKAGE_DATA(PATH_TO_DATA);
                }
            } catch (error){
                Logger.error("Issue extracting data.");
                Logger.error(error);
                await exit();
            }
        } else {
            Logger.info("Extract cancelled.");
            await exit();
        }
    } else {
        Logger.error("Didn't run anything. Try running the programming with --help to get started.");
        await exit();
    }
})();