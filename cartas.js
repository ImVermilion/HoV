// ==== Datos de las cartas (criaturas, objetos activos, equipamientos, consumibles, ambiente) ====
const deckRaw = [
  // Criaturas
  {
    nombre: "Skuller",
    ataque: 1,
    defensa: 1,
    elemento: "oscuridad",
    tipo: "zombie",
    nivel: 1,
    descripcion: "Un zombi débil, pero fiel servidor.",
    categoria: "criatura"
  },
  {
    nombre: "Firia",
    ataque: 2,
    defensa: 1,
    elemento: "fuego",
    tipo: "bestia",
    nivel: 2,
    descripcion: "Bestia ígnea de colmillos ardientes.",
    categoria: "criatura"
  },
  {
    nombre: "Lumina",
    ataque: 1,
    defensa: 2,
    elemento: "luz",
    tipo: "heroe",
    nivel: 1,
    descripcion: "Guardián radiante de los inocentes.",
    categoria: "criatura"
  },
  // Equipamiento
  {
    nombre: "Espada Sagrada",
    descripcion: "Equipamiento: +1 ATK. Solo una por criatura.",
    categoria: "equipamiento"
  },
  // Consumible
  {
    nombre: "Poción de Fuerza",
    descripcion: "Consumible: la criatura elegida gana +2 ATK este turno.",
    categoria: "consumible"
  },
  // Activo (objeto permanente)
  {
    nombre: "Tótem Arcano",
    descripcion: "Activo: Tus criaturas ganan +1 DEF mientras esté en juego.",
    categoria: "activo"
  },
  {
    nombre: "Estatua Maldita",
    descripcion: "Activo: Todos los ataques se reducen en 1.",
    categoria: "activo"
  },
  // Ambiente
  {
    nombre: "Niebla Encantada",
    descripcion: "Ambiente: Las criaturas pierden 1 ATK.",
    categoria: "ambiente"
  }
];

let deck = [];
let hand = [];
let creatures = [null, null, null];
let equipSlots = [null, null, null];
let objects = { left: null, right: null };
let environment = null;
let defender = null;
let placingCard = null;
const MAX_HAND = 6;

// ==== Turnos y reglas de turno ====
let turno = 1;
let criaturaColocadaEsteTurno = false;
let bloqueoCambioDefensor = false;

// ==== Inicialización ====
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function resetDeck() {
  deck = deckRaw.slice();
  shuffle(deck);
}
resetDeck();

function renderHand() {
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = "";
  hand.forEach((card, idx) => {
    const c = createCardDiv(card);
    c.onclick = () => startPlacingCard(idx);
    handDiv.appendChild(c);
  });
}
function renderCreatures() {
  for (let i = 0; i < 3; i++) {
    const slot = document.querySelector(`.creature-slot[data-slot="${i}"]`);
    slot.innerHTML = "";
    slot.className = "creature-slot";
    // SOLO se puede colocar una criatura por turno
    if (placingCard && placingCard.card.categoria === "criatura" && creatures[i] === null && !criaturaColocadaEsteTurno) {
      slot.classList.add("valid");
      slot.onclick = () => placeCardOnCreature(i);
    } else {
      slot.onclick = null;
    }
    if (creatures[i]) {
      const c = createCardDiv(creatures[i]);
      slot.appendChild(c);
      slot.style.cursor = "pointer";
      c.onclick = () => assignDefender(i);
    }
  }
  // Equipamientos debajo de cada criatura
  for (let i = 0; i < 3; i++) {
    const slot = document.querySelector(`.equip-slot[data-equip="${i}"]`);
    slot.innerHTML = "";
    slot.className = "equip-slot";
    if (placingCard && placingCard.card.categoria === "equipamiento" && creatures[i]) {
      slot.classList.add("valid");
      slot.onclick = () => tryEquipCreature(i);
    } else {
      slot.onclick = null;
    }
    if (equipSlots[i]) {
      const c = createCardDiv(equipSlots[i]);
      c.onclick = (e) => {
        e.stopPropagation();
        showMessage(equipSlots[i].descripcion);
      };
      slot.appendChild(c);
    }
  }
}
function renderObjects() {
  ["left", "right"].forEach(side => {
    const slot = document.querySelector(`.object-slot[data-side="${side}"]`);
    slot.innerHTML = "";
    slot.className = "object-slot";
    if (placingCard && placingCard.card.categoria === "activo" && !objects[side]) {
      slot.classList.add("valid");
      slot.onclick = () => placeCardOnObject(side);
    } else {
      slot.onclick = null;
    }
    if (objects[side]) {
      const c = createCardDiv(objects[side]);
      c.onclick = () => showMessage(objects[side].descripcion);
      slot.appendChild(c);
    }
  });
}
function renderEnvironment() {
  const slot = document.querySelector(".environment-slot");
  slot.innerHTML = "";
  slot.className = "environment-slot";
  if (placingCard && placingCard.card.categoria === "ambiente" && !environment) {
    slot.classList.add("valid");
    slot.onclick = () => placeCardOnEnvironment();
  } else {
    slot.onclick = null;
  }
  if (environment) {
    const c = createCardDiv(environment);
    c.onclick = () => showMessage(environment.descripcion);
    slot.appendChild(c);
  }
}
function renderDefender() {
  const slot = document.getElementById("defender-slot");
  slot.innerHTML = "";
  slot.className = "";
  if (defender !== null && creatures[defender]) {
    const c = createCardDiv(creatures[defender]);
    slot.appendChild(c);
    slot.className = "selected";
  }
}
function createCardDiv(card) {
  const el = document.createElement("div");
  el.className = `card ${card.elemento || ""} ${card.tipo || ""} ${card.categoria}`;
  let icons = "";
  if (card.categoria === "equipamiento") icons = `<span class="equip-icon">🗡️</span>`;
  if (card.categoria === "activo") icons = `<span class="active-icon">💠</span>`;
  if (card.categoria === "consumible") icons = `<span class="consumible-icon">🧪</span>`;
  el.innerHTML = `
    <div class="name">${card.nombre}</div>
    ${card.ataque !== undefined ? `<div class="stats">ATK: ${card.ataque} / DEF: ${card.defensa}</div>` : ""}
    <div class="desc">${card.descripcion}</div>
    ${card.nivel ? `<div class="stats">Nivel: ${card.nivel}</div>` : ""}
    ${icons}
  `;
  return el;
}

