const express = require('express');
const dotenv = require('dotenv');
const { 
    CloudAdapter, 
    ConfigurationBotFrameworkAuthentication, 
    ActivityHandler, 
    CardFactory, 
    MessageFactory 
} = require('botbuilder');

// Cargar credenciales del archivo .env
dotenv.config();

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType
});

const adapter = new CloudAdapter(botFrameworkAuthentication);
const tarjetaFormulario = require('./tarjetaUbicacion.json');

// Manejador de eventos del chat
class BotConsultasTecnicas extends ActivityHandler {
    constructor() {
        super();
        
        this.onMessage(async (context, next) => {
            const datosTarjeta = context.activity.value;

            // Si el usuario escribe texto común, le enviamos el formulario interactivo
            if (!datosTarjeta) {
                const tarjetaAdjunta = CardFactory.adaptiveCard(tarjetaFormulario);
                await context.sendActivity({ attachments: [tarjetaAdjunta] });
            } 
            // Si el usuario presionó el botón "Enviar Reporte" en el formulario
            else if (datosTarjeta.id === 'guardar_reporte') {
                const { latitud, longitud, descripcion } = datosTarjeta;

                // Muestra los datos capturados en la consola de Linux
                console.log(`\n====================================`);
                console.log(`📥 ¡REPORTE DETECTADO DESDE TEAMS!`);
                console.log(`🌐 Latitud: ${latitud}`);
                console.log(`🌐 Longitud: ${longitud}`);
                console.log(`📝 Descripción: ${descripcion}`);
                console.log(`====================================\n`);

                // Confirmación visual hacia la pantalla de Teams del agente
                const mensajeConfirmacion = `### ✅ Reporte Guardado Exitosamente\n\n` +
                                            `• **Coordenadas:** \`${latitud}, ${longitud}\`\n` +
                                            `• **Detalles:** ${descripcion || '*Sin descripción*'}`;
                                            
                await context.sendActivity(MessageFactory.text(mensajeConfirmacion));
            }
            await next();
        });
    }
}

// Inicializar Express
const server = express();
server.use(express.json());

const bot = new BotConsultasTecnicas();

// Endpoint oficial que requiere Microsoft Teams
server.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, (context) => bot.run(context));
});

const PORT = 3978;
server.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando localmente en http://localhost:${PORT}`);
});