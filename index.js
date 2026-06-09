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

// Manejador de eventos del chat y canales
class BotConsultasTecnicas extends ActivityHandler {
    constructor() {
        super();
        
        this.onMessage(async (context, next) => {
            const datosTarjeta = context.activity.value;
            
            // Extraer de forma segura los datos del técnico que interactúa
            const nombreTecnico = context.activity.from ? context.activity.from.name : 'Técnico';
            const idTecnico = context.activity.from ? context.activity.from.id : 'N/A';

            // CASO 1: El técnico inicia la petición (Escribe texto o menciona al bot en el canal)
            if (!datosTarjeta) {
                const tarjetaAdjunta = CardFactory.adaptiveCard(tarjetaFormulario);
                
                // Al responder al contexto actual, el SDK garantiza que la tarjeta
                // se renderice exactamente en el hilo donde el técnico invocó al bot.
                await context.sendActivity({
                    text: `Hola **${nombreTecnico}**, por favor registra los datos de tu ubicación en este hilo:`,
                    attachments: [tarjetaAdjunta]
                });
            } 
            // CASO 2: El técnico llenó su tarjeta y presionó el botón "Enviar Reporte"
            else if (datosTarjeta.id === 'guardar_reporte') {
                const { latitud, longitud, descripcion } = datosTarjeta;

                // --- BACKEND LOG SEPARADO POR HILO Y TÉCNICO ---
                console.log(`\n==================================================`);
                console.log(`📥 ¡REPORTE SEPARADO DETECTADO DESDE TEAMS!`);
                console.log(`👤 Técnico: ${nombreTecnico} (ID Azure: ${idTecnico})`);
                console.log(`🌐 Latitud: ${latitud}`);
                console.log(`🌐 Longitud: ${longitud}`);
                console.log(`📝 Descripción: ${descripcion}`);
                console.log(`🆔 ID de conversación/hilo: ${context.activity.conversation.id}`);
                console.log(`==================================================\n`);

                // Confirmación visual estructurada que se responderá dentro del mismo hilo
                const mensajeConfirmacion = `### ✅ Reporte Guardado para **${nombreTecnico}**\n\n` +
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