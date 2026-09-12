const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const respuestasLocales = [
    "¡Hola! Mis circuitos están al máximo de energía hoy. ¿En qué te puedo ayudar?",
    "Esa es una pregunta muy interesante. Como tu compañero virtual, te sugiero analizarlo paso a paso.",
    "¡Claro que sí! Estoy aquí para acompañarte en lo que necesites.",
    "¡Genial! Mis sensores indican que estás haciendo un excelente trabajo hoy."
];

app.post('/api/chat', async (req, res) => {
    try {
        const { mensaje } = req.body;
        let textoRespuesta = "";

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: mensaje,
                config: {
                    systemInstruction: "Eres Bip, un robot amigable, empático y consejero creado como compañero virtual. Respondes en español de manera cálida y breve. Si el usuario te pregunta por la hora, fecha o clima de otro país o ciudad del mundo, calcúlalo basándote en tu conocimiento global.",
                }
            });
            textoRespuesta = response.text;
        } catch (apiError) {
            console.log("Aviso: Límite de API alcanzado temporalmente. Activando respaldo inteligente local.");
            const msgLower = mensaje.toLowerCase();
            if (msgLower.includes("hora")) {
                textoRespuesta = `🕒 Ahora mismo son las ${new Date().toLocaleTimeString()}. (Modo respaldo local activo).`;
            } else if (msgLower.includes("clima") || msgLower.includes("temperatura")) {
                textoRespuesta = `🌤️ El clima se ve agradable. ¡Un gran día para programar!`;
            } else if (msgLower.includes("chiste")) {
                textoRespuesta = `¿Qué hace un robot en la playa?... ¡Buscar una red Wi-Fi bajo la arena! 🤖😂`;
            } else {
                textoRespuesta = respuestasLocales[Math.floor(Math.random() * respuestasLocales.length)];
            }
        }

        res.json({ respuesta: textoRespuesta });
    } catch (error) {
        console.error("Error crítico:", error);
        res.status(500).json({ respuesta: "¡Hola! Todo está bajo control en mis circuitos." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Bip corriendo en puerto ${PORT}`);
});