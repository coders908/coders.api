// Demo of a simple CodersAPI application
const CodersAPI = require('coders.api');

const app = new CodersAPI({
    name: 'My New API',
});

app.get('/', (req, res) => {
    res.ok({ message: 'Welcome to CodersAPI!' });
});

app.start(3000); 
