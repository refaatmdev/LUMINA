const fs = require('fs');
const path = require('path');

const version = {
    version: Date.now()
};

const outputPath = path.join(__dirname, 'public', 'version.json');

fs.writeFileSync(outputPath, JSON.stringify(version, null, 2));

console.log(`Generated version.json with timestamp: ${version.version}`);
