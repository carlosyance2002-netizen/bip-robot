# 🤖 Bip Robot — Asistente Virtual Interactivo

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Gemini_2.0_Flash-Google_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify" />
  <img src="https://img.shields.io/badge/UI-Glassmorphism-7928CA?style=for-the-badge" alt="Glassmorphism" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>Bip</strong> es un compañero robótico virtual 3D interactivo para la web. Combina micro-animaciones fluidas en CSS puro, síntesis de audio procedural (Web Audio API), reconocimiento de voz y un núcleo de Inteligencia Artificial conectado con <strong>Google Gemini 2.0 Flash</strong> y memoria contextual de 3 turnos.
</p>

---

## ✨ Características Principales

### 🦾 Robot 3D y Micro-Animaciones
* **Silueta y Anatomía Amigable**: Cabeza y torso redondeados, antena con bombilla luminosa pulsante, brazos articulados y piernas suspendidas.
* **Corazón Robótico Mecha**: Chasis mecha facetado con circuitos y nodo central de energía. Presenta un ritmo de doble latido (`lub-dub`) y entra en sobrecarga emocional feliz al tocarlo.
* **Seguimiento Visual Reactivo**: La cabeza y las pupilas siguen el cursor o toques en tiempo real mediante `requestAnimationFrame` sin afectar la levitación vertical del cuerpo.
* **Sombra de Suelo Dinámica**: Gradiente elíptico en el piso que escala e intensifica su opacidad sincrónicamente con el flotado del robot.
* **Atención Activa**: Micro-asentimiento rítmico (`.asintiendo`) cuando el usuario enfoca el campo de texto o habla por micrófono.
* **Modo Sueño Autónomo**: Tras 60 segundos de inactividad, Bip apaga sus sensores y duerme plácidamente con animación de burbujas `Zzz`, despertando al interactuar con él.

### 🎨 Diseño y Personalización
* **Palette Dial (Menú Circular Expandible)**: Selector de temas compacto en la barra superior con indicador dinámico de color que se despliega elásticamente y se cierra al seleccionar o hacer clic fuera.
* **4 Temas de Color Cuidados**:
  * 🧛 **Dracula**: Púrpura cósmico, cian y acentos fucsia.
  * ⚡ **Cyberpunk**: Amarillo neón eléctrico y negro noche.
  * 🟩 **Matrix**: Verde terminal esmeralda y negro OLED.
  * ☀️ **Solar**: Ámbar dorado y azul medianoche.
* **Estética Glassmorphism**: Superficies con desenfoque de fondo (`backdrop-filter`), sin bordes neón chillones ni saturación visual.
* **100% Iconos Vectoriales SVG**: Cero emojis crudos de sistema en la interfaz de usuario.
* **Tipografía Google Fonts**: *Space Grotesk* para interfaces/botones y *Inter* para lectura óptima de respuestas.

### 🧠 Inteligencia Artificial y Audio
* **Memoria Contextual Eficiente**: El backend transmite los **últimos 3 mensajes** para conservar el hilo de la conversación sin exceder cuotas de tokens.
* **Contingencia Local Autónoma**: Si no hay conexión o no se ha configurado la API Key, Bip continúa respondiendo localmente mediante un motor autónomo.
* **Efectos de Sonido Procedurales (Web Audio API)**: Generación sintética de ondas sinusoidales y triangulares para envío, recepción, despertar y latido del corazón (0 dependencias de archivos MP3/WAV externos).
* **Voz Bidireccional**: Dictado por micrófono (Web Speech API) y lectura automática en voz alta (SpeechSynthesis).

---

## 🗂️ Estructura del Proyecto

```text
bip-robot/
├── index.html                 # Estructura semántica, SVG vectoriales y layout responsive
├── style.css                  # Estilos modernos, temas CSS, animaciones y glassmorphism
├── app.js                     # Lógica cliente: audio Web Audio, voz, paleta y chat
├── server.js                  # Servidor Express para desarrollo local
├── package.json               # Dependencias mínimas del proyecto
├── package-lock.json          # Árbol de dependencias bloqueado
├── netlify.toml               # Configuración de build y redirecciones serverless
└── netlify/
    └── functions/
        └── chat.js            # Función Serverless para Netlify (Gemini 2.0 Flash)
```

---

## 🚀 Instalación y Uso Local

### Prerrequisitos
* **Node.js** v18 o superior instalado.
* Clave de API de **Google Gemini** (opcional para desarrollo local; sin ella funciona en modo autónomo local).

### Pasos

1. **Clonar o descargar el repositorio**:
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   cd TU_REPOSITORIO
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo**:
   ```bash
   npm start
   ```

4. **Abrir en el navegador**:
   Visita `http://localhost:3000` en tu navegador web.

> [!TIP]
> Si deseas usar tu clave de Gemini en local, puedes exportarla en tu terminal antes de iniciar:
> ```bash
> export GEMINI_API_KEY="tu_clave_aqui"
> npm start
> ```

---

## 🌐 Despliegue en Netlify

El proyecto está diseñado y configurado para desplegarse en **Netlify** sin pasos adicionales de compilación.

### 1. Conectar Repositorio
Conecta tu repositorio de GitHub a un nuevo sitio en [Netlify](https://app.netlify.com/).

### 2. Configurar Variables de Entorno
En el panel de Netlify:
1. Dirígete a **Site configuration** > **Environment variables**.
2. Añade la variable:
   * **Key**: `GEMINI_API_KEY`
   * **Value**: *Tu clave de Gemini API*

### 3. ¡Listo!
Netlify detectará automáticamente el archivo [`netlify.toml`](netlify.toml), publicará la raíz como sitio estático y desplegará la función serverless [`netlify/functions/chat.js`](netlify/functions/chat.js), enlazando la ruta `/api/chat` de forma transparente.

> [!IMPORTANT]
> Nunca subas la carpeta `node_modules/` ni archivos `.env` a GitHub. Netlify se encarga de instalar las dependencias automáticamente durante el despliegue.

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> o <kbd>/</kbd> | Enfocar rápidamente el campo de entrada de texto |
| <kbd>Enter</kbd> | Enviar el mensaje redactado a Bip |
| <kbd>Escape</kbd> | Detener la voz en reproducción o cerrar el menú de temas |

---

## 🛠️ Tecnologías Utilizadas

* **Frontend**: HTML5 Semántico, CSS3 Moderno (Custom Properties, Grid, Flexbox, 3D Transforms), JavaScript ES6+.
* **Web APIs Nativas**: Web Audio API (sintetizador de SFX), Web Speech API (reconocimiento de voz), SpeechSynthesis (síntesis de voz), LocalStorage (persistencia de historial y ajustes).
* **Backend**: Node.js, Express, Netlify Serverless Functions.
* **Inteligencia Artificial**: `@google/genai` (Google Gemini 2.0 Flash).

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Siéntete libre de utilizarlo, modificarlo y compartirlo.
