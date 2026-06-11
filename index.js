const { ActivityHandler, CardFactory } = require('botbuilder');
const fs = require('fs');
const path = require('path');

// Cargar la tarjeta de búsqueda
const searchCardRaw = fs.readFileSync(path.join(__dirname, './cards/searchCard.json'), 'utf8');
const searchCard = JSON.parse(searchCardRaw);

class TecnicoBot extends ActivityHandler {
    constructor() {
        super();

        // Se ejecuta cuando el técnico le escribe cualquier palabra al bot
        this.onMessage(async (context, next) => {
            const value = context.activity.value;

            // Si el técnico llenó la tarjeta y presionó "Buscar Datos"
            if (value && value.action === 'buscarTecnico') {
                await this.procesarBusqueda(context, value);
            } else {
                // Si solo envió un saludo o texto aleatorio, le enviamos el formulario de búsqueda
                await context.sendActivity({
                    text: 'Por favor, utiliza el siguiente formulario para consultar:',
                    attachments: [CardFactory.adaptiveCard(searchCard)]
                });
            }
            await next();
        });

        // Mensaje de bienvenida cuando el técnico abre el chat por primera vez
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('¡Bienvenido al Bot Técnico! Aquí puedes consultar los estados de la red.');
                    await context.sendActivity({
                        attachments: [CardFactory.adaptiveCard(searchCard)]
                    });
                }
            }
            await next();
        });
    }

    // Lógica para conectarse a tu Base de Datos de Azure y responder
    async procesarBusqueda(context, datos) {
        const idAntena = datos.idAntena;
        const direccion = datos.direccionResidencia;

        await context.sendActivity(`🔍 Buscando información en el sistema...`);

        // AQUÍ CONECTAS TU BASE DE DATOS (Azure SQL, CosmosDB, etc.)
        // Ejemplo simulado de respuesta:
        let resultadoTexto = "";
        
        if (idAntena) {
            resultadoTexto = `📋 **Resultados para Antena:** ${idAntena}\n\n` +
                             `• **Configuración:** Frecuencia 5.8GHz - Canal 40\n` +
                             `• **Perfil de Velocidad:** 100 Mbps Simétrico\n` +
                             `• **Entrada de SAID:** SAID-VLAN-102 (Activo)\n` +
                             `• **Punto de Acceso:** AP-Central (4 usuarios conectados - Online)`;
        } else if (direccion) {
            resultadoTexto = `📋 **Resultados para Dirección:** ${direccion}\n\n` +
                             `• **Cliente Asociado:** Juan Pérez (ID: 5542)\n` +
                             `• **ID Antena:** ANT-8821\n` +
                             `• **Perfil de Velocidad:** 50 Mbps\n` +
                             `• **Punto de Acceso:** AP-Residencial (Online)`;
        } else {
            resultadoTexto = "⚠️ Debes ingresar al menos un parámetro (ID o Dirección) para realizar la consulta.";
        }

        // Devolver los resultados técnicos en texto o en otra Adaptive Card limpia
        await context.sendActivity(resultadoTexto);
    }
}

module.exports.TecnicoBot = TecnicoBot;
