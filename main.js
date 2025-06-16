// main.js - VERSIÓN CON IA Y REGLAS CORREGIDAS

// ==== Datos de las cartas ====
const deckRaw = [
    { nombre: "Skuller", ataque: 1, defensa: 1, elemento: "oscuridad", tipo: "zombie", nivel: 1, categoria: "criatura", descripcion: "Un zombi débil pero fiel." },
    { nombre: "Firia", ataque: 2, defensa: 0, elemento: "fuego", tipo: "bestia", nivel: 2, categoria: "criatura", descripcion: "Bestia ígnea de colmillos ardientes." },
    { nombre: "Lumina", ataque: 0, defensa: 2, elemento: "luz", tipo: "heroe", nivel: 1, categoria: "criatura", descripcion: "Guardián radiante de los inocentes." },
    { nombre: "Caballero Valiente", ataque: 1, defensa: 4, elemento: "luz", tipo: "heroe", nivel: 3, categoria: "criatura", descripcion: "Defensor implacable de su reino." },
    { nombre: "Dragón de Magma", ataque: 5, defensa: 2, elemento: "fuego", tipo: "dragon", nivel: 5, categoria: "criatura", descripcion: "Su aliento derrite la roca." },
    { nombre: "Espada Sagrada", categoria: "equipamiento", nivel: 2, efectos: { atk: 1 }, descripcion: "Equipamiento: +1 ATK." },
    { nombre: "Escudo Sagrado", categoria: "equipamiento", nivel: 2, efectos: { def: 1 }, descripcion: "Equipamiento: +1 DEF." },
    { nombre: "Tótem Arcano", categoria: "activo", nivel: 3, efectos: { def: 1, global: true }, descripcion: "Tus criaturas ganan +1 DEF." },
    { nombre: "Estatua Maldita", categoria: "activo", nivel: 4, efectos: { atk: -1, global: true }, descripcion: "Todas las criaturas pierden 1 ATK." },
    { nombre: "Niebla Encantada", categoria: "ambiente", nivel: 2, efectos: { atk: -1, global: true }, descripcion: "Las criaturas pierden 1 ATK." },
    { nombre: "Numina", ataque: 6, defensa: 1, elemento: "fuego", tipo: "hechicero", nivel: 6, categoria: "criatura", descripcion: "Una poderosa hechicera Hin" }
];

// ==== Variables de Estado del Juego ====
let deck, hand, creatures, equipSlots, objects, environment, defender;
let deckOpponent, handOpponent, creaturesOpponent, equipSlotsOpponent, objectsOpponent, environmentOpponent, defenderOpponent;
let playerLife, opponentLife;
let currentSummonerPoints, currentSummonerPointsOpponent;
let turno = 1;
let placingCard = null, draggedCard = null;
let criaturaColocadaEsteTurno = false, opponentCriaturaColocadaEsteTurno = false;
let bloqueoCambioDefensor = false;
let robosEsteTurno = 0;
const MAX_HAND = 6;
const MAX_SP_CAP = 6;
let activePlayer = null;
let isAITurnInProgress = false;
let gameIsOver = false;
let playerHasHadFirstTurn = false;
let opponentHasHadFirstTurn = false;

// ==== Lógica Principal ====
const delay = ms => new Promise(res => setTimeout(res, ms));

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function resetDeck(isOpponent = false) {
    const newDeck = deckRaw.slice();
    shuffle(newDeck);
    if (isOpponent) {
        deckOpponent = newDeck;
    } else {
        deck = newDeck;
    }
}

document.getElementById("deck").onclick = () => {
    if (activePlayer !== 'player' || isAITurnInProgress || gameIsOver) return;
    const deckEl = document.getElementById("deck");
    if (deckEl.classList.contains("disabled")) { return; }

    hand.push(deck.pop());
    robosEsteTurno++;
    showMessage("Has robado una carta.");
    updateAll();
};

function endTurn() {
    if (activePlayer !== 'player' || isAITurnInProgress || gameIsOver) return;
    
    activePlayer = 'opponent';
    startNewTurn();
}

function startNewTurn() {
    if (checkGameOver()) return;

    if (activePlayer === 'player') {
        turno++;
        isAITurnInProgress = false;
        document.getElementById("turn-bar").querySelector("button").disabled = false;
        
        criaturaColocadaEsteTurno = false;
        bloqueoCambioDefensor = false;
        robosEsteTurno = 0;

        // CORRECCIÓN: Solo se gana SP a partir del segundo turno del jugador
        if (playerHasHadFirstTurn) {
            if (currentSummonerPoints < MAX_SP_CAP) currentSummonerPoints++;
        }
        
        let drawCount = 1;
        if (!playerHasHadFirstTurn) {
            drawCount = 3;
            playerHasHadFirstTurn = true;
        }

        for (let i = 0; i < drawCount; i++) {
            if (hand.length < MAX_HAND && deck.length > 0) {
                hand.push(deck.pop());
            }
        }
        // CORRECCIÓN: Registrar los robos automáticos para deshabilitar el mazo
        robosEsteTurno += drawCount;
        
        showMessage("¡Es tu turno!");
        updateAll();

    } else { // Turno del Rival (IA)
        isAITurnInProgress = true;
        document.getElementById("turn-bar").querySelector("button").disabled = true;

        opponentCriaturaColocadaEsteTurno = false;

        // CORRECCIÓN: Solo se gana SP a partir del segundo turno del rival
        if (opponentHasHadFirstTurn) {
            if (currentSummonerPointsOpponent < MAX_SP_CAP) currentSummonerPointsOpponent++;
        }

        let drawCount = 1;
        if (!opponentHasHadFirstTurn) {
            drawCount = 3;
            opponentHasHadFirstTurn = true;
        }

        for (let i = 0; i < drawCount; i++) {
            if (handOpponent.length < MAX_HAND && deckOpponent.length > 0) {
                handOpponent.push(deckOpponent.pop());
            }
        }

        showMessage("Turno del rival...");
        updateAll();

        setTimeout(executeAITurn, 1500);
    }
}

async function executeAITurn() {
    if (checkGameOver()) return;
    
    // --- LÓGICA DE IA MEJORADA Y CORREGIDA ---
    const canAfford = (card) => {
        const cost = getCardCost(card);
        const canPay = cost <= currentSummonerPointsOpponent;
        return canPay;
    }

    // 1. Intentar jugar carta de Ambiente
    await delay(1000);
    if (environmentOpponent === null) {
        const playableAmbiente = handOpponent.find(c => c.categoria === 'ambiente' && canAfford(c));
        if (playableAmbiente) {
            const cardIndex = handOpponent.indexOf(playableAmbiente);
            payForCard(playableAmbiente, true);
            environmentOpponent = handOpponent.splice(cardIndex, 1)[0];
            showMessage(`El rival ha jugado ${environmentOpponent.nombre}`);
            updateAll();
        }
    }

    // 2. Intentar jugar la mejor Criatura
    await delay(1000);
    if (!opponentCriaturaColocadaEsteTurno) {
        const emptySlotIndex = creaturesOpponent.findIndex(slot => slot === null);
        if (emptySlotIndex !== -1) {
            const playableCreatures = handOpponent
                .filter(card => card.categoria === 'criatura' && canAfford(card))
                .sort((a, b) => b.ataque - a.ataque);

            if (playableCreatures.length > 0) {
                const bestCreature = playableCreatures[0];
                const cardIndexInHand = handOpponent.indexOf(bestCreature);
                
                payForCard(bestCreature, true);
                creaturesOpponent[emptySlotIndex] = handOpponent.splice(cardIndexInHand, 1)[0];
                opponentCriaturaColocadaEsteTurno = true;
                
                showMessage(`El rival ha invocado a ${bestCreature.nombre}.`);
                updateAll();
            }
        }
    }

    // 3. Intentar jugar un Objeto Activo
    await delay(1000);
    const emptyObjectSlot = objectsOpponent.left === null ? 'left' : (objectsOpponent.right === null ? 'right' : null);
    if(emptyObjectSlot) {
        const playableActivo = handOpponent.find(c => c.categoria === 'activo' && canAfford(c));
        if(playableActivo) {
            const cardIndex = handOpponent.indexOf(playableActivo);
            payForCard(playableActivo, true);
            objectsOpponent[emptyObjectSlot] = handOpponent.splice(cardIndex, 1)[0];
            showMessage(`El rival ha jugado ${objectsOpponent[emptyObjectSlot].nombre}`);
            updateAll();
        }
    }

    // 4. Intentar jugar un Equipamiento
    await delay(1000);
    const targetCreatureIndex = creaturesOpponent.findIndex((creature, index) => creature !== null && equipSlotsOpponent[index] === null);
    if (targetCreatureIndex !== -1) {
        const playableEquip = handOpponent.find(c => c.categoria === 'equipamiento' && canAfford(c));
        if (playableEquip) {
            const cardIndex = handOpponent.indexOf(playableEquip);
            payForCard(playableEquip, true);
            equipSlotsOpponent[targetCreatureIndex] = handOpponent.splice(cardIndex, 1)[0];
            showMessage(`El rival ha equipado ${equipSlotsOpponent[targetCreatureIndex].nombre} a ${creaturesOpponent[targetCreatureIndex].nombre}.`);
            updateAll();
        }
    }

    // 5. Seleccionar Defensor
    await delay(1000);
    const opponentCreaturesOnBoard = creaturesOpponent.map((card, index) => ({ card, index }))
                                                      .filter(item => item.card !== null);

    if (opponentCreaturesOnBoard.length > 0) {
        opponentCreaturesOnBoard.sort((a, b) => b.card.defensa - a.card.defensa);
        const newDefenderIndex = opponentCreaturesOnBoard[0].index;
        
        if (defenderOpponent !== newDefenderIndex) {
            defenderOpponent = newDefenderIndex;
            showMessage(`El rival ha elegido a ${creaturesOpponent[newDefenderIndex].nombre} como defensor.`);
            updateAll();
        }
    }
    
    // 6. Terminar el turno
    await delay(1500);
    showMessage("El rival ha terminado su turno.");
    activePlayer = 'player';
    startNewTurn();
}

