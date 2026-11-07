/* MadeBot — interactive WhatsApp quote-bot demo (Cotiza por WhatsApp).
   Flows: extension quote, appointment, brow consult + human fallback.
   No data leaves the page except the optional "Enviar por WhatsApp"
   button, which opens wa.me with the visitor's own summary prefilled.
   Length is FREE TEXT by design — no invented stock lengths. */
(function () {
  const WA_NUMBER = "573242954655";

  const body = document.getElementById("chat-body");
  const chipsBox = document.getElementById("quick-replies");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const actionsBox = document.getElementById("chat-actions");
  const inboxList = document.getElementById("inbox-list");
  if (!body || !form) return; // chat mock lives only on the Cotiza page

  const state = { flow: null, step: 0, answers: {} };
  let awaitingText = null; // key of the free-text answer being collected
  let busy = false;

  const now = () =>
    new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  function scrollDown() {
    body.scrollTop = body.scrollHeight;
  }

  function bubble(text, who) {
    const div = document.createElement("div");
    div.className = "msg msg-" + who;
    const safe = document.createElement("span");
    safe.textContent = text;
    div.appendChild(safe);
    const t = document.createElement("span");
    t.className = "msg-time";
    t.textContent = now();
    div.appendChild(t);
    body.appendChild(div);
    scrollDown();
    return div;
  }

  function botSay(text, delay) {
    return new Promise((resolve) => {
      busy = true;
      const typing = document.createElement("div");
      typing.className = "msg msg-bot typing";
      typing.setAttribute("aria-label", "MadeBot está escribiendo");
      typing.innerHTML = "<i></i><i></i><i></i>";
      body.appendChild(typing);
      scrollDown();
      setTimeout(() => {
        typing.remove();
        bubble(text, "bot");
        busy = false;
        resolve();
      }, delay || 900);
    });
  }

  function userSay(text) {
    bubble(text, "user");
  }

  function setChips(options) {
    chipsBox.innerHTML = "";
    options.forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = opt.label;
      b.addEventListener("click", () => {
        if (busy) return;
        userSay(opt.label);
        chipsBox.innerHTML = "";
        opt.onPick();
      });
      chipsBox.appendChild(b);
    });
  }

  function askText(placeholder) {
    awaitingText = true;
    input.disabled = false;
    input.placeholder = placeholder;
    input.focus();
    sendBtn.disabled = false;
  }

  function waitChips() {
    awaitingText = false;
    input.disabled = true;
    input.placeholder = "Elige una opción arriba";
    sendBtn.disabled = true;
  }

  function clearActions() {
    if (actionsBox) actionsBox.innerHTML = "";
  }

  function actionButton(label, className, href, onClick) {
    const a = document.createElement("a");
    a.className = "btn " + className;
    a.textContent = label;
    if (href) {
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.href = "#";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        onClick();
      });
    }
    actionsBox.appendChild(a);
  }

  function addInboxEntry(title, meta) {
    if (!inboxList) return;
    const li = document.createElement("li");
    li.className = "inbox-item is-new";
    li.innerHTML =
      '<span class="inbox-ic" aria-hidden="true">✦</span>' +
      "<div><strong></strong><span class=\"inbox-meta\"></span></div>" +
      '<span class="inbox-status new">Nueva</span>';
    li.querySelector("strong").textContent = title;
    li.querySelector(".inbox-meta").textContent = meta;
    inboxList.prepend(li);
  }

  /* ---------------- Menu ---------------- */
  async function showMenu() {
    state.flow = "menu";
    clearActions();
    await botSay(
      "¡Hola, bella! Soy MadeBot, la asistente de Extensiones Cartagena Peluquería. ¿Qué te gustaría hacer hoy?",
      800
    );
    waitChips();
    setChips([
      { label: "Cotizar extensiones", onPick: startQuote },
      { label: "Agendar cita", onPick: startAppointment },
      { label: "Micropigmentación", onPick: startBrows },
      { label: "Hablar con Madeleine", onPick: startHuman },
    ]);
  }

  /* ---------------- Quote flow ---------------- */
  async function startQuote() {
    state.flow = "quote";
    state.answers = {};
    clearActions();
    await botSay("¡Perfecto! Te cotizo tus extensiones en un minuto.", 700);
    await botSay(
      "Paso 1 de 4 — Escríbenos el largo que buscas: por ejemplo, hasta los hombros, hasta la cintura o el largo que imaginas.",
      900
    );
    askText("Escríbenos el largo que buscas…");
    state.step = "length";
  }

  async function quoteColour() {
    await botSay("Paso 2 de 4 — ¿Qué color te gusta?", 800);
    waitChips();
    setChips(
      ["Rubio", "Castaño", "Negro", "Rojo", "Mechas o balayage"].map((c) => ({
        label: c,
        onPick: () => {
          state.answers.colour = c;
          quoteTechnique();
        },
      }))
    );
    state.step = "colour";
  }

  async function quoteTechnique() {
    await botSay("Paso 3 de 4 — ¿Qué técnica prefieres?", 800);
    waitChips();
    setChips([
      {
        label: "Punto en hilo brasilero",
        onPick: () => {
          state.answers.technique = "Punto en hilo brasilero";
          quoteCity();
        },
      },
      {
        label: "Quiero que me asesoren",
        onPick: () => {
          state.answers.technique = "Asesoría de técnica";
          quoteCity();
        },
      },
    ]);
    state.step = "technique";
  }

  async function quoteCity() {
    await botSay(
      "Paso 4 de 4 — Hacemos envíos nacionales. ¿A qué ciudad enviamos tu pedido?",
      800
    );
    askText("¿A qué ciudad enviamos? (envíos nacionales)…");
    state.step = "city";
  }

  async function quoteName() {
    await botSay("Por último, ¿cómo te llamas?", 700);
    askText("Tu nombre…");
    state.step = "name";
  }

  function quoteSummary() {
    const a = state.answers;
    const div = document.createElement("div");
    div.className = "msg msg-bot";
    div.innerHTML =
      '<span class="summary-title">Tu cotización — resumen</span>' +
      '<span class="summary-row"><span>Largo</span><span></span></span>' +
      '<span class="summary-row"><span>Color</span><span></span></span>' +
      '<span class="summary-row"><span>Técnica</span><span></span></span>' +
      '<span class="summary-row"><span>Ciudad de envío</span><span></span></span>' +
      '<span class="summary-row"><span>Nombre</span><span></span></span>';
    const vals = [a.length, a.colour, a.technique, a.city, a.name];
    div.querySelectorAll(".summary-row span:last-child").forEach((s, i) => {
      s.textContent = vals[i] || "—";
    });
    const t = document.createElement("span");
    t.className = "msg-time";
    t.textContent = now();
    div.appendChild(t);
    body.appendChild(div);
    scrollDown();

    const text =
      "Hola, soy " +
      a.name +
      ". Quiero cotizar extensiones: largo: " +
      a.length +
      "; color: " +
      a.colour +
      "; técnica: " +
      a.technique +
      ". Ciudad de envío: " +
      a.city +
      ".";
    clearActions();
    actionButton(
      "Enviar cotización por WhatsApp",
      "btn-wa",
      "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text)
    );
    actionButton("Hablar con Madeleine", "btn-outline", null, startHuman);
    actionButton("Empezar de nuevo", "btn-plum", null, restart);
    addInboxEntry(
      "Cliente · Cotización de extensiones",
      "Largo y color a elegir · " + a.city + " · Recién llegada"
    );
    waitChips();
    input.placeholder = "Cotización lista — envíala por WhatsApp";
  }

  /* ---------------- Appointment flow ---------------- */
  async function startAppointment() {
    state.flow = "appointment";
    state.answers = {};
    clearActions();
    await botSay("¡Con gusto! Agendemos tu cita en el salón.", 700);
    await botSay("¿Qué servicio quieres agendar?", 800);
    waitChips();
    setChips(
      ["Extensiones", "Peluquería", "Salón de uñas", "Micropigmentación de cejas"].map(
        (s) => ({
          label: s,
          onPick: () => {
            state.answers.service = s;
            appointmentDay();
          },
        })
      )
    );
    state.step = "service";
  }

  async function appointmentDay() {
    await botSay("¿Qué día te queda mejor? Escríbelo como quieras.", 800);
    askText("Por ejemplo: este sábado, el lunes…");
    state.step = "day";
  }

  async function appointmentTime() {
    await botSay("¿En qué horario prefieres?", 700);
    waitChips();
    setChips(
      ["En la mañana", "En la tarde"].map((t) => ({
        label: t,
        onPick: () => {
          state.answers.time = t;
          appointmentName();
        },
      }))
    );
    state.step = "time";
  }

  async function appointmentName() {
    await botSay("¿A nombre de quién agendamos la cita?", 700);
    askText("Tu nombre…");
    state.step = "name";
  }

  function appointmentSummary() {
    const a = state.answers;
    const div = document.createElement("div");
    div.className = "msg msg-bot";
    div.innerHTML =
      '<span class="summary-title">Tu cita — resumen</span>' +
      '<span class="summary-row"><span>Servicio</span><span></span></span>' +
      '<span class="summary-row"><span>Día</span><span></span></span>' +
      '<span class="summary-row"><span>Horario</span><span></span></span>' +
      '<span class="summary-row"><span>Nombre</span><span></span></span>';
    const vals = [a.service, a.day, a.time, a.name];
    div.querySelectorAll(".summary-row span:last-child").forEach((s, i) => {
      s.textContent = vals[i] || "—";
    });
    const t = document.createElement("span");
    t.className = "msg-time";
    t.textContent = now();
    div.appendChild(t);
    body.appendChild(div);
    scrollDown();

    const text =
      "Hola, soy " +
      a.name +
      ". Quiero agendar una cita de " +
      a.service +
      ", día: " +
      a.day +
      ", horario: " +
      a.time +
      ".";
    clearActions();
    actionButton(
      "Confirmar cita por WhatsApp",
      "btn-wa",
      "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text)
    );
    actionButton("Hablar con Madeleine", "btn-outline", null, startHuman);
    actionButton("Empezar de nuevo", "btn-plum", null, restart);
    addInboxEntry(
      "Cliente · Agendar cita",
      a.service + " · " + a.day + " · Recién llegada"
    );
    waitChips();
    input.placeholder = "Cita lista — confírmala por WhatsApp";
  }

  /* ---------------- Brow consult flow ---------------- */
  async function startBrows() {
    state.flow = "brows";
    state.answers = {};
    clearActions();
    await botSay(
      "La micropigmentación de cejas es un diseño personalizado y semipermanente. Te ayudo con tu consulta.",
      800
    );
    await botSay("¿Ya tienes un diseño en mente o quieres asesoría?", 800);
    waitChips();
    setChips([
      {
        label: "Quiero asesoría",
        onPick: () => {
          state.answers.design = "Quiere asesoría de diseño";
          browsName();
        },
      },
      {
        label: "Ya tengo una idea",
        onPick: () => {
          state.answers.design = "Ya tiene una idea de diseño";
          browsName();
        },
      },
    ]);
    state.step = "design";
  }

  async function browsName() {
    await botSay("¿Cómo te llamas?", 700);
    askText("Tu nombre…");
    state.step = "name";
  }

  function browsSummary() {
    const a = state.answers;
    const div = document.createElement("div");
    div.className = "msg msg-bot";
    div.innerHTML =
      '<span class="summary-title">Tu consulta — resumen</span>' +
      '<span class="summary-row"><span>Servicio</span><span></span></span>' +
      '<span class="summary-row"><span>Diseño</span><span></span></span>' +
      '<span class="summary-row"><span>Nombre</span><span></span></span>';
    const vals = ["Micropigmentación de cejas", a.design, a.name];
    div.querySelectorAll(".summary-row span:last-child").forEach((s, i) => {
      s.textContent = vals[i] || "—";
    });
    const t = document.createElement("span");
    t.className = "msg-time";
    t.textContent = now();
    div.appendChild(t);
    body.appendChild(div);
    scrollDown();

    const text =
      "Hola, soy " +
      a.name +
      ". Quiero una consulta de micropigmentación de cejas. " +
      a.design +
      ".";
    clearActions();
    actionButton(
      "Enviar consulta por WhatsApp",
      "btn-wa",
      "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text)
    );
    actionButton("Hablar con Madeleine", "btn-outline", null, startHuman);
    actionButton("Empezar de nuevo", "btn-plum", null, restart);
    addInboxEntry(
      "Cliente · Micropigmentación",
      "Consulta de diseño · Recién llegada"
    );
    waitChips();
    input.placeholder = "Consulta lista — envíala por WhatsApp";
  }

  /* ---------------- Human fallback ---------------- */
  async function startHuman() {
    state.flow = "human";
    state.answers = {};
    clearActions();
    await botSay(
      "¡Claro! Madeleine te atiende personalmente por WhatsApp. Escríbele y te responde en horario de salón: lunes a viernes 09:00–19:00, sábado 08:00–20:00 y domingo 09:00–17:00.",
      900
    );
    clearActions();
    actionButton(
      "Abrir WhatsApp con Madeleine",
      "btn-wa",
      "https://wa.me/" +
        WA_NUMBER +
        "?text=" +
        encodeURIComponent("Hola Madeleine, quiero hablar contigo.")
    );
    actionButton("Volver al menú", "btn-plum", null, restart);
    waitChips();
    input.placeholder = "Madeleine te atiende por WhatsApp";
  }

  function restart() {
    body.innerHTML =
      '<div class="chat-day">Hoy · Demo interactiva</div>';
    state.flow = null;
    state.step = 0;
    state.answers = {};
    showMenu();
  }

  /* ---------------- Free-text submit ---------------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (busy || !awaitingText) return;
    const value = input.value.trim();
    if (!value) return;
    userSay(value);
    input.value = "";
    chipsBox.innerHTML = "";

    if (state.flow === "quote") {
      if (state.step === "length") {
        state.answers.length = value;
        quoteColour();
      } else if (state.step === "city") {
        state.answers.city = value;
        quoteName();
      } else if (state.step === "name") {
        state.answers.name = value;
        quoteSummary();
      }
    } else if (state.flow === "appointment") {
      if (state.step === "day") {
        state.answers.day = value;
        appointmentTime();
      } else if (state.step === "name") {
        state.answers.name = value;
        appointmentSummary();
      }
    } else if (state.flow === "brows") {
      if (state.step === "name") {
        state.answers.name = value;
        browsSummary();
      }
    }
  });

  /* ---------------- Boot: ?flow= deep link from other pages ---------------- */
  const params = new URLSearchParams(window.location.search);
  const startFlow = params.get("flow");
  if (startFlow === "quote") {
    botSay(
      "¡Hola, bella! Soy MadeBot, la asistente de Extensiones Cartagena Peluquería.",
      700
    ).then(startQuote);
  } else if (startFlow === "appointment") {
    botSay(
      "¡Hola, bella! Soy MadeBot, la asistente de Extensiones Cartagena Peluquería.",
      700
    ).then(startAppointment);
  } else if (startFlow === "brows") {
    botSay(
      "¡Hola, bella! Soy MadeBot, la asistente de Extensiones Cartagena Peluquería.",
      700
    ).then(startBrows);
  } else if (startFlow === "human") {
    botSay(
      "¡Hola, bella! Soy MadeBot, la asistente de Extensiones Cartagena Peluquería.",
      700
    ).then(startHuman);
  } else {
    showMenu();
  }
})();