// ==== Lógica de robar y jugar ====
document.getElementById("draw-btn").onclick = () => {
  if (turno === 1 && hand.length >= 3) {
    showMessage("En el primer turno solo puedes tener 3 cartas.");
    shakeHand();
    return;
  }
  if (turno > 1 && hand.length >= MAX_HAND) {
    showMessage("Ya tienes el máximo de 6 cartas en la mano.");
    shakeHand();
    return;
  }
  if (deck.length === 0) {
    resetDeck();
    showMessage("El mazo se ha rebarajado.");
  }
  const i = Math.floor(Math.random() * deck.length);
  const card = deck.splice(i, 1)[0];
  hand.push(card);
  renderHand();
};

function startPlacingCard(handIdx) {
  // Si hay una carta ya seleccionada para colocar, ignorar
  if (placingCard) {
    showMessage("Ya estás colocando una carta. Completa o cancela primero.");
    return;
  }
  // Sólo una criatura por turno
  if (hand[handIdx].categoria === "criatura" && criaturaColocadaEsteTurno) {
    showMessage("Solo puedes colocar una criatura por turno.");
    return;
  }
  placingCard = { card: hand[handIdx], index: handIdx };
  renderHand();
  renderCreatures();
  renderObjects();
  renderEnvironment();

  if (placingCard.card.categoria === "consumible") {
    if (objects.left === null) {
      showMessage("Haz clic en 'Objeto Izq.' para consumir la carta.");
      document.querySelector('.object-slot[data-side="left"]').classList.add("valid");
      document.querySelector('.object-slot[data-side="left"]').onclick = () => useConsumible("left");
    } else if (objects.right === null) {
      showMessage("Haz clic en 'Objeto Dcha.' para consumir la carta.");
      document.querySelector('.object-slot[data-side="right"]').classList.add("valid");
      document.querySelector('.object-slot[data-side="right"]').onclick = () => useConsumible("right");
    } else {
      showMessage("No tienes hueco libre de objeto para usar consumible.");
      placingCard = null;
      renderHand(); renderCreatures(); renderObjects(); renderEnvironment();
    }
  }
}

// Colocar criatura
function placeCardOnCreature(idx) {
  if (!placingCard || placingCard.card.categoria !== "criatura") return;
  creatures[idx] = placingCard.card;
  hand.splice(placingCard.index, 1);
  placingCard = null;
  criaturaColocadaEsteTurno = true;
  showMessage("¡Criatura colocada!");
  updateAll();
}

// Colocar activo permanente
function placeCardOnObject(side) {
  if (!placingCard || placingCard.card.categoria !== "activo") return;
  objects[side] = placingCard.card;
  hand.splice(placingCard.index, 1);
  placingCard = null;
  showMessage("¡Objeto activo colocado!");
  updateAll();
}

