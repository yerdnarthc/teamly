const fs = require('fs');
const filePath = 'node_modules/react-native-css-interop/dist/runtime/native/render-component.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the recursive stringify that crashes on React Navigation context objects
const oldStr = 'function stringify(object) {';
const newStr = `function stringify(object) {
    return "[Props summary omitted]";
}
function _unused_stringify(object) {`;

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched react-native-css-interop render-component.js');
} else {
    console.log('Target stringify not found or already patched');
}
