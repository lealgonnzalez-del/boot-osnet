const restify = require('restify');
const { CloudAdapter, ConfigurationBotFrameworkAuthentication } = require('botbuilder');
const { TecnicoBot } = require('./index'); // Importa el archivo index.js anterior

// Crear el servidor web para pruebas locales
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(3978, () => {
    console.log(`\n🤖 Bot ejecutándose de forma local en http://localhost:3978/api/messages`);
    console.log(`🚀 Abre el Bot Framework Emulator para conectarte.`);
});

// Configuración de autenticación vacía para pruebas locales (sin Azure todavía)
const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication({});
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Instanciar la lógica del bot
const myBot = new TecnicoBot();

// Escuchar los mensajes entrantes del emulador
server.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, (context) => myBot.run(context));
});
