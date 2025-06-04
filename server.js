const express = require('express');
const app = express();

// Adiciona os headers CORS necessários
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Embedder-Policy', 'require-corp');
    res.header('Cross-Origin-Opener-Policy', 'same-origin');
    next();
});

// Serve os arquivos estáticos
app.use(express.static('./'));

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
