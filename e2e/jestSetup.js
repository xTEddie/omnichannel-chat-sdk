const fs = require('fs');

if (!process.env.FILE) {
    throw Error("'FILE' config not specified.");
}

try { 
    const data = fs.readFileSync(process.env.FILE, 'utf-8');
    process.env.CONFIG = data;
} catch (error) {
    throw Error(`${error}`);
}
