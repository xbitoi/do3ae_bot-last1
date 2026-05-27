const https = require('https');

https.get("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyA1C-hS4oXzSSrLdiSI3nDvpBi6QcRWQis", (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const models = JSON.parse(data).models;
            console.log(models.map(m => m.name).join('\n'));
        } catch (e) {
            console.log("Error inside request", e);
            console.log(data);
        }
    });
}).on('error', (err) => {
    console.log("Error: ", err.message);
});
