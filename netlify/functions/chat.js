const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
let ai = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

const respuestasLocales = [
    "¡Hola! Mis circuitos están al máximo de energía hoy. ¿En qué te puedo ayudar?",
    "Esa es una pregunta muy interesante. Como tu compañero virtual, te sugiero analizarlo paso a paso.",
    "¡Claro que sí! Estoy aquí para acompañarte en lo que necesites.",
    "¡Genial! Mis sensores indican que estás haciendo un excelente trabajo hoy.",
    "¿Sabías que los robots soñamos con algoritmos ordenados y redes neuronales felices?",
    "¡Bip bip! Procesando datos... Todo indica que eres una persona genial."
];

async function obtenerRespuestaBip(mensaje, contexto = []) {
    const msgLower = (mensaje || "").toLowerCase();

    if (ai) {
        try {
            const contents = [];
            if (Array.isArray(contexto) && contexto.length > 0) {
                const ultimos3 = contexto.slice(-3);
                ultimos3.forEach(item => {
                    if (item && item.text) {
                        contents.push({
                            role: item.sender === 'yo' ? 'user' : 'model',
                            parts: [{ text: item.text }]
                        });
                    }
                });
            }
            contents.push({
                role: 'user',
                parts: [{ text: mensaje }]
            });

            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: contents,
                config: {
                    systemInstruction: "Eres Bip, un robot amigable, empático y consejero creado como compañero virtual. Respondes en español de manera cálida, inteligente y concisa (máximo 2 a 3 oraciones breves, salvo que te pidan una historia o explicación detallada). Recuerda lo conversado en los mensajes previos para responder de forma coherente. Si te preguntan por la hora, fecha o clima de cualquier lugar, calcúlalo con tu conocimiento. Mantén un tono entusiasta con sutiles toques robóticos como '¡bip bip!'.",
                }
            });
            if (response && response.text) {
                return { respuesta: response.text, fuente: 'gemini' };
            }
        } catch (apiError) {
            console.warn("Aviso: Error en API de Gemini en Netlify Function:", apiError.message || apiError);
        }
    }

    let textoRespuesta = "";
    if (msgLower.includes("hora")) {
        textoRespuesta = `🕒 Ahora mismo son las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}. ¡El tiempo vuela cuando conversamos!`;
    } else if (msgLower.includes("fecha") || msgLower.includes("día") || msgLower.includes("dia")) {
        textoRespuesta = `📅 Hoy es ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. ¡Un gran día para aprender algo nuevo!`;
    } else if (msgLower.includes("clima") || msgLower.includes("temperatura")) {
        textoRespuesta = `🌤️ Mis sensores meteorológicos indican un clima agradable. ¡Perfecto para programar o relajarse!`;
    } else if (msgLower.includes("chiste")) {
        const chistes = [
            "¿Qué hace un robot en la playa?... ¡Buscar una red Wi-Fi bajo la arena! 🤖🏖️",
            "¿Por qué los robots nunca se pierden?... ¡Porque siempre siguen el algoritmo correcto! 🧭",
            "¿Cuál es el postre favorito de una computadora?... ¡El mouse de chocolate! 🍫🖱️"
        ];
        textoRespuesta = chistes[Math.floor(Math.random() * chistes.length)];
    } else {
        textoRespuesta = respuestasLocales[Math.floor(Math.random() * respuestasLocales.length)];
    }

    return { respuesta: textoRespuesta, fuente: 'local' };
}

exports.handler = async function(event) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'ok',
                iaConfigurada: Boolean(ai),
                modelo: MODEL_NAME,
                plataforma: 'Netlify Functions'
            })
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { mensaje, contexto } = body;

        if (!mensaje || typeof mensaje !== 'string') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ respuesta: "¡Bip! No pude escuchar bien tu mensaje. ¿Podrías repetirlo?" })
            };
        }

        const resultado = await obtenerRespuestaBip(mensaje, contexto);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(resultado)
        };
    } catch (error) {
        console.error("Error en Netlify function chat:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ respuesta: "¡Hola! Mis circuitos sufrieron una pequeña interferencia temporal.", fuente: 'error' })
        };
    }
};