function checkGameOver() {
    if (gameIsOver) return true;
    let winner = null;

    if (playerLife <= 0) winner = 'opponent';
    if (opponentLife <= 0) winner = 'player';
    
    if(winner) {
        gameIsOver = true;
        const modalContent = document.getElementById("modal-content");
        if (winner === 'player') {
            modalContent.innerHTML = `<h2>¡VICTORIA!</h2><p>Has derrotado a tu oponente.</p>`;
        } else {
            modalContent.innerHTML = `<h2>¡Has sido derrotado!</h2><p>Tu vida ha llegado a 0.</p>`;
        }
        document.getElementById("modal-ok").textContent = "Jugar de Nuevo";
        document.getElementById("modal-cancel").classList.add("hidden");
        document.getElementById("modal-ok").onclick = () => window.location.reload();
        document.getElementById("modal-bg").classList.remove("hidden");
        document.getElementById("modal").classList.remove("hidden");
        return true;
    }
    return false;
}

function getCardCost(card) {
    if (!card || !card.nivel) return 0;
    return Math.max(0, card.nivel - 1);
}

function getEffectiveCreatureStats(index, isOpponent = false) {
    const creaturesArray = isOpponent ? creaturesOpponent : creatures;
    const creature = creaturesArray[index];
    if (!creature) return null;

    let effectiveAtk = creature.ataque;
    let effectiveDef = creature.defensa;
    
    const relevantEquip = isOpponent ? equipSlotsOpponent[index] : equipSlots[index];
    const relevantObjects = isOpponent ? objectsOpponent : objects;
    const relevantEnv = isOpponent ? environmentOpponent : environment;

    if (relevantEquip?.efectos) {
        effectiveAtk += relevantEquip.efectos.atk || 0;
        effectiveDef += relevantEquip.efectos.def || 0;
    }

    Object.values(relevantObjects).forEach(obj => {
        if (obj?.efectos?.global) {
            effectiveAtk += obj.efectos.atk || 0;
            effectiveDef += obj.efectos.def || 0;
        }
    });
    
    Object.values(isOpponent ? objects : objectsOpponent).forEach(obj => {
        if (obj?.efectos?.global && obj.afectaOponente) { 
            effectiveAtk += obj.efectos.atk || 0;
            effectiveDef += obj.efectos.def || 0;
        }
    });

    if (relevantEnv?.efectos?.global) {
        effectiveAtk += relevantEnv.efectos.atk || 0;
        effectiveDef += relevantEnv.efectos.def || 0;
    }

    return {
        atk: Math.max(0, effectiveAtk),
        def: Math.max(0, effectiveDef)
    };
}

