/* ==========================================================================
   BIP ROBOT - LÓGICA DE APLICACIÓN MODULAR Y EFICIENTE
   Temas dinámicos, memoria contextual, iconos SVG y reactor holográfico
   ========================================================================== */

(function () {
    "use strict";

    // Constantes y claves de almacenamiento
    const STORAGE_KEY_CHAT = "bip_chat_history_v2";
    const STORAGE_KEY_USER = "bip_nombre_usuario";
    const STORAGE_KEY_SFX = "bip_sfx_activado";
    const STORAGE_KEY_THEME = "bip_skin_theme";
    const TIEMPO_INACTIVIDAD_MS = 60000; // 60s para modo sueño

    // Iconos SVG reutilizables
    const ICON_VOZ_SVG = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
    const ICON_COPIAR_SVG = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const ICON_CHECK_SVG = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    // Elementos del DOM
    const robotElement = document.getElementById("robot");
    const cabezaElement = document.getElementById("cabeza");
    const antenaPunta = document.querySelector(".antena-punta");
    const pupilas = document.querySelectorAll(".ojo-pupila");
    const corazon = document.getElementById("corazon") || document.getElementById("reactor");
    const chatBox = document.getElementById("chat-box");
    const userInput = document.getElementById("user-input");
    const micBtn = document.getElementById("mic-btn");
    const sfxBtn = document.getElementById("sfx-toggle");
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");
    const paletteDialWrapper = document.getElementById("palette-dial-wrapper");
    const paletteFab = document.getElementById("palette-fab");
    const palettePopup = document.getElementById("palette-popup");
    const activeColorDot = document.getElementById("active-color-dot");

    // Mapa de colores principales para temas
    const COLORES_TEMA = {
        dracula: "#bd93f9",
        cyberpunk: "#fcee0a",
        matrix: "#00ff66",
        solar: "#ffb703"
    };

    // Estado de la aplicación
    let bipDespierto = false;
    let estaDurmiendo = false;
    let temporizadorInactividad = null;
    let nombreUsuario = localStorage.getItem(STORAGE_KEY_USER) || "";
    let sfxHabilitado = localStorage.getItem(STORAGE_KEY_SFX) !== "false";
    let temaActual = localStorage.getItem(STORAGE_KEY_THEME) || "dracula";
    let chatHistorial = [];
    let recognitionInstance = null;
    let isListening = false;
    let audioCtx = null;

    /* ==========================================================================
       EFECTOS DE SONIDO SINTÉTICOS (WEB AUDIO API - 0 DEPENDENCIAS)
       ========================================================================== */
    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function reproducirSFX(tipo) {
        if (!sfxHabilitado) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        switch (tipo) {
            case "enviar":
                osc.type = "sine";
                osc.frequency.setValueAtTime(480, now);
                osc.frequency.exponentialRampToValueAtTime(840, now + 0.12);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
                break;
            case "recibir":
                osc.type = "triangle";
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.09);
                osc.frequency.setValueAtTime(784, now + 0.18);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
                osc.start(now);
                osc.stop(now + 0.28);
                break;
            case "corazon":
                osc.type = "sine";
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case "despertar":
                osc.type = "sine";
                osc.frequency.setValueAtTime(330, now);
                osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
                break;
        }
    }

    function toggleSFX() {
        sfxHabilitado = !sfxHabilitado;
        localStorage.setItem(STORAGE_KEY_SFX, sfxHabilitado);
        actualizarBotonSFX();
        if (sfxHabilitado) reproducirSFX("enviar");
    }

    function actualizarBotonSFX() {
        if (sfxBtn) {
            const sfxLabel = sfxBtn.querySelector("span");
            if (sfxLabel) sfxLabel.innerText = sfxHabilitado ? "Audio" : "Mudo";
            const sfxIcon = document.getElementById("sfx-icon");
            if (sfxIcon) {
                sfxIcon.innerHTML = sfxHabilitado
                    ? `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>`
                    : `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>`;
            }
            sfxBtn.title = sfxHabilitado ? "Silenciar efectos de audio" : "Activar efectos de audio";
        }
    }

    /* ==========================================================================
       GESTIÓN DE TEMAS / SKINS
       ========================================================================== */
    function aplicarTema(nuevoTema) {
        temaActual = nuevoTema;
        document.documentElement.setAttribute("data-theme", nuevoTema);
        localStorage.setItem(STORAGE_KEY_THEME, nuevoTema);

        document.querySelectorAll(".palette-item").forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-theme") === nuevoTema);
        });

        if (activeColorDot) {
            activeColorDot.style.backgroundColor = COLORES_TEMA[nuevoTema] || "var(--accent-purple)";
        }
    }

    /* ==========================================================================
       GESTIÓN DEL HISTORIAL Y RENDERIZADO DEL CHAT
       ========================================================================== */
    function cargarHistorial() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_CHAT);
            if (raw) {
                chatHistorial = JSON.parse(raw);
            }
        } catch (e) {
            console.warn("No se pudo cargar el historial previo:", e);
            chatHistorial = [];
        }

        chatBox.innerHTML = "";

        if (chatHistorial.length > 0) {
            chatHistorial.forEach(item => agregarMensajeAlDOM(item.sender, item.text, false));
        } else {
            const mensajeBienvenida = "¡Hola! Soy Bip, tu compañero virtual interactivo. ¿De qué te gustaría hablar hoy?";
            guardarYAgregarMensaje("bip", mensajeBienvenida);
        }
    }

    function guardarHistorial() {
        try {
            if (chatHistorial.length > 60) {
                chatHistorial = chatHistorial.slice(chatHistorial.length - 60);
            }
            localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(chatHistorial));
        } catch (e) {
            console.warn("Error guardando historial:", e);
        }
    }

    function guardarYAgregarMensaje(sender, text) {
        chatHistorial.push({ sender, text, timestamp: Date.now() });
        guardarHistorial();
        agregarMensajeAlDOM(sender, text, true);
    }

    function escaparHTML(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatearTextoBip(texto) {
        const seguro = escaparHTML(texto);
        return seguro
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/\n/g, "<br>");
    }

    function agregarMensajeAlDOM(sender, text, conScroll = true) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `mensaje ${sender}`;

        if (sender === "bip") {
            const contenidoDiv = document.createElement("div");
            contenidoDiv.className = "mensaje-contenido";
            contenidoDiv.innerHTML = formatearTextoBip(text);

            const accionesDiv = document.createElement("div");
            accionesDiv.className = "mensaje-acciones";

            // Botón de Voz con SVG nítido
            const btnVoz = document.createElement("button");
            btnVoz.className = "btn-msg-accion btn-voz";
            btnVoz.setAttribute("data-texto", text);
            btnVoz.setAttribute("aria-label", "Escuchar mensaje de voz");
            btnVoz.title = "Escuchar mensaje";
            btnVoz.innerHTML = ICON_VOZ_SVG;

            // Botón de Copiar con SVG nítido
            const btnCopiar = document.createElement("button");
            btnCopiar.className = "btn-msg-accion btn-copiar";
            btnCopiar.setAttribute("data-texto", text);
            btnCopiar.setAttribute("aria-label", "Copiar respuesta al portapapeles");
            btnCopiar.title = "Copiar respuesta";
            btnCopiar.innerHTML = ICON_COPIAR_SVG;

            accionesDiv.appendChild(btnVoz);
            accionesDiv.appendChild(btnCopiar);

            msgDiv.appendChild(contenidoDiv);
            msgDiv.appendChild(accionesDiv);
        } else {
            msgDiv.textContent = text;
        }

        chatBox.appendChild(msgDiv);
        if (conScroll) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    // Delegación de eventos para Voz y Copiar
    chatBox.addEventListener("click", (e) => {
        const btnVoz = e.target.closest(".btn-voz");
        if (btnVoz) {
            const texto = btnVoz.getAttribute("data-texto");
            if (texto) leerTexto(texto);
            return;
        }

        const btnCopiar = e.target.closest(".btn-copiar");
        if (btnCopiar) {
            const texto = btnCopiar.getAttribute("data-texto") || "";
            navigator.clipboard.writeText(texto).then(() => {
                btnCopiar.classList.add("copiado-exito");
                btnCopiar.innerHTML = ICON_CHECK_SVG;
                btnCopiar.title = "¡Copiado!";
                setTimeout(() => {
                    btnCopiar.classList.remove("copiado-exito");
                    btnCopiar.innerHTML = ICON_COPIAR_SVG;
                    btnCopiar.title = "Copiar respuesta";
                }, 1500);
            }).catch(err => {
                console.warn("No se pudo copiar el texto:", err);
            });
        }
    });

    function limpiarChat() {
        if (confirm("¿Deseas vaciar la conversación con Bip?")) {
            chatHistorial = [];
            localStorage.removeItem(STORAGE_KEY_CHAT);
            chatBox.innerHTML = "";
            const saludo = "¡Memoria reiniciada! Mis circuitos están frescos. ¿De qué hablaremos?";
            guardarYAgregarMensaje("bip", saludo);
            cambiarExpresion("feliz");
            reproducirSFX("recibir");
        }
    }

    /* ==========================================================================
       MODO SUEÑO / CONTROL DE INACTIVIDAD (60 SEGUNDOS)
       ========================================================================== */
    function resetearInactividad() {
        if (estaDurmiendo) {
            despertarBip();
        }
        clearTimeout(temporizadorInactividad);
        temporizadorInactividad = setTimeout(dormirBip, TIEMPO_INACTIVIDAD_MS);
    }

    function dormirBip() {
        if (estaDurmiendo) return;
        estaDurmiendo = true;
        cabezaElement.classList.add("durmiendo");

        if (!document.getElementById("zzz-anim")) {
            const zzzDiv = document.createElement("div");
            zzzDiv.id = "zzz-anim";
            zzzDiv.className = "bocadillo-zzz";
            zzzDiv.innerText = "Zzz...";
            cabezaElement.appendChild(zzzDiv);
        }
    }

    function despertarBip() {
        if (!estaDurmiendo) return;
        estaDurmiendo = false;
        cabezaElement.classList.remove("durmiendo");

        const zzzDiv = document.getElementById("zzz-anim");
        if (zzzDiv) zzzDiv.remove();

        reproducirSFX("despertar");
        cambiarExpresion("sorprendido");
        setTimeout(() => cambiarExpresion(""), 1600);
    }

    /* ==========================================================================
       SEGUIMIENTO VISUAL 3D EFICIENTE (REQUEST ANIMATION FRAME)
       ========================================================================== */
    let ratonX = window.innerWidth / 2;
    let ratonY = window.innerHeight / 2;
    let rafPendiente = false;

    function actualizarPosicionRobot() {
        const centroX = window.innerWidth / 2;
        const centroY = window.innerHeight / 2;
        const offsetX = (ratonX - centroX) / 25;
        const offsetY = (ratonY - centroY) / 25;

        if (!estaDurmiendo) {
            cabezaElement.style.transform = `rotateY(${offsetX}deg) rotateX(${-offsetY}deg)`;

            const moveX = Math.max(-5, Math.min(5, (ratonX - centroX) / 40));
            const moveY = Math.max(-5, Math.min(5, (ratonY - centroY) / 40));

            pupilas.forEach(pupila => {
                pupila.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
            });
        }

        rafPendiente = false;
    }

    function manejarMovimiento(clientX, clientY) {
        resetearInactividad();
        ratonX = clientX;
        ratonY = clientY;
        if (!rafPendiente) {
            rafPendiente = true;
            requestAnimationFrame(actualizarPosicionRobot);
        }
    }

    document.addEventListener("mousemove", (e) => {
        manejarMovimiento(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
        if (e.touches && e.touches.length > 0) {
            manejarMovimiento(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    /* ==========================================================================
       EXPRESIONES Y REACTOR HOLOGRÁFICO
       ========================================================================== */
    function cambiarExpresion(tipo) {
        if (estaDurmiendo && tipo !== "sorprendido") return;
        cabezaElement.classList.remove("feliz", "triste", "sorprendido", "guino");
        if (tipo) cabezaElement.classList.add(tipo);
    }

    function programarSiguienteParpadeo() {
        const intervalo = 2800 + Math.random() * 3500;
        setTimeout(() => {
            if (!cabezaElement.classList.contains("feliz") && !estaDurmiendo) {
                cabezaElement.classList.add("parpadeo");
                setTimeout(() => {
                    cabezaElement.classList.remove("parpadeo");
                    programarSiguienteParpadeo();
                }, 140);
            } else {
                programarSiguienteParpadeo();
            }
        }, intervalo);
    }

    function palpitarCorazon(event) {
        if (event) event.stopPropagation();
        resetearInactividad();
        if (estaDurmiendo) despertarBip();
        reproducirSFX("corazon");
        if (corazon && !corazon.classList.contains("sobrecarga")) {
            corazon.classList.add("sobrecarga");
            cambiarExpresion("feliz");
            robotElement.classList.add("animar-saludo");
            setTimeout(() => {
                corazon.classList.remove("sobrecarga");
                cambiarExpresion("");
                robotElement.classList.remove("animar-saludo");
            }, 2500);
        }
    }

    function iniciarBip(event) {
        if (event) event.stopPropagation();
        resetearInactividad();
        reproducirSFX("despertar");
        bipDespierto = true;
        robotElement.classList.add("animar-saludo");
        cambiarExpresion("feliz");
        const saludo = nombreUsuario ? `¡Qué gusto verte de nuevo, ${nombreUsuario}!` : "¡Hola! Mis sensores están activos.";
        leerTexto(saludo);
        setTimeout(() => {
            robotElement.classList.remove("animar-saludo");
            cambiarExpresion("");
        }, 1800);
    }

    /* ==========================================================================
       SÍNTESIS DE VOZ Y RECONOCIMIENTO
       ========================================================================== */
    function limpiarTextoParaVoz(texto) {
        return texto
            .replace(/[*#_~`>\-]/g, " ")
            .replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}]/gu, "");
    }

    function leerTexto(texto) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        const textoLimpio = limpiarTextoParaVoz(texto);
        const utterance = new SpeechSynthesisUtterance(textoLimpio);
        utterance.lang = "es-ES";
        utterance.pitch = 1.25;
        utterance.rate = 1.05;

        const voces = window.speechSynthesis.getVoices();
        const vozEspanol = voces.find(v => v.lang.startsWith("es"));
        if (vozEspanol) utterance.voice = vozEspanol;

        utterance.onstart = () => {
            cabezaElement.classList.add("boca-hablando");
            if (!robotElement.classList.contains("animar-baile")) {
                robotElement.classList.add("animar-hablar");
            }
        };

        const terminarHabla = () => {
            cabezaElement.classList.remove("boca-hablando");
            robotElement.classList.remove("animar-hablar");
        };

        utterance.onend = terminarHabla;
        utterance.onerror = terminarHabla;

        window.speechSynthesis.speak(utterance);
    }

    function alternarMicfono() {
        resetearInactividad();
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("El reconocimiento de voz no está disponible o requiere permisos de micrófono en el navegador.");
            return;
        }

        if (isListening && recognitionInstance) {
            recognitionInstance.stop();
            return;
        }

        if (!recognitionInstance) {
            recognitionInstance = new SpeechRecognition();
            recognitionInstance.lang = "es-ES";
            recognitionInstance.interimResults = false;

            recognitionInstance.onstart = () => {
                isListening = true;
                micBtn.classList.add("escuchando");
                micBtn.title = "Escuchando... Haz clic para detener";
                cabezaElement.classList.add("asintiendo");
            };

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                userInput.value = transcript;
                enviarMensaje();
            };

            const resetMic = () => {
                isListening = false;
                micBtn.classList.remove("escuchando");
                micBtn.title = "Hablar por micrófono";
                if (document.activeElement !== userInput) {
                    cabezaElement.classList.remove("asintiendo");
                }
            };

            recognitionInstance.onerror = resetMic;
            recognitionInstance.onend = resetMic;
        }

        try {
            recognitionInstance.start();
        } catch (e) {
            console.warn("Error al iniciar reconocimiento:", e);
        }
    }

    /* ==========================================================================
       INDICADOR DE ESCRITURA
       ========================================================================== */
    function mostrarEscribiendo() {
        const id = "escribe-" + Date.now();
        const div = document.createElement("div");
        div.className = "mensaje bip";
        div.id = id;
        div.innerHTML = `<div class="escribiendo-dots"><span></span><span></span><span></span></div>`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        antenaPunta.classList.add("pensando");
        return id;
    }

    function removerEscribiendo(id) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.remove();
        antenaPunta.classList.remove("pensando");
    }

    /* ==========================================================================
       ENVIAR MENSAJE Y COMUNICACIÓN CON LA API (CON MEMORIA DE 3 MENSAJES)
       ========================================================================== */
    async function enviarMensaje() {
        resetearInactividad();
        const textoUsuario = userInput.value.trim();
        if (textoUsuario === "") return;

        reproducirSFX("enviar");

        const msgLower = textoUsuario.toLowerCase();
        if (!nombreUsuario && (msgLower.includes("me llamo ") || msgLower.includes("soy "))) {
            const palabras = textoUsuario.trim().split(" ");
            nombreUsuario = palabras[palabras.length - 1].replace(/[.,!¡?¿]/g, "");
            localStorage.setItem(STORAGE_KEY_USER, nombreUsuario);
        }

        const contexto3Mensajes = chatHistorial.slice(-3).map(m => ({
            sender: m.sender,
            text: m.text
        }));

        guardarYAgregarMensaje("yo", textoUsuario);
        userInput.value = "";

        // Juego Piedra, Papel o Tijera
        if (msgLower.includes("piedra") || msgLower.includes("papel") || msgLower.includes("tijera")) {
            const opciones = ["piedra", "papel", "tijera"];
            const eleccionBip = opciones[Math.floor(Math.random() * opciones.length)];
            const respuestaJuego = `¡Elegí **${eleccionBip}**! ¿Quieres volver a jugar?`;
            
            reproducirSFX("recibir");
            guardarYAgregarMensaje("bip", respuestaJuego);
            cambiarExpresion("guino");
            leerTexto(`Elegí ${eleccionBip}`);
            return;
        }

        if (msgLower.includes("feliz") || msgLower.includes("bien") || msgLower.includes("alegre")) {
            cambiarExpresion("feliz");
        } else if (msgLower.includes("triste") || msgLower.includes("mal") || msgLower.includes("llorar")) {
            cambiarExpresion("triste");
        } else if (msgLower.includes("sorpresa") || msgLower.includes("increible") || msgLower.includes("guau")) {
            cambiarExpresion("sorprendido");
        } else {
            cambiarExpresion("");
        }

        const idEscritura = mostrarEscribiendo();
        const quiereBailar = msgLower.includes("baila") || msgLower.includes("danza");

        try {
            const promptFinal = nombreUsuario ? `El usuario se llama ${nombreUsuario}. Dice: ${textoUsuario}` : textoUsuario;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mensaje: promptFinal,
                    contexto: contexto3Mensajes
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            removerEscribiendo(idEscritura);
            reproducirSFX("recibir");

            const respuestaFinal = data.respuesta || "¡Mis circuitos procesaron tu mensaje con éxito!";
            guardarYAgregarMensaje("bip", respuestaFinal);

            if (data.fuente === "gemini") {
                actualizarBadgeEstado(true);
            } else if (data.fuente === "local") {
                actualizarBadgeEstado(false);
            }

            if (quiereBailar) {
                cambiarExpresion("feliz");
                robotElement.classList.remove("robot-flotando");
                robotElement.classList.add("animar-baile");
                leerTexto(respuestaFinal);
                setTimeout(() => {
                    robotElement.classList.remove("animar-baile");
                    robotElement.classList.add("robot-flotando");
                }, 5000);
            } else {
                robotElement.classList.add("animar-saludo");
                setTimeout(() => robotElement.classList.remove("animar-saludo"), 600);
            }

        } catch (error) {
            console.warn("Fallo en la comunicación con el servidor:", error);
            removerEscribiendo(idEscritura);
            reproducirSFX("recibir");

            const msgFallo = "¡Bip bip! No pude alcanzar mi núcleo de IA en la nube, pero sigo funcionando en modo local. ¡Dime qué necesitas!";
            guardarYAgregarMensaje("bip", msgFallo);
            actualizarBadgeEstado(false);
        }
    }

    function actualizarBadgeEstado(conectadoIA) {
        if (statusDot && statusText) {
            if (conectadoIA) {
                statusDot.classList.remove("local-mode");
                statusText.innerText = "IA Gemini Activa";
            } else {
                statusDot.classList.add("local-mode");
                statusText.innerText = "Modo Local Autónomo";
            }
        }
    }

    async function verificarSaludBackend() {
        try {
            const res = await fetch("/api/health");
            if (res.ok) {
                const data = await res.json();
                actualizarBadgeEstado(Boolean(data.iaConfigurada));
            }
        } catch (e) {
            actualizarBadgeEstado(false);
        }
    }

    function enviarSugerencia(texto) {
        resetearInactividad();
        userInput.value = texto;
        enviarMensaje();
    }

    function handleKeyPress(e) {
        if (e.key === "Enter") enviarMensaje();
    }

    /* ==========================================================================
       ATAJOS DE TECLADO RÁPIDOS
       ========================================================================== */
    document.addEventListener("keydown", (e) => {
        resetearInactividad();

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            userInput.focus();
        } else if (e.key === "/" && document.activeElement !== userInput) {
            e.preventDefault();
            userInput.focus();
        }

        if (e.key === "Escape") {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            cabezaElement.classList.remove("boca-hablando");
            robotElement.classList.remove("animar-hablar");
            if (paletteDialWrapper && paletteDialWrapper.classList.contains("abierto")) {
                paletteDialWrapper.classList.remove("abierto");
                if (paletteFab) paletteFab.setAttribute("aria-expanded", "false");
            }
        }
    });

    /* ==========================================================================
       INICIALIZACIÓN AL CARGAR LA PÁGINA
       ========================================================================== */
    window.addEventListener("DOMContentLoaded", () => {
        aplicarTema(temaActual);
        cargarHistorial();
        actualizarBotonSFX();
        programarSiguienteParpadeo();
        verificarSaludBackend();
        resetearInactividad();

        // Enlazar eventos de botones principales
        document.getElementById("btn-enviar").addEventListener("click", enviarMensaje);
        micBtn.addEventListener("click", alternarMicfono);
        sfxBtn.addEventListener("click", toggleSFX);
        document.getElementById("btn-limpiar").addEventListener("click", limpiarChat);
        if (corazon) corazon.addEventListener("click", palpitarCorazon);
        robotElement.addEventListener("click", iniciarBip);
        userInput.addEventListener("keypress", handleKeyPress);

        // Menú circular desplegable de temas de color (Palette Dial)
        if (paletteFab && paletteDialWrapper) {
            paletteFab.addEventListener("click", (e) => {
                e.stopPropagation();
                const estaAbierto = paletteDialWrapper.classList.toggle("abierto");
                paletteFab.setAttribute("aria-expanded", String(estaAbierto));
            });
        }

        // Cerrar menú al hacer clic fuera del control
        document.addEventListener("click", (e) => {
            if (paletteDialWrapper && paletteDialWrapper.classList.contains("abierto")) {
                if (!paletteDialWrapper.contains(e.target)) {
                    paletteDialWrapper.classList.remove("abierto");
                    if (paletteFab) paletteFab.setAttribute("aria-expanded", "false");
                }
            }
        });

        // Selector de Temas dentro del menú popup
        document.querySelectorAll(".palette-item").forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                resetearInactividad();
                const nuevoTema = item.getAttribute("data-theme");
                if (nuevoTema) {
                    aplicarTema(nuevoTema);
                    reproducirSFX("enviar");
                }
                if (paletteDialWrapper) {
                    paletteDialWrapper.classList.remove("abierto");
                    if (paletteFab) paletteFab.setAttribute("aria-expanded", "false");
                }
            });
        });

        // Asentimiento visual de atención al interactuar con el campo de texto
        userInput.addEventListener("focus", () => {
            resetearInactividad();
            cabezaElement.classList.add("asintiendo");
        });
        userInput.addEventListener("blur", () => {
            if (!isListening) {
                cabezaElement.classList.remove("asintiendo");
            }
        });

        // Chips de sugerencia
        document.querySelectorAll(".chip-btn").forEach(chip => {
            chip.addEventListener("click", () => {
                const prompt = chip.getAttribute("data-prompt") || chip.innerText.trim();
                enviarSugerencia(prompt);
            });
        });
    });

})();
