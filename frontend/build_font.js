var fs = require('fs');
var path = require('path');
var OUTPUT_VFS_FONTS_FILE_PATH = 'fonts/vfs_fonts.js';
var OUTPUT_FONTS_MAP_FILE_PATH = 'fonts/fonts_map.js';

var filePath = process.argv[2];
var fileName = path.basename(filePath);

// create vfs fonts file
var data = fs.readFileSync(filePath, 'base64');
var vfsObject = {};
vfsObject[fileName] = data;
var vfsFontsSourceCode = 'this.pdfMake = this.pdfMake || {}; this.pdfMake.vfs = ' + JSON.stringify(vfsObject) + ';';
fs.writeFileSync(OUTPUT_VFS_FONTS_FILE_PATH,  vfsFontsSourceCode);
console.log(OUTPUT_VFS_FONTS_FILE_PATH + ' has been created.');

// create fonts map file
var fontName = fileName.slice(0, -path.extname(fileName).length);
var mapObject = {};
mapObject[fontName] = {
  normal: fileName,
  bold: fileName,
  italics: fileName,
  bolditalics: fileName
};
var fontsMapSourceCode = 'module.exports = ' + JSON.stringify(mapObject) + ';';
fs.writeFileSync(OUTPUT_FONTS_MAP_FILE_PATH,  fontsMapSourceCode);
console.log(OUTPUT_FONTS_MAP_FILE_PATH + ' has been created.');