function createCardDiv(card, effectiveStats = null) {
    if (typeof card !== 'object' || card === null) {
        console.error("ALERTA: Se intentó crear una carta con datos inválidos:", card);
        const errorDiv = document.createElement("div");
        errorDiv.className = "card";
        errorDiv.textContent = "Error de Carta";
        return errorDiv; 
    }

    const el = document.createElement("div");
    el.className = 'card ' + (card.categoria || '') + ' ' + (card.elemento || '');
    
    let statsHtml = "";
    if (card.ataque !== undefined) {
        let atkDisplay = effectiveStats ? effectiveStats.atk : card.ataque;
        let defDisplay = effectiveStats ? effectiveStats.def : card.defensa;
        const atkClass = effectiveStats && effectiveStats.atk > card.ataque ? 'stat-buff' : (effectiveStats && effectiveStats.atk < card.ataque ? 'stat-debuff' : '');
        const defClass = effectiveStats && effectiveStats.def > card.defensa ? 'stat-buff' : (effectiveStats && effectiveStats.def < card.defensa ? 'stat-debuff' : '');
        statsHtml = '<div class="stats">ATK: <span class="' + atkClass + '">' + atkDisplay + '</span> / DEF: <span class="' + defClass + '">' + defDisplay + '</span></div>';
    }

    const icons = card.categoria === "equipamiento" ? '<span class="equip-icon">🗡️</span>' : (card.categoria === "activo" ? '<span class="active-icon">💠</span>' : '');
    const cost = getCardCost(card);
    const costIcon = '<div class="card-cost">' + cost + '</div>';

    el.innerHTML =
        costIcon +
        '<div class="name">' + (card.nombre || 'Sin Nombre') + '</div>' +
        statsHtml +
        '<div class="desc">' + (card.descripcion || '') + '</div>' +
        icons;

    return el;
}