// Intentar equipar (con posible reemplazo)
function tryEquipCreature(idx) {
  if (!placingCard || placingCard.card.categoria !== "equipamiento") return;
  if (equipSlots[idx]) {
    showReplaceModal(() => {
      equipSlots[idx] = placingCard.card;
      hand.splice(placingCard.index, 1);
      placingCard = null;
      showMessage("¡Equipamiento reemplazado!");
      updateAll();
    });
  } else {
    equipSlots[idx] = placingCard.card;
    hand.splice(placingCard.index, 1);
    placingCard = null;
    showMessage("¡Equipamiento equipado!");
    updateAll();
  }
}

// Consumibles: solo si hay hueco de objeto activo libre
function useConsumible(side) {
  if (!placingCard || placingCard.card.categoria !== "consumible") return;
  objects[side] = { nombre: "(Consumible usado)", descripcion: "Esta casilla fue ocupada temporalmente por un consumible.", categoria: "consumible" };
  setTimeout(() => {
    objects[side] = null;
    updateAll();
  }, 800);
  hand.splice(placingCard.index, 1);
  placingCard = null;
  showMessage("¡Consumible usado!");
  updateAll();
}

// Colocar ambiente
function placeCardOnEnvironment() {
  if (!placingCard || placingCard.card.categoria !== "ambiente") return;
  environment = placingCard.card;
  hand.splice(placingCard.index, 1);
  placingCard = null;
  showMessage("¡Ambiente activado!");
  updateAll();
}

// Seleccionar defensor con confirmación
function assignDefender(idx) {
  if (bloqueoCambioDefensor) {
    showMessage("No puedes cambiar de defensor hasta el siguiente turno.");
    return;
  }
  showDefenderModal(idx);
}

// Modal de reemplazo de equipamiento
function showReplaceModal(okCallback) {
  document.getElementById("modal-bg").classList.remove("hidden");
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal-content").textContent =
    "Esta criatura ya tiene un equipamiento. ¿Quieres reemplazarlo?";
  document.getElementById("modal-ok").onclick = () => {
    document.getElementById("modal-bg").classList.add("hidden");
    document.getElementById("modal").classList.add("hidden");
    okCallback();
  };
  document.getElementById("modal-cancel").onclick = () => {
    document.getElementById("modal-bg").classList.add("hidden");
    document.getElementById("modal").classList.add("hidden");
    placingCard = null;
    renderHand();
    renderCreatures();
    renderObjects();
    renderEnvironment();
  };
}

// Modal para defensor
function showDefenderModal(idx) {
  document.getElementById("modal-bg").classList.remove("hidden");
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal-content").textContent =
    `¿Seguro que quieres elegir a ${creatures[idx].nombre} como defensor?`;
  document.getElementById("modal-ok").onclick = () => {
    document.getElementById("modal-bg").classList.add("hidden");
    document.getElementById("modal").classList.add("hidden");
    defender = idx;
    bloqueoCambioDefensor = true;
    showMessage(`Defensor asignado: ${creatures[idx].nombre}.`);
    updateAll();
  };
  document.getElementById("modal-cancel").onclick = () => {
    document.getElementById("modal-bg").classList.add("hidden");
    document.getElementById("modal").classList.add("hidden");
    showMessage("Selección de defensor cancelada.");
  };
}

function showMessage(msg) {
  document.getElementById("message").textContent = msg;
}

function shakeHand() {
  document.getElementById("hand").classList.add("shake");
  setTimeout(() => document.getElementById("hand").classList.remove("shake"), 350);
}

// ==== Lógica de turno ====
function endTurn() {
  turno++;
  criaturaColocadaEsteTurno = false;
  bloqueoCambioDefensor = false;
  showMessage(`¡Turno ${turno}!`);
  updateAll();
  renderTurnBar();
}

function renderTurnBar() {
  let bar = document.getElementById("turn-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "turn-bar";
    bar.style.marginBottom = "10px";
    bar.style.fontWeight = "bold";
    bar.style.fontSize = "1.18em";
    document.getElementById("game-container").insertBefore(bar, document.getElementById("zones"));
    const btn = document.createElement("button");
    btn.textContent = "Siguiente turno";
    btn.onclick = endTurn;
    btn.style.marginLeft = "24px";
    btn.id = "turn-btn";
    bar.appendChild(btn);
  }
  bar.firstChild.textContent = `Turno: ${turno}  `;
}
renderTurnBar();

function updateAll() {
  renderHand();
  renderCreatures();
  renderObjects();
  renderDefender();
  renderEnvironment();
  renderTurnBar();
}
updateAll();