function setupDropZone(slot, isAvailable, onDrop) {
    slot.addEventListener("dragover", e => {
        if (isAvailable(e)) {
            e.preventDefault();
            slot.classList.add("drag-over");
        }
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
    slot.addEventListener("drop", e => {
        e.preventDefault();
        slot.classList.remove("drag-over");
        if (isAvailable(e)) { onDrop(e); }
    });
}

function renderHand() {
    const handDiv = document.getElementById("hand");
    handDiv.innerHTML = "";
    const numCards = hand.length;

    hand.forEach((card, idx) => {
        const c = createCardDiv(card);
        c.draggable = true;
        
        if (getCardCost(card) > currentSummonerPoints) { c.classList.add("disabled"); }

        const angleIncrement = 5;
        const yOffset = 1.5;
        const rotationAngle = (idx - Math.floor(numCards / 2)) * angleIncrement;
        const cardY = Math.abs(idx - Math.floor(numCards / 2)) * yOffset;
        c.style.transform = `translateY(${cardY}rem) rotate(${rotationAngle}deg)`;
        c.style.zIndex = idx;
        c.style.left = `calc(50% - 5rem + ${(idx - (numCards -1) / 2) * 4}rem)`;

        c.addEventListener("dragstart", e => {
            if (activePlayer !== 'player' || getCardCost(card) > currentSummonerPoints) { e.preventDefault(); return; }
            draggedCard = card; 
            e.dataTransfer.setData("type", "fromHand");
            e.dataTransfer.setData("handIndex", idx);
            setTimeout(() => {
                c.style.visibility = "hidden";
            }, 0);
        });
        c.addEventListener("dragend", () => {
            draggedCard = null; 
            c.style.visibility = "visible";
        });
        c.onclick = () => {
            if (activePlayer === 'player') startPlacingCard(idx);
        }
        handDiv.appendChild(c);
    });
}

function renderHandOpponent() {
    const handDiv = document.getElementById("hand-opponent");
    handDiv.innerHTML = "";
    const numCards = handOpponent.length;

    for (let i = 0; i < numCards; i++) {
        const c = document.createElement("div");
        c.className = "card card-back"; 
        
        const angleIncrement = 5;
        const yOffset = 1.5;
        const rotationAngle = (i - Math.floor(numCards / 2)) * angleIncrement;
        const cardY = Math.abs(i - Math.floor(numCards / 2)) * yOffset;
        c.style.transform = `translateY(${cardY}rem) rotate(${rotationAngle}deg) rotate(180deg)`;
        c.style.zIndex = i;
        c.style.left = `calc(50% - 5rem + ${(i - (numCards -1) / 2) * 4}rem)`;
        handDiv.appendChild(c);
    }
}

function renderCreatures() {
    for (let i = 0; i < 3; i++) {
        const creatureZone = document.querySelector(`#creature-board .creature-zone:nth-child(${i + 1})`);
        const creatureSlot = creatureZone.querySelector('.creature-slot');
        const equipSlot = creatureZone.querySelector('.equip-slot');

        creatureSlot.innerHTML = "";
        creatureSlot.className = "creature-slot";
        equipSlot.innerHTML = "";
        equipSlot.className = "equip-slot";
        creatureZone.onclick = null;
        creatureSlot.onclick = null;
        creatureZone.classList.remove("has-equipment", "valid");

        const onDropEquipment = e => {
            const type = e.dataTransfer.getData("type");
            if (type === "fromHand") {
                const handIndex = parseInt(e.dataTransfer.getData("handIndex"), 10);
                const card = hand[handIndex];
                if (card && card.categoria === 'equipamiento') {
                    tryEquipCreature(handIndex, i);
                }
            } else if (type === "fromEquipSlot") {
                const sourceIndex = parseInt(e.dataTransfer.getData("sourceIndex"), 10);
                if (sourceIndex !== i) { moveEquipment(sourceIndex, i); }
            }
        };

        const isCreatureSlotAvailable = () => !creatures[i] && !criaturaColocadaEsteTurno && (placingCard?.card.categoria === "criatura" || draggedCard?.categoria === "criatura");
        const isEquipSlotAvailable = () => placingCard?.card.categoria === "equipamiento" || draggedCard?.categoria === "equipamiento";

        setupDropZone(creatureSlot, isCreatureSlotAvailable, e => {
            const handIndex = parseInt(e.dataTransfer.getData("handIndex"), 10);
            placeCardOnCreature(handIndex, i);
        });

        if (creatures[i]) {
            const c = createCardDiv(creatures[i], getEffectiveCreatureStats(i));
            if (defender === i) { c.classList.add("is-defender"); }
            creatureSlot.appendChild(c);
            c.onclick = () => assignDefender(i);

            setupDropZone(creatureZone, isEquipSlotAvailable, onDropEquipment);
            
            if (isEquipSlotAvailable()) {
                 creatureZone.classList.add("valid");
                 if (placingCard) creatureZone.onclick = () => tryEquipCreature(placingCard.index, i);
            }
        } else {
            if (isCreatureSlotAvailable()) {
                creatureSlot.classList.add("valid");
                if (placingCard) creatureSlot.onclick = () => placeCardOnCreature(placingCard.index, i);
            }
        }
        
        if (equipSlots[i]) {
            creatureZone.classList.add("has-equipment");
            const c = createCardDiv(equipSlots[i]);
            c.draggable = true;
            c.addEventListener("dragstart", e => {
                e.stopPropagation();
                draggedCard = equipSlots[i];
                e.dataTransfer.setData("type", "fromEquipSlot");
                e.dataTransfer.setData("sourceIndex", i);
                setTimeout(() => { c.style.visibility = 'hidden'; }, 0);
            });
            c.addEventListener("dragend", () => {
                draggedCard = null;
                c.style.visibility = 'visible';
            });
            c.onclick = e => e.stopPropagation();
            equipSlot.appendChild(c);
        }
    }
}

function renderObjects() {
    ["left", "right"].forEach(side => {
        const slot = document.querySelector(`#zones .object-slot[data-side="${side}"]`);
        slot.innerHTML = "";
        slot.className = "object-slot";
        slot.onclick = null;
        
        const isObjectSlotAvailable = () => placingCard?.card.categoria === "activo" || draggedCard?.categoria === "activo";

        setupDropZone(slot, isObjectSlotAvailable, e => {
            const handIndex = parseInt(e.dataTransfer.getData("handIndex"), 10);
            tryPlaceObject(handIndex, side);
        });

        if (isObjectSlotAvailable()) {
            slot.classList.add("valid");
            if(placingCard) slot.onclick = () => tryPlaceObject(placingCard.index, side);
        }

        if (objects[side]) {
            const c = createCardDiv(objects[side]);
            slot.appendChild(c);
        }
    });
}

function renderEnvironment() {
    const slot = document.querySelector("#environment-zone .environment-slot");
    slot.innerHTML = "";
    slot.className = "environment-slot";
    slot.onclick = null;

    const isEnvSlotAvailable = () => !environment && (placingCard?.card.categoria === "ambiente" || draggedCard?.categoria === "ambiente");

    setupDropZone(slot, isEnvSlotAvailable, e => {
        const handIndex = parseInt(e.dataTransfer.getData("handIndex"), 10);
        placeCardOnEnvironment(handIndex);
    });

    if (isEnvSlotAvailable()) {
        slot.classList.add("valid");
        if(placingCard) slot.onclick = () => placeCardOnEnvironment(placingCard.index);
    }

    if (environment) {
        const c = createCardDiv(environment);
        slot.appendChild(c);
    }
}

function renderCreaturesOpponent() {
    for (let i = 0; i < 3; i++) {
        const creatureSlot = document.querySelector(`#creature-board-opponent .creature-zone:nth-child(${i + 1}) .creature-slot`);
        creatureSlot.innerHTML = "";
        if (creaturesOpponent[i]) {
            const stats = getEffectiveCreatureStats(i, true);
            const c = createCardDiv(creaturesOpponent[i], stats);
            if (defenderOpponent === i) {
                c.classList.add("is-defender");
            }
            creatureSlot.appendChild(c);
        }
    }
}

function renderObjectsOpponent() {
    ["left", "right"].forEach(side => {
        const slot = document.querySelector(`#zones-opponent .object-slot[data-side="${side}"]`);
        slot.innerHTML = "";
        if (objectsOpponent[side]) {
            const c = createCardDiv(objectsOpponent[side]);
            slot.appendChild(c);
        }
    });
}

function renderEnvironmentOpponent() {
    const slot = document.querySelector("#environment-zone-opponent .environment-slot");
    slot.innerHTML = "";
    if (environmentOpponent) {
        const c = createCardDiv(environmentOpponent);
        slot.appendChild(c);
    }
}

function renderLifeTotals() {
    document.getElementById("player-life-display").textContent = playerLife;
    document.getElementById("opponent-life-display").textContent = opponentLife;
    checkGameOver();
}

function startPlacingCard(idx) {
    if (activePlayer !== 'player') return;
    const card = hand[idx];
    if (getCardCost(card) > currentSummonerPoints) {
        showMessage("No tienes suficientes Puntos de Invocador.");
        return;
    }
    if (card?.categoria === "criatura" && criaturaColocadaEsteTurno) {
        showMessage("Solo puedes colocar una criatura por turno.");
        return;
    }
    if (placingCard && placingCard.index === idx) {
        placingCard = null;
    } else {
        placingCard = { card: card, index: idx };
    }
    updateAll();
}

// --- FUNCIÓN DE PAGO UNIVERSAL ---
function payForCard(card, isOpponent = false) {
    const cost = getCardCost(card);
    if (isOpponent) {
        currentSummonerPointsOpponent -= cost;
    } else {
        currentSummonerPoints -= cost;
    }
}

function placeCardOnCreature(hIdx, sIdx) {
    const card = hand[hIdx];
    payForCard(card, false);
    creatures[sIdx] = card;
    hand.splice(hIdx, 1);
    criaturaColocadaEsteTurno = true;
    showMessage("¡Criatura colocada!");
    placingCard = null;
    draggedCard = null;
    updateAll();
}

function tryEquipCreature(hIdx, sIdx) {
    const card = hand[hIdx];
    const onPlace = () => {
        payForCard(card, false);
        equipSlots[sIdx] = card;
        hand.splice(hIdx, 1);
        placingCard = null;
        draggedCard = null;
        updateAll();
    };

    if (equipSlots[sIdx]) {
        showReplaceModal(() => {
            showMessage("¡Equipamiento reemplazado!");
            onPlace();
        });
    } else {
        showMessage("¡Equipamiento equipado!");
        onPlace();
    }
}

function tryPlaceObject(hIdx, side) {
    if (!hand[hIdx]) { return; }
    const card = hand[hIdx];
    if (card.categoria !== 'activo') { return; }

    const onPlace = () => {
        payForCard(card, false);
        objects[side] = card;
        hand.splice(hIdx, 1);
        placingCard = null;
        draggedCard = null;
        updateAll();
    };
    
    if (objects[side] !== null) {
        showReplaceModal(() => {
            showMessage("¡Objeto reemplazado!");
            onPlace();
        }, "objeto");
    } else {
        showMessage("¡Objeto activo colocado!");
        onPlace();
    }
}

function moveEquipment(fromIdx, toIdx) {
    const card = equipSlots[fromIdx];
    const onPlace = () => {
        equipSlots[fromIdx] = null;
        equipSlots[toIdx] = card;
        showMessage("¡Equipamiento movido!");
        updateAll();
    };

    if (equipSlots[toIdx]) {
        showReplaceModal(onPlace);
    } else {
        onPlace();
    }
}

function placeCardOnEnvironment(hIdx) {
    const card = hand[hIdx];
    const onPlace = () => {
        payForCard(card, false);
        environment = card;
        hand.splice(hIdx, 1);
        placingCard = null;
        draggedCard = null;
        updateAll();
    };

    if (environment) {
        showReplaceModal(() => {
             showMessage("¡Ambiente reemplazado!");
             onPlace();
        }, "ambiente");
    } else {
        showMessage("¡Ambiente activado!");
        onPlace();
    }
}

function assignDefender(idx) {
    if (activePlayer !== 'player' || bloqueoCambioDefensor) { return; }
    if (defender === idx) {
        defender = null;
        bloqueoCambioDefensor = false;
        showMessage("Ya no tienes un defensor asignado.");
        updateAll();
    } else {
        showDefenderModal(idx);
    }
}

function showReplaceModal(okCb, type = "equipamiento") {
    const modalBg = document.getElementById("modal-bg"),
        modal = document.getElementById("modal");
    modalBg.classList.remove("hidden");
    modal.classList.remove("hidden");
    document.getElementById("modal-content").textContent = `Esta casilla ya tiene un ${type}. ¿Quieres reemplazarlo?`;
    document.getElementById("modal-ok").textContent = "Reemplazar";
    document.getElementById("modal-ok").onclick = () => {
        modalBg.classList.add("hidden");
        modal.classList.add("hidden");
        okCb();
    };
    document.getElementById("modal-cancel").onclick = () => {
        modalBg.classList.add("hidden");
        modal.classList.add("hidden");
        placingCard = null;
        updateAll();
    };
}

function showDefenderModal(idx) {
    const modalBg = document.getElementById("modal-bg"),
        modal = document.getElementById("modal");
    modalBg.classList.remove("hidden");
    modal.classList.remove("hidden");
    document.getElementById("modal-content").textContent = `¿Seguro que quieres elegir a ${creatures[idx].nombre} como defensor? No podrás cambiarlo este turno.`;
    document.getElementById("modal-ok").textContent = "Aceptar";
    document.getElementById("modal-ok").onclick = () => {
        modalBg.classList.add("hidden");
        modal.classList.add("hidden");
        defender = idx;
        bloqueoCambioDefensor = true;
        showMessage(`${creatures[idx].nombre} es ahora el defensor.`);
        updateAll();
    };
    document.getElementById("modal-cancel").onclick = () => {
        modalBg.classList.add("hidden");
        modal.classList.add("hidden");
    };
}

function showMessage(msg) {
    const msgEl = document.getElementById("message");
    msgEl.textContent = msg;
    msgEl.style.opacity = 1;
    setTimeout(() => { msgEl.style.opacity = 0; }, 3000);
}

function renderTurnBar() {
    let bar = document.getElementById("turn-bar");
    const btn = bar.querySelector("button") || document.createElement("button");
    const turnText = bar.querySelector("span") || document.createElement("span");

    if (!bar.contains(turnText)) {
        bar.appendChild(turnText);
    }
    if (!bar.contains(btn)) {
        btn.textContent = "Siguiente Turno";
        btn.onclick = endTurn;
        bar.appendChild(btn);
    }
    
    turnText.textContent = `Turno: ${turno}`;
}

function renderDeck() {
    document.getElementById("deck-count").textContent = deck.length;
    
    const isPlayerTurn = activePlayer === 'player';
    // CORRECCIÓN: El límite de robos manuales siempre es 1. El robo inicial es automático.
    const drawLimit = 1; 
    const canDraw = isPlayerTurn && robosEsteTurno < drawLimit;
    const handNotFull = hand.length < MAX_HAND;
    const deckNotEmpty = deck.length > 0;

    if (canDraw && handNotFull && deckNotEmpty) {
        document.getElementById("deck").classList.remove("disabled");
    } else {
        document.getElementById("deck").classList.add("disabled");
    }
    document.getElementById("deck-count-opponent").textContent = deckOpponent.length;
}

function renderSummonerPoints() {
    document.getElementById("sp-display").textContent = `${currentSummonerPoints} / ${MAX_SP_CAP}`;
    document.getElementById("sp-display-opponent").textContent = `${currentSummonerPointsOpponent} / ${MAX_SP_CAP}`;
}

function updateAll() {
    if (gameIsOver) return;

    if (placingCard && !hand.includes(placingCard.card)) {
        placingCard = null;
    }
    
    renderSummonerPoints();
    renderLifeTotals();
    renderHand();
    renderCreatures();
    renderObjects();
    renderEnvironment();
    renderDeck();
    renderHandOpponent();
    renderCreaturesOpponent();
    renderObjectsOpponent();
    renderEnvironmentOpponent();
    renderTurnBar();
}

function initGame() {
    deck = []; hand = []; creatures = [null, null, null]; equipSlots = [null, null, null];
    objects = { left: null, right: null }; environment = null; defender = null;
    playerLife = 20; currentSummonerPoints = 1; robosEsteTurno = 0; criaturaColocadaEsteTurno = false;
    playerHasHadFirstTurn = false;
    resetDeck(false);

    deckOpponent = []; handOpponent = []; creaturesOpponent = [null, null, null]; equipSlotsOpponent = [null, null, null];
    objectsOpponent = { left: null, right: null }; environmentOpponent = null; defenderOpponent = null;
    opponentLife = 20; currentSummonerPointsOpponent = 1;
    opponentHasHadFirstTurn = false;
    resetDeck(true);
    
    isAITurnInProgress = false;
    gameIsOver = false;
    turno = 1;
    
    activePlayer = Math.random() < 0.5 ? 'player' : 'opponent';
    
    setupMusicPlayer();
    updateAll();
    
    setTimeout(startNewTurn, 500);
}

const playlist = [
    { src: 'music/Fables-in-the-Flickerlight.mp3', title: 'Fables in the Flickerlight' },
    { src: 'music/Luck_on-the-Table.mp3', title: 'Luck on the Table' },
    { src: 'music/Raise-a-Card-Raise-a-Glass.mp3', title: 'Raise a Card, Raise a Glass' },
    { src: 'music/Shuffle-&-Cheers!.mp3', title: 'Shuffle & Cheers!' },
    { src: 'music/The_Joyful_Gambit.mp3', title: 'The Joyful Gambit' }
];
let currentTrackIndex = -1;
let musicPlayer;
let musicIcon;
let songTitle;
function setupMusicPlayer() {
    musicPlayer = document.getElementById('background-music');
    musicIcon = document.getElementById('music-toggle-icon');
    songTitle = document.getElementById('current-song-title');
    musicIcon.addEventListener('click', toggleMute);
    musicPlayer.addEventListener('ended', playRandomTrack);
    document.body.addEventListener('click', startMusicOnFirstInteraction, { once: true });
    const startingTrackIndex = Math.floor(Math.random() * playlist.length);
    loadTrack(startingTrackIndex);
    musicPlayer.load();
}
function loadTrack(index) {
    if (playlist[index]) {
        currentTrackIndex = index;
        musicPlayer.src = playlist[index].src;
        songTitle.textContent = playlist[index].title;
    }
}
function playRandomTrack() {
    if (playlist.length === 0) return;
    let newIndex;
    if (playlist.length === 1) {
        newIndex = 0;
    } else {
        do {
            newIndex = Math.floor(Math.random() * playlist.length);
        } while (newIndex === currentTrackIndex);
    }
    loadTrack(newIndex);
    musicPlayer.play();
}
function toggleMute() {
    musicPlayer.muted = !musicPlayer.muted;
    updateMusicUI();
}
function updateMusicUI() {
    if (musicPlayer.muted) {
        musicIcon.textContent = '🔇';
        songTitle.classList.add('hidden');
    } else {
        musicIcon.textContent = '🎵';
        songTitle.classList.remove('hidden');
    }
}
function startMusicOnFirstInteraction() {
    if (musicPlayer.paused) {
        musicPlayer.play().catch(error => {
            console.warn("La reproducción automática fue bloqueada por el navegador.");
        });
    }
}

initGame();