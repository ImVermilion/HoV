// main.js - VERSIÓN CON IA, REGLAS CORREGIDAS Y SISTEMA DE ATAQUE
// ==== Datos de las cartas ====
const deckRaw = cartas.slice();

// ==== Variables de Estado del Juego ====
let deck, hand, creatures, equipSlots, objects, environment, defender;
let deckOpponent, handOpponent, creaturesOpponent, equipSlotsOpponent, objectsOpponent, environmentOpponent, defenderOpponent;
let playerLife, opponentLife;
let currentSummonerPoints, currentSummonerPointsOpponent;
let turno = 1;
let placingCard = null, draggedCard = null;
let criaturaColocadaEsteTurno = false;
let robosEsteTurno = 0;

// --- VARIABLES DE COMBATE ---
let attackingCreatureIndex = null;
let playerCreaturesAttacked = [false, false, false];
let defenderDamageThisTurn = 0;
let playerDefenderDamageThisTurn = 0; // NUEVO: Daño acumulado en nuestro defensor

const MAX_HAND = 6;
const MAX_SP_CAP = 6;
let activePlayer = null;
let isAITurnInProgress = false;
let gameIsOver = false;
let playerHasHadFirstTurn = false;
let opponentHasHadFirstTurn = false;

// --- NUEVAS VARIABLES PARA FASES ---
let playerPhase = 'main'; // puede ser 'main', 'defend', 'attack'
const phaseOrder = ['main', 'defend', 'attack'];

let arrowActive = false;
let arrowOrigin = { x: 0, y: 0 };
let arrowTarget = { x: 0, y: 0 };

// --- FLECHA DE ATAQUE ---
// --- FLECHA DE ATAQUE (Mejorada y arreglada) ---
function drawAttackArrow() {
    const canvas = document.getElementById('attack-arrow');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!arrowActive) return;

    ctx.save();
    // Gradiente bonito
    const grad = ctx.createLinearGradient(arrowOrigin.x, arrowOrigin.y, arrowTarget.x, arrowTarget.y);
    grad.addColorStop(0, "#ffe553");
    grad.addColorStop(0.4, "#ff7e2d");
    grad.addColorStop(1, "#ff2525");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 9;
    ctx.shadowColor = "#ff902a";
    ctx.shadowBlur = 26;
    ctx.beginPath();
    ctx.moveTo(arrowOrigin.x, arrowOrigin.y);
    ctx.lineTo(arrowTarget.x, arrowTarget.y);
    ctx.stroke();

    // Cabeza estilizada
    const headlen = 32;
    const dx = arrowTarget.x - arrowOrigin.x;
    const dy = arrowTarget.y - arrowOrigin.y;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(arrowTarget.x, arrowTarget.y);
    ctx.lineTo(
        arrowTarget.x - headlen * Math.cos(angle - Math.PI/8),
        arrowTarget.y - headlen * Math.sin(angle - Math.PI/8)
    );
    ctx.lineTo(
        arrowTarget.x - headlen * 0.65 * Math.cos(angle),
        arrowTarget.y - headlen * 0.65 * Math.sin(angle)
    );
    ctx.lineTo(
        arrowTarget.x - headlen * Math.cos(angle + Math.PI/8),
        arrowTarget.y - headlen * Math.sin(angle + Math.PI/8)
    );
    ctx.lineTo(arrowTarget.x, arrowTarget.y);
    ctx.fillStyle = "#ff3c00";
    ctx.shadowColor = "#ffad45";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();
}

function clearAttackArrow() {
    const canvas = document.getElementById('attack-arrow');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateArrowTarget(e) {
    if (!arrowActive) return;
    arrowTarget = { x: e.clientX, y: e.clientY };
    drawAttackArrow();
}

// Cancelación avanzada
function cancelAttackArrow() {
    arrowActive = false;
    attackingCreatureIndex = null;
    clearAttackArrow();
    window.removeEventListener('mousemove', updateArrowTarget);
    window.removeEventListener('keydown', onKeyDownAttackArrow);
    window.removeEventListener('mousedown', onMouseDownAttackArrow);
    updateAll();
}

function onKeyDownAttackArrow(e) {
    if (e.key === "Escape") {
        cancelAttackArrow();
    }
}

function onMouseDownAttackArrow(e) {
    // Solo cancela si NO haces click sobre objetivo válido (con la clase valid-attack-target)
    if (!e.target.closest('.valid-attack-target')) {
        cancelAttackArrow();
    }
}

window.addEventListener('resize', () => {
    if (arrowActive) drawAttackArrow();
});

// --------- FLECHA VISUAL PARA IA ---------
async function showAIAttackArrow(attackerIndex, targetIndex) {
    const attackerDiv = document.querySelector(`#creature-board-opponent .creature-zone:nth-child(${attackerIndex + 1}) .creature-slot .card`);
    let targetDiv;
    if (targetIndex !== null) {
        targetDiv = document.querySelector(`#creature-board .creature-zone:nth-child(${targetIndex + 1}) .creature-slot .card`);
    } else {
        const lifeArea = document.getElementById('life-area');
        targetDiv = {
            getBoundingClientRect: () => lifeArea.getBoundingClientRect()
        };
    }
    if (attackerDiv && targetDiv) {
        const attackerRect = attackerDiv.getBoundingClientRect();
        const targetRect = targetDiv.getBoundingClientRect();
        arrowOrigin = {
            x: attackerRect.left + attackerRect.width / 2,
            y: attackerRect.top + attackerRect.height / 2
        };
        arrowTarget = {
            x: targetRect.left + targetRect.width / 2,
            y: targetRect.top + targetRect.height / 2
        };
        arrowActive = true;
        drawAttackArrow();
        await delay(900);
        clearAttackArrow();
        arrowActive = false;
    } else {
        await delay(900);
    }
}



function clearAttackArrow() {
    const canvas = document.getElementById('attack-arrow');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateArrowTarget(e) {
    if (!arrowActive) return;
    arrowTarget = { x: e.clientX, y: e.clientY };
    drawAttackArrow();
}

window.addEventListener('resize', () => {
    if (arrowActive) drawAttackArrow();
});

// --------- FLECHA VISUAL PARA IA ---------
async function showAIAttackArrow(attackerIndex, targetIndex) {
    const attackerDiv = document.querySelector(`#creature-board-opponent .creature-zone:nth-child(${attackerIndex + 1}) .creature-slot .card`);
    let targetDiv;
    if (targetIndex !== null) {
        targetDiv = document.querySelector(`#creature-board .creature-zone:nth-child(${targetIndex + 1}) .creature-slot .card`);
    } else {
        const lifeArea = document.getElementById('life-area');
        targetDiv = {
            getBoundingClientRect: () => lifeArea.getBoundingClientRect()
        };
    }
    if (attackerDiv && targetDiv) {
        const attackerRect = attackerDiv.getBoundingClientRect();
        const targetRect = targetDiv.getBoundingClientRect();
        arrowOrigin = {
            x: attackerRect.left + attackerRect.width / 2,
            y: attackerRect.top + attackerRect.height / 2
        };
        arrowTarget = {
            x: targetRect.left + targetRect.width / 2,
            y: targetRect.top + targetRect.height / 2
        };
        arrowActive = true;
        drawAttackArrow();
        await delay(900);
        clearAttackArrow();
        arrowActive = false;
    } else {
        await delay(900);
    }
}



// ==== Lógica Principal ====
const delay = ms => new Promise(res => setTimeout(res, ms));

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function resetDeck(isOpponent = false) {
    const newDeck = deckRaw.map(card => ({ ...card }));
    shuffle(newDeck);
    if (isOpponent) {
        deckOpponent = newDeck;
    } else {
        deck = newDeck;
    }
}

document.getElementById("deck").onclick = () => {
    if (activePlayer !== 'player' || isAITurnInProgress || gameIsOver) return;
    // El robo manual solo es posible en la fase principal
    if (playerPhase !== 'main') {
        showMessage("Solo puedes robar en la fase principal.");
        return;
    }
    const deckEl = document.getElementById("deck");
    if (deckEl.classList.contains("disabled")) { return; }

    hand.push(deck.pop());
    robosEsteTurno++;
    showMessage("Has robado una carta.");
    updateAll();
};


// --- LÓGICA DE FASES DEL JUGADOR ---

function advancePhase() {
    if (activePlayer !== 'player' || isAITurnInProgress) return;

    const currentPhaseIndex = phaseOrder.indexOf(playerPhase);

    if (currentPhaseIndex < phaseOrder.length - 1) {
        const nextPhase = phaseOrder[currentPhaseIndex + 1];
        playerPhase = nextPhase;

        if (playerPhase === 'defend') {
             showMessage("Fase de Defensa: Elige una criatura como defensora.");
        } else if (playerPhase === 'attack') {
            showMessage("Fase de Ataque: ¡Selecciona tus criaturas para atacar!");
            attackingCreatureIndex = null; // Limpiar cualquier selección de ataque residual
        }

    } else {
        // Si estamos en la última fase (ataque), el botón termina el turno.
        showEndTurnModal();
    }
    updateAll();
}

function showEndTurnModal() {
    const modalBg = document.getElementById("modal-bg"),
          modal = document.getElementById("modal");
    modalBg.classList.remove("hidden");
    modal.classList.remove("hidden");
    document.getElementById("modal-content").textContent = `¿Seguro que quieres terminar tu turno?`;
    document.getElementById("modal-ok").textContent = "Terminar Turno";
    document.getElementById("modal-ok").disabled = false; // <-- ¡ESTO!
    document.getElementById("modal-ok").onclick = () => {
        modalBg.classList.add("hidden");
        modal.classList.add("hidden");
        endTurn();
    };
    document.getElementById("modal-cancel").onclick = () => {
        modalBg.classList.add("hidden");
        modal.classList.add("hidden");
    };
}


function endTurn() {
    restoreAllDefenses();
    if (activePlayer !== 'player' || isAITurnInProgress || gameIsOver) return;

    activePlayer = 'opponent';
    startNewTurn();
}

function startNewTurn() {
    restoreAllDefenses();
    if (checkGameOver()) return;

    if (activePlayer === 'player') {
        turno++;
        isAITurnInProgress = false;
        playerPhase = 'main'; // Iniciar siempre en la fase principal

        // REINICIO DE ESTADO DE ATAQUE Y DEFENSA
        attackingCreatureIndex = null;
        playerCreaturesAttacked = [false, false, false];
        defenderDamageThisTurn = 0; // Daño al defensor del RIVAL se reinicia
        playerDefenderDamageThisTurn = 0; // NUEVO: Daño a NUESTRO defensor se reinicia

        criaturaColocadaEsteTurno = false;
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
        robosEsteTurno += drawCount;

        showMessage("¡Es tu turno! Fase principal.");
        updateAll();

    } else { // Turno del Rival (IA)
        isAITurnInProgress = true;

        opponentCriaturaColocadaEsteTurno = false;

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

    const canAfford = (card) => getCardCost(card) <= currentSummonerPointsOpponent;
    let actionTaken = false;

    // --- FASE DE JUEGO DE CARTAS ---
    // 1. Priorizar invocación de criaturas
    if (!opponentCriaturaColocadaEsteTurno) {
        // Encontrar la criatura de mayor ataque que pueda permitirse
        const playableCreatures = handOpponent.filter(card => card.categoria === 'criatura' && canAfford(card))
                                            .sort((a, b) => b.ataque - a.ataque);

        if (playableCreatures.length > 0) {
            let bestCreatureToPlay = null;
            let targetSlotForCreature = -1;

            // Intentar reemplazar una criatura más débil o un slot vacío
            for (let i = 0; i < creaturesOpponent.length; i++) {
                if (creaturesOpponent[i] === null) {
                    // Si hay un slot vacío, colocar la mejor criatura ahí
                    bestCreatureToPlay = playableCreatures[0];
                    targetSlotForCreature = i;
                    break;
                } else {
                    // Si el slot está ocupado, considerar reemplazar si la nueva es mejor
                    const currentCreature = creaturesOpponent[i];
                    for (const pc of playableCreatures) {
                        // Criterio de reemplazo: la nueva criatura tiene más ataque y/o defensa
                        if (pc.ataque > currentCreature.ataque || pc.defensa > currentCreature.defensa) {
                             if (!bestCreatureToPlay || pc.ataque > bestCreatureToPlay.ataque) { // Elegir la mejor entre las reemplazables
                                bestCreatureToPlay = pc;
                                targetSlotForCreature = i;
                            }
                        }
                    }
                }
            }

            if (bestCreatureToPlay && targetSlotForCreature !== -1) {
                payForCard(bestCreatureToPlay, true);
                // Si estamos reemplazando, descartar la criatura antigua y su equipo
                if (creaturesOpponent[targetSlotForCreature] !== null) {
                    showMessage(`El rival ha sacrificado a ${creaturesOpponent[targetSlotForCreature].nombre} para invocar a ${bestCreatureToPlay.nombre}.`);
                    equipSlotsOpponent[targetSlotForCreature] = null; // Quitar equipamiento
                } else {
                    showMessage(`El rival ha invocado a ${bestCreatureToPlay.nombre}.`);
                }
                creaturesOpponent[targetSlotForCreature] = handOpponent.splice(handOpponent.indexOf(bestCreatureToPlay), 1)[0];
                opponentCriaturaColocadaEsteTurno = true;
                forceUpdateAllCreatureStats();
                updateAll();
                actionTaken = true;
                await delay(1000);
            }
        }
    }

    if (checkGameOver()) return;
    if (!actionTaken) await delay(500); // Pequeña pausa si no se hizo nada

    // 2. Colocar Ambiente (si no hay uno o si hay uno mejor)
    const playableAmbiente = handOpponent.find(c => c.categoria === 'ambiente' && canAfford(c));
    if (playableAmbiente) {
        if (environmentOpponent === null) {
            payForCard(playableAmbiente, true);
            environmentOpponent = handOpponent.splice(handOpponent.indexOf(playableAmbiente), 1)[0];
            showMessage(`El rival ha jugado ${environmentOpponent.nombre}`);
            forceUpdateAllCreatureStats();
            updateAll();
            actionTaken = true;
            await delay(1000);
        } else {
            // Evaluar si reemplazar el ambiente actual
            // Criterio simple: si el nuevo ambiente ofrece un buff general más alto o el actual es un debuff
            const currentEnvEffects = environmentOpponent.efectos?.global || {};
            const newEnvEffects = playableAmbiente.efectos?.global || {};

            const currentBenefit = (currentEnvEffects.atk || 0) + (currentEnvEffects.def || 0);
            const newBenefit = (newEnvEffects.atk || 0) + (newEnvEffects.def || 0);

            // Reemplazar si el nuevo es estrictamente mejor o si el actual es negativo y el nuevo no lo es
            if (newBenefit > currentBenefit && !newEnvEffects.soloOponente) { // Asumiendo que la IA no juega ambientes que solo afecten al oponente si ya tiene uno beneficioso
                payForCard(playableAmbiente, true);
                showMessage(`El rival ha reemplazado ${environmentOpponent.nombre} con ${playableAmbiente.nombre}`);
                environmentOpponent = handOpponent.splice(handOpponent.indexOf(playableAmbiente), 1)[0];
                forceUpdateAllCreatureStats();
                updateAll();
                actionTaken = true;
                await delay(1000);
            }
        }
    }

    if (checkGameOver()) return;
    if (!actionTaken) await delay(500);

    // 3. Colocar Objetos Activos (si no hay uno o si hay uno mejor)
    // Solo si hay al menos una criatura en juego
    const hasCreaturesInPlay = creaturesOpponent.some(c => c !== null);
    if (hasCreaturesInPlay) {
        const playableActivo = handOpponent.find(c => c.categoria === 'activo' && canAfford(c));
        if (playableActivo) {
            let placed = false;
            // Intenta ocupar el slot izquierdo primero
            if (objectsOpponent.left === null) {
                payForCard(playableActivo, true);
                objectsOpponent.left = handOpponent.splice(handOpponent.indexOf(playableActivo), 1)[0];
                showMessage(`El rival ha jugado ${objectsOpponent.left.nombre} en el slot izquierdo.`);
                placed = true;
            } else if (objectsOpponent.right === null) {
                payForCard(playableActivo, true);
                objectsOpponent.right = handOpponent.splice(handOpponent.indexOf(playableActivo), 1)[0];
                showMessage(`El rival ha jugado ${objectsOpponent.right.nombre} en el slot derecho.`);
                placed = true;
            } else {
                // Si ambos slots están ocupados, considera reemplazar
                // Criterio: si el nuevo activo ofrece un buff general más alto
                const currentLeftBenefit = (objectsOpponent.left.efectos?.global?.atk || 0) + (objectsOpponent.left.efectos?.global?.def || 0);
                const currentRightBenefit = (objectsOpponent.right.efectos?.global?.atk || 0) + (objectsOpponent.right.efectos?.global?.def || 0);
                const newBenefit = (playableActivo.efectos?.global?.atk || 0) + (playableActivo.efectos?.global?.def || 0);

                if (newBenefit > currentLeftBenefit && newBenefit > currentRightBenefit && !playableActivo.efectos.soloOponente) {
                    // Reemplazar el objeto con menor beneficio
                    if (currentLeftBenefit <= currentRightBenefit) {
                        payForCard(playableActivo, true);
                        showMessage(`El rival ha reemplazado ${objectsOpponent.left.nombre} con ${playableActivo.nombre} en el slot izquierdo.`);
                        objectsOpponent.left = handOpponent.splice(handOpponent.indexOf(playableActivo), 1)[0];
                    } else {
                        payForCard(playableActivo, true);
                        showMessage(`El rival ha reemplazado ${objectsOpponent.right.nombre} con ${playableActivo.nombre} en el slot derecho.`);
                        objectsOpponent.right = handOpponent.splice(handOpponent.indexOf(playableActivo), 1)[0];
                    }
                    placed = true;
                }
            }
            if (placed) {
                forceUpdateAllCreatureStats();
                updateAll();
                actionTaken = true;
                await delay(1000);
            }
        }
    }

    if (checkGameOver()) return;
    if (!actionTaken) await delay(500);

    // 4. Equipar a Criaturas (si hay criaturas en juego y equipamientos)
    // Solo si hay al menos una criatura en juego
    if (hasCreaturesInPlay) {
        const playableEquip = handOpponent.find(c => c.categoria === 'equipamiento' && canAfford(c));
        if (playableEquip) {
            let bestTargetCreatureIndex = -1;
            let currentBestEquipValue = -Infinity; // Para decidir si reemplazar un equipo existente

            for (let i = 0; i < creaturesOpponent.length; i++) {
                if (creaturesOpponent[i]) { // Solo si hay una criatura para equipar
                    const currentEquip = equipSlotsOpponent[i];
                    const newEquipValue = (playableEquip.efectos?.atk || 0) + (playableEquip.efectos?.def || 0);

                    if (!currentEquip) {
                        // Si no hay equipamiento, este es un buen objetivo
                        if (newEquipValue > currentBestEquipValue) {
                            currentBestEquipValue = newEquipValue;
                            bestTargetCreatureIndex = i;
                        }
                    } else {
                        // Si ya hay equipamiento, considerar reemplazar si el nuevo es mejor
                        const currentEquipValue = (currentEquip.efectos?.atk || 0) + (currentEquip.efectos?.def || 0);
                        if (newEquipValue > currentEquipValue && newEquipValue > currentBestEquipValue) {
                            currentBestEquipValue = newEquipValue;
                            bestTargetCreatureIndex = i;
                        }
                    }
                }
            }

            if (bestTargetCreatureIndex !== -1) {
                payForCard(playableEquip, true);
                if (equipSlotsOpponent[bestTargetCreatureIndex]) {
                    showMessage(`El rival ha reemplazado el equipamiento de ${creaturesOpponent[bestTargetCreatureIndex].nombre} con ${playableEquip.nombre}.`);
                } else {
                    showMessage(`El rival ha equipado ${playableEquip.nombre} a ${creaturesOpponent[bestTargetCreatureIndex].nombre}.`);
                }
                equipSlotsOpponent[bestTargetCreatureIndex] = handOpponent.splice(handOpponent.indexOf(playableEquip), 1)[0];
                forceUpdateAllCreatureStats();
                updateAll();
                actionTaken = true;
                await delay(1000);
            }
        }
    }

    // --- FASE DE DEFENSA ---
    if (checkGameOver()) return;
    await delay(1000);
    const validDefenders = creaturesOpponent
        .map((card, index) => ({ card, index }))
        .filter(({ card, index }) =>
            card &&
            getEffectiveCreatureStats(index, true).def > 0
        );

    if (validDefenders.length > 0) {
        // Elegir al defensor con mayor DEF
        validDefenders.sort((a, b) => getEffectiveCreatureStats(b.index, true).def - getEffectiveCreatureStats(a.index, true).def);
        defenderOpponent = validDefenders[0].index;
        showMessage(`El rival ha elegido a ${creaturesOpponent[defenderOpponent].nombre} como defensor.`);
        updateAll();
    } else {
        defenderOpponent = null;
    }

    if (checkGameOver()) return;
    await delay(1500);
    showMessage("El rival inicia su fase de ataque.");

    // --- FASE DE ATAQUE ---
    const attackers = creaturesOpponent
        .map((card, index) => ({ card, index }))
        .filter(({ card, index }) => {
            if (!card) return false;
            const stats = getEffectiveCreatureStats(index, true);
            return stats.atk > 0 && index !== defenderOpponent; // No atacar con el defensor
        })
        .sort((a, b) => getEffectiveCreatureStats(b.index, true).atk - getEffectiveCreatureStats(a.index, true).atk); // Atacar con el más fuerte primero

    for (const attacker of attackers) {
        await delay(1500);
        if (checkGameOver()) return;

        const hasPlayerDefender = defender !== null && creatures[defender] !== null && getEffectiveCreatureStats(defender, false).def > 0;

        if (hasPlayerDefender) {
            await executeAIAttack(attacker.index, defender);
        } else {
            showMessage(`¡Ataque directo del rival!`);
            await executeAIAttack(attacker.index, null);
        }
    }
    if (checkGameOver()) return;
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
        // REMOVIDO: document.getElementById("modal").classList.add("hidden");
        document.getElementById("modal-bg").classList.remove("hidden");
        document.getElementById("modal").classList.remove("hidden"); // Asegurar que el modal se muestre
        return true;
    }
    return false;
}

function getCardCost(card) {
    if (!card || !card.nivel) return 0;
    return Math.max(0, card.nivel - 1);
}

function getEffectiveCreatureStats(index, isOpponentCreature = false) {
    const creaturesArray = isOpponentCreature ? creaturesOpponent : creatures;
    const creature = creaturesArray[index];
    if (!creature) return null;

    let effectiveAtk = creature.ataque;
    let effectiveDef = creature.defensa;

    // Determinar qué conjuntos de objetos y ambiente son "nuestros" y cuáles son "del oponente"
    // en relación con la criatura que estamos evaluando.
    const myEquip = isOpponentCreature ? equipSlotsOpponent[index] : equipSlots[index];
    const myObjects = isOpponentCreature ? objectsOpponent : objects;
    const myEnv = isOpponentCreature ? environmentOpponent : environment;

    const oppObjects = isOpponentCreature ? objects : objectsOpponent;
    const oppEnv = isOpponentCreature ? environment : environmentOpponent;

    // Equipamiento propio de la criatura
    if (myEquip?.efectos) {
        effectiveAtk += myEquip.efectos.atk || 0;
        effectiveDef += myEquip.efectos.def || 0;
    }

    // Efectos globales propios (Objetos y Ambiente)
    // Aplican si NO tienen la propiedad soloOponente o si la tienen en false
    Object.values(myObjects).forEach(obj => {
        if (obj?.efectos?.global && !obj.efectos.soloOponente) { // Solo si no es 'soloOponente'
            effectiveAtk += obj.efectos.atk || 0;
            effectiveDef += obj.efectos.def || 0;
        }
    });

    if (myEnv?.efectos?.global && !myEnv.efectos.soloOponente) { // Solo si no es 'soloOponente'
        effectiveAtk += myEnv.efectos.atk || 0;
        effectiveDef += myEnv.efectos.def || 0;
    }

    // Efectos globales del oponente que te afectan a ti (Objetos y Ambiente)
    // Aplican si tienen la propiedad soloOponente en true
    Object.values(oppObjects).forEach(obj => {
        if (obj?.efectos?.global && obj.efectos.soloOponente) { // Solo si es 'soloOponente'
            effectiveAtk += obj.efectos.atk || 0;
            effectiveDef += obj.efectos.def || 0;
        }
    });

    if (oppEnv?.efectos?.global && oppEnv.efectos.soloOponente) { // Solo si es 'soloOponente'
        effectiveAtk += oppEnv.efectos.atk || 0;
        effectiveDef += oppEnv.efectos.def || 0;
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

    const cost = getCardCost(card);
    const costHtml = `<div class="card-cost">${cost}</div>`;

    let statsHtml = "";
    if (card.ataque !== undefined && card.defensa !== undefined) {
        let atkDisplay = effectiveStats ? effectiveStats.atk : card.ataque;
        let defDisplay = (card.currentDef !== undefined ? card.currentDef : (effectiveStats ? effectiveStats.def : card.defensa));
        const atkClass = effectiveStats && effectiveStats.atk > card.ataque ? 'stat-buff' : (effectiveStats && effectiveStats.atk < card.ataque ? 'stat-debuff' : '');
        let defClass = "";
        if (card.currentDef !== undefined && effectiveStats && card.currentDef < effectiveStats.def) {
            defClass = "stat-damaged"; // Si currentDef es menor que la defensa total efectiva, está dañado
        } else if (effectiveStats && effectiveStats.def > card.defensa) {
            defClass = "stat-buff"; // Si la defensa efectiva es mayor que la base, es un buff
        } else if (effectiveStats && effectiveStats.def < card.defensa) {
            defClass = "stat-debuff"; // Si la defensa efectiva es menor que la base, es un debuff
        }
        statsHtml = `<div class="stats">ATK: <span class="${atkClass}">${atkDisplay}</span> / DEF: <span class="${defClass}">${defDisplay}</span></div>`;
    }

    const icons = card.categoria === "equipamiento" ? '<span class="equip-icon">🗡️</span>' : (card.categoria === "activo" ? '<span class="active-icon">💠</span>' : '');

    // Contenido principal de la carta
    const cardContentHtml = `
        <div class="card-content">
            <div class="name">${card.nombre || 'Sin Nombre'}</div>
            ${statsHtml}
            <div class="desc">${card.descripcion || ''}</div>
        </div>
        ${icons}
    `;

    el.innerHTML = costHtml + cardContentHtml;

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

        // Esta es la parte crucial: solo permitimos el drop si es el turno del jugador y la fase principal
        // y dejamos que la función 'onDrop' específica para cada slot maneje la lógica detallada (coste, tipo de carta, etc.)
        if (activePlayer === 'player' && playerPhase === 'main') {
            onDrop(e);
        } else {
            // Si no se cumplen las condiciones, se limpia el estado de arrastre
            draggedCard = null;
            placingCard = null;
            updateAll();
        }
    });
}

function renderHand() {
    const handDiv = document.getElementById("hand");
    handDiv.innerHTML = "";
    const numCards = hand.length;

    hand.forEach((card, idx) => {
        const c = createCardDiv(card);
        // La clase disabled solo afecta la apariencia, no el draggable
        const canAfford = getCardCost(card) <= currentSummonerPoints;
        if (!canAfford || playerPhase !== 'main') {
             c.classList.add("disabled");
        }

        c.draggable = true; // Siempre draggable para permitir el sacrificio/reemplazo

        const angleIncrement = 5;
        const yOffset = 1.5;
        const rotationAngle = (idx - Math.floor(numCards / 2)) * angleIncrement;
        const cardY = Math.abs(idx - Math.floor(numCards / 2)) * yOffset;
        c.style.transform = `translateY(${cardY}rem) rotate(${rotationAngle}deg)`;
        c.style.zIndex = idx;
        c.style.left = `calc(50% - 5rem + ${(idx - (numCards -1) / 2) * 4}rem)`;

        c.addEventListener("dragstart", e => {
            if (activePlayer !== 'player' || playerPhase !== 'main') { // Solo puede arrastrar en su turno y fase principal
                e.preventDefault();
                return;
            }
            draggedCard = card;
            e.dataTransfer.setData("type", "fromHand");
            e.dataTransfer.setData("handIndex", String(idx));

            setTimeout(() => { c.style.visibility = "hidden"; }, 0);
        });
        c.addEventListener("dragend", () => {
            draggedCard = null;
            c.style.visibility = "visible";
            updateAll(); // Necesario para limpiar resaltados
        });
        c.onclick = () => {
            // El click en la mano solo activa el modo de colocación en la fase principal
            if (activePlayer === 'player' && playerPhase === 'main') {
                startPlacingCard(idx);
            }
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
        creatureSlot.classList.remove("valid", "is-target-sacrifice");

        // DRAG & DROP DE EQUIPAMIENTO
        const onDropEquipment = e => {
    if (playerPhase !== 'main') {
        showMessage("Solo puedes equipar en la fase principal.");
        return;
    }
    const type = e.dataTransfer.getData("type");
    // Opción A: viene de la mano (equipamiento nuevo)
    if (draggedCard && draggedCard.categoria === 'equipamiento' && type === "fromHand") {
        const handIndex = hand.indexOf(draggedCard);
        if (handIndex !== -1) {
            if (creatures[i]) { // Solo equipar si hay una criatura en el slot
                tryEquipCreature(handIndex, i);
            } else {
                showMessage("No hay criatura en este slot para equipar.");
            }
        }
    }
    // Opción B: viene de otro slot de equipamiento
    else if (type === "fromEquipSlot") {
        const sourceIndex = parseInt(e.dataTransfer.getData("sourceIndex"), 10);
        if (sourceIndex !== i) {
            if (creatures[i]) { // Solo mover si hay una criatura en el slot de destino
                moveEquipment(sourceIndex, i);
            } else {
                showMessage("No hay criatura en el slot de destino para mover el equipamiento.");
            }
        }
    }
};


      
    const isCreatureSlotAvailable = (e) => {
    if (playerPhase !== 'main') return false;
    // Usa draggedCard para drag&drop, y placingCard para click
    const draggedIsCreature = draggedCard?.categoria === "criatura";
    const placingIsCreature = placingCard?.card.categoria === "criatura";
    return draggedIsCreature || placingIsCreature;
};



    const isEquipSlotAvailable = (e) => {
    if (playerPhase !== 'main') return false;
    // Permite equipar si arrastras una carta de tipo equipamiento y hay criatura
    const draggedIsEquip = draggedCard?.categoria === "equipamiento" && creatures[i];
    const fromEquip = e.dataTransfer.getData("type") === "fromEquipSlot";
    const placingIsEquip = placingCard?.card.categoria === "equipamiento" && creatures[i];
    return draggedIsEquip || fromEquip || placingIsEquip;
};


        // SETUP ZONAS DE DROP (SOLO EN FASE PRINCIPAL)
        if (playerPhase === 'main') {
            setupDropZone(creatureSlot, (e) => {
    // Permite criaturas O equipamientos en el slot de criatura
    return isCreatureSlotAvailable(e) || isEquipSlotAvailable(e);
}, e => {
    // Si es criatura, coloca criatura
    if (isCreatureSlotAvailable(e)) {
    const handIndex = parseInt(e.dataTransfer.getData("handIndex"), 10);
    const cardToPlace = hand[handIndex];

    if (!cardToPlace || cardToPlace.categoria !== "criatura") {
        showMessage("Solo puedes colocar criaturas en estos slots.");
        return;
    }

    const slotEstaOcupado = creatures[i] !== null;
    const hayHuecoLibre = creatures.some(c => c === null);

    if (slotEstaOcupado) {
        // Siempre permitir sacrificio si el slot está ocupado
        showSacrificeCreatureModal(handIndex, i);
    } else if (!hayHuecoLibre) {
        // Si todos los slots están ocupados (ningún hueco libre), forzar sacrificio (permitiendo elegir a quién sustituir)
        showSacrificeCreatureModal(handIndex, i);
    } else {
        // Si hay hueco libre y estoy arrastrando a uno, colocar directamente
        if (getCardCost(cardToPlace) <= currentSummonerPoints) {
            placeCardOnCreature(handIndex, i);
        } else {
            showMessage("No tienes suficientes Puntos de Invocador.");
        }
    }
}
    // Si es equipamiento, equipa
    if (isEquipSlotAvailable(e)) {
        onDropEquipment(e);
        return;
    }
});

// El slot visual de equipamiento se mantiene para mover equipamiento entre criaturas
setupDropZone(equipSlot, isEquipSlotAvailable, onDropEquipment);
        }

        if (creatures[i]) {
            const c = createCardDiv(creatures[i], getEffectiveCreatureStats(i, false));
            if (defender === i) { c.classList.add("is-defender"); }

            if (playerPhase === 'defend') {
                c.onclick = () => assignDefender(i);
            } else if (playerPhase === 'attack') {
                 if (playerCreaturesAttacked[i] || defender === i) {
                    c.classList.add("disabled");
                    c.onclick = null;
                }
                if (attackingCreatureIndex === i) {
                    c.classList.add("is-attacking");
                }
                c.onclick = () => initiateAttack(i);
            } else {
                 c.onclick = () => {
                     if (placingCard) {
                         if (placingCard.card.categoria === "criatura") {
                             showSacrificeCreatureModal(placingCard.index, i);
                         } else if (placingCard.card.categoria === "equipamiento") {
                             tryEquipCreature(placingCard.index, i);
                         }
                     }
                 };
            }
            creatureSlot.appendChild(c);
        } else { // Slot vacío
            if (playerPhase === 'main' && placingCard?.card.categoria === "criatura" && !criaturaColocadaEsteTurno) {
                if (getCardCost(placingCard.card) <= currentSummonerPoints) {
                    creatureSlot.classList.add("valid");
                    creatureSlot.onclick = () => placeCardOnCreature(placingCard.index, i);
                }
            }
        }

        if (equipSlots[i]) {
            creatureZone.classList.add("has-equipment");
            const c = createCardDiv(equipSlots[i]);
            if (playerPhase === 'main') {
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
                    updateAll();
                });
                c.onclick = () => {
                    if (placingCard && placingCard.card.categoria === "equipamiento") {
                        tryEquipCreature(placingCard.index, i);
                    }
                }
            } else {
                c.onclick = e => e.stopPropagation();
            }
            equipSlot.appendChild(c);
        } else if (playerPhase === 'main' && placingCard?.card.categoria === "equipamiento") {
            if (creatures[i]) {
                equipSlot.classList.add("valid");
                equipSlot.onclick = () => tryEquipCreature(placingCard.index, i);
            }
        }
    }
}

// ... (código existente) ...

function renderObjects() {
    ["left", "right"].forEach(side => {
        const slot = document.querySelector(`#zones .object-slot[data-side="${side}"]`);
        slot.innerHTML = "";
        slot.className = "object-slot"; // Reset class
        slot.onclick = null;

        const isObjectSlotAvailable = () => playerPhase === 'main' && (placingCard?.card.categoria === "activo" || draggedCard?.categoria === "activo");

        if(playerPhase === 'main') {
            setupDropZone(slot, isObjectSlotAvailable, e => {
                const handIndex = parseInt(e.dataTransfer.getData("handIndex"), 10);
                tryPlaceObject(handIndex, side);
            });

            if (isObjectSlotAvailable()) {
                // Solo resaltar si es un activo
                if (placingCard?.card.categoria === "activo") {
                    // Resaltar si el slot está vacío y tenemos SP, o si está ocupado (para reemplazar)
                    if (objects[side] || getCardCost(placingCard.card) <= currentSummonerPoints) {
                        slot.classList.add("valid");
                        slot.onclick = () => tryPlaceObject(placingCard.index, side);
                    }
                }
            }
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
    slot.className = "environment-slot"; // Reset class
    slot.onclick = null;

    const isEnvSlotAvailable = () => playerPhase === 'main' && (placingCard?.card.categoria === "ambiente" || draggedCard?.categoria === "ambiente");

    if (playerPhase === 'main') {
        setupDropZone(slot, isEnvSlotAvailable, e => {
            const handIndex = parseInt(e.dataTransfer.getData("handIndex"), 10);
            const cardToPlace = hand[handIndex];
            if (!cardToPlace || cardToPlace.categoria !== "ambiente") {
                showMessage("Solo puedes colocar cartas de ambiente aquí.");
                return;
            }
            placeCardOnEnvironment(handIndex);
        });

        if (isEnvSlotAvailable()) {
            // Solo resaltar si es ambiente
            if (placingCard?.card.categoria === "ambiente") {
                // Resaltar si el slot está vacío y tenemos SP, o si está ocupado (para reemplazar)
                if (environment || getCardCost(placingCard.card) <= currentSummonerPoints) {
                    slot.classList.add("valid");
                    slot.onclick = () => placeCardOnEnvironment(placingCard.index);
                }
            }
        }
    }


    if (environment) {
        const c = createCardDiv(environment);
        slot.appendChild(c);
    }
}

function renderCreaturesOpponent() {
    for (let i = 0; i < 3; i++) {
        const creatureZone = document.querySelector(`#creature-board-opponent .creature-zone:nth-child(${i + 1})`); // Obtener la zona completa
        const creatureSlot = creatureZone.querySelector('.creature-slot');
        const equipSlot = creatureZone.querySelector('.equip-slot'); // Obtener el slot de equipamiento

        creatureSlot.innerHTML = "";
        creatureSlot.classList.remove("valid-attack-target");
        creatureSlot.onclick = null;
        equipSlot.innerHTML = ""; // Limpiar el slot de equipamiento del oponente
        creatureZone.classList.remove("has-equipment"); // Quitar la clase si no tiene equipamiento

        if (creaturesOpponent[i]) {
            const stats = getEffectiveCreatureStats(i, true);
            const c = createCardDiv(creaturesOpponent[i], stats);
            if (defenderOpponent === i) {
                c.classList.add("is-defender");
            }

            // LÓGICA DE OBJETIVO VÁLIDO
            if (attackingCreatureIndex !== null) {
                // Si el defensor es el objetivo, solo él puede ser atacado
                if (defenderOpponent !== null) {
                    if (defenderOpponent === i) {
                        creatureSlot.classList.add("valid-attack-target");
                        creatureSlot.onclick = () => executeAttack(i);
                    }
                } else {
                    // Si no hay defensor, cualquier criatura es un objetivo válido
                    creatureSlot.classList.add("valid-attack-target");
                    creatureSlot.onclick = () => executeAttack(i);
                }
            }

            creatureSlot.appendChild(c);

            // Mostrar el equipamiento del oponente si existe
            if (equipSlotsOpponent[i]) {
                creatureZone.classList.add("has-equipment"); // Añadir clase para mostrar el icono
                const equipCard = createCardDiv(equipSlotsOpponent[i]);
                // Las cartas de equipamiento del oponente no deben ser interactivas ni rotar
                equipCard.style.transform = 'rotate(0deg)'; // Asegura que la carta de equipamiento no rote
                equipCard.style.pointerEvents = 'none'; // Deshabilita cualquier interacción
                equipSlot.appendChild(equipCard);
            }
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

    const opponentLifeArea = document.getElementById('life-area-opponent');
    opponentLifeArea.classList.remove("valid-attack-target");
    opponentLifeArea.onclick = null;

    const hasOpponentDefender = defenderOpponent !== null && creaturesOpponent[defenderOpponent] !== null;

    if (attackingCreatureIndex !== null && !hasOpponentDefender) {
        opponentLifeArea.classList.add("valid-attack-target");
        opponentLifeArea.onclick = () => executeAttack(null); // null target = ataque directo
    }

    checkGameOver();
}

function startPlacingCard(idx) {
    if (activePlayer !== 'player' || playerPhase !== 'main') return;
    const card = hand[idx];

    if (placingCard && placingCard.index === idx) {
        placingCard = null; // Deseleccionar
    } else {
        placingCard = { card: card, index: idx };
    }
    updateAll();
}

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
    if (!card || card.categoria !== "criatura") return;

    if (criaturaColocadaEsteTurno && creatures[sIdx] === null) {
        showMessage("Solo puedes colocar una criatura por turno (excepto por sacrificio/reemplazo).");
        placingCard = null;
        draggedCard = null;
        updateAll();
        return;
    }

    // Pagar si el slot está vacío (no es un sacrificio)
    if (creatures[sIdx] === null) {
        if (getCardCost(card) > currentSummonerPoints) {
            showMessage("No tienes suficientes Puntos de Invocador para colocar esta criatura.");
            placingCard = null;
            draggedCard = null;
            updateAll();
            return;
        }
        payForCard(card, false);
        showMessage("¡Criatura colocada!");
    } else {
        // Esto solo debería llamarse si ya se activó el modal de sacrificio
        showMessage("¡Criatura reemplazada!");
    }

    creatures[sIdx] = card;
    hand.splice(hIdx, 1);
    criaturaColocadaEsteTurno = true;
    placingCard = null;
    draggedCard = null;
    forceUpdateAllCreatureStats();
    updateAll();
}

function tryEquipCreature(hIdx, sIdx) {
    const card = hand[hIdx];
    if (!card || card.categoria !== 'equipamiento') return;

    const onPlace = () => {
        if (!equipSlots[sIdx]) { // Si el slot estaba vacío, pagar el coste
            payForCard(card, false);
            showMessage("¡Equipamiento equipado!");
        } else {
            showMessage("¡Equipamiento reemplazado!");
        }
        equipSlots[sIdx] = card;
        hand.splice(hIdx, 1);
        placingCard = null;
        draggedCard = null;
        forceUpdateAllCreatureStats();
        updateAll();
    };

    if (!equipSlots[sIdx] && getCardCost(card) > currentSummonerPoints) {
        showMessage("No tienes suficientes Puntos de Invocador.");
        placingCard = null;
        draggedCard = null;
        updateAll();
        return;
    }

    if (equipSlots[sIdx]) {
        showReplaceModal(onPlace, "equipamiento");
    } else {
        onPlace();
    }
}

function tryPlaceObject(hIdx, side) {
    const card = hand[hIdx];
    if (!card || card.categoria !== 'activo') return;

    const onPlace = () => {
        if (!objects[side]) { // Si el slot estaba vacío, pagar el coste
            payForCard(card, false);
            showMessage("¡Objeto activo colocado!");
        } else {
            showMessage("¡Objeto reemplazado!");
        }
        objects[side] = card;
        hand.splice(hIdx, 1);
        placingCard = null;
        draggedCard = null;
        forceUpdateAllCreatureStats();
        updateAll();
    };

    if (!objects[side] && getCardCost(card) > currentSummonerPoints) {
        showMessage("No tienes suficientes Puntos de Invocador.");
        placingCard = null;
        draggedCard = null;
        updateAll();
        return;
    }

    if (objects[side] !== null) {
        showReplaceModal(onPlace, "objeto");
    } else {
        onPlace();
    }
}

function moveEquipment(fromIdx, toIdx) {
    const card = equipSlots[fromIdx];
    if (!card) return; // No hay carta para mover

    const onPlace = () => {
        equipSlots[fromIdx] = null;
        equipSlots[toIdx] = card;
        showMessage("¡Equipamiento movido!");
        forceUpdateAllCreatureStats();
        updateAll();
    };

    if (equipSlots[toIdx]) {
        showReplaceModal(onPlace, "equipamiento");
    } else {
        onPlace();
    }
}

function placeCardOnEnvironment(hIdx) {
    const card = hand[hIdx];
    if (!card || card.categoria !== 'ambiente') return;

    const onPlace = () => {
        if (!environment) { // Si el slot estaba vacío, pagar el coste
            payForCard(card, false);
            showMessage("¡Ambiente activado!");
        } else {
            showMessage("¡Ambiente reemplazado!");
        }
        environment = card;
        hand.splice(hIdx, 1);
        placingCard = null;
        draggedCard = null;
        forceUpdateAllCreatureStats();
        updateAll();
    };

    if (!environment && getCardCost(card) > currentSummonerPoints) {
        showMessage("No tienes suficientes Puntos de Invocador.");
        placingCard = null;
        draggedCard = null;
        updateAll();
        return;
    }

    if (environment) {
        showReplaceModal(onPlace, "ambiente");
    } else {
        onPlace();
    }
}
function assignDefender(idx) {
    const stats = getEffectiveCreatureStats(idx, false);
    if (!stats || stats.def <= 0) {
        showMessage("No puedes seleccionar esta criatura como defensor porque su DEF total es 0.");
        return;
    }
    if (playerPhase !== 'defend') return;

    if (defender === idx) {
        defender = null;
        showMessage("Has quitado el defensor.");
    } else {
        defender = idx;
        showMessage(`${creatures[idx].nombre} es ahora tu defensor.`);
    }
    updateAll();
}

function showReplaceModal(okCb, type = "equipamiento") {
    const modalBg = document.getElementById("modal-bg"),
        modal = document.getElementById("modal");
    modalBg.classList.remove("hidden");
    modal.classList.remove("hidden");
    document.getElementById("modal-content").innerHTML = `Esta casilla ya tiene un ${type}. ¿Quieres reemplazarlo?`;
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
        draggedCard = null; // Limpiar draggedCard también al cancelar
        updateAll();
    };
}

function showSacrificeCreatureModal(handIdx, targetSlotIdx) {
    const modalBg = document.getElementById("modal-bg");
    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modal-content");
    const newCreature = hand[handIdx];
    const targetCreature = creatures[targetSlotIdx];

    let selectedSacrifices = [];
    let currentSacrificeLevel = 0;

    modalBg.classList.remove("hidden");
    modal.classList.remove("hidden");
    document.getElementById("modal-cancel").classList.remove("hidden"); // Asegurarse de que el botón cancelar esté visible

    // Añadir automáticamente la criatura del slot objetivo a los sacrificios
    if (targetCreature) {
        selectedSacrifices.push(targetSlotIdx);
        currentSacrificeLevel += targetCreature.nivel;
    }

    function updateModalContent() {
        let sacrificeListHtml = "";
        if (selectedSacrifices.length > 0) {
            sacrificeListHtml = `
                <p>Criaturas seleccionadas para sacrificar:</p>
                <ul>
                    ${selectedSacrifices.map(idx => `<li>${creatures[idx].nombre} (Nivel: ${creatures[idx].nivel})</li>`).join('')}
                </ul>
            `;
        }

        modalContent.innerHTML = `
            <h2>Invocar Criatura (Sacrificio)</h2>
            <p>Estás intentando invocar a <strong>${newCreature.nombre} (Nivel: ${newCreature.nivel})</strong>.</p>
            <p>Debes sacrificar criaturas con un nivel **total de al menos ${newCreature.nivel}**.</p>
            <p>Nivel de sacrificio actual: <strong>${currentSacrificeLevel}</strong> / ${newCreature.nivel}</p>
            ${sacrificeListHtml}
            <p>Haz clic en las criaturas en tu tablero para seleccionar/deseleccionar como sacrificio adicional.</p>
            <p style="font-style: italic; font-size: 0.9em;">(La criatura en el slot que vas a ocupar ya está seleccionada para el sacrificio)</p>
        `;

        document.getElementById("modal-ok").textContent = "Confirmar Sacrificio";
        document.getElementById("modal-ok").disabled = currentSacrificeLevel < newCreature.nivel;
    }

    // Guardar referencias a los divs de cartas en los slots de criatura para manipular clases
    const creatureCardDivs = [];
    document.querySelectorAll('#creature-board .creature-slot').forEach((slot, idx) => {
        const cardDiv = slot.querySelector('.card');
        if (cardDiv) {
            creatureCardDivs.push({ div: cardDiv, index: idx });
            // Eliminar listeners previos para evitar duplicados
            cardDiv.onclick = null;
            cardDiv.removeEventListener('click', handleCreatureSelectionClick); // Remover listener nombrado
            cardDiv.classList.remove('is-sacrificing', 'is-target-sacrifice'); // Limpiar clases
        }
    });

    // Función manejadora de clic nombrada para poder removerla
    function handleCreatureSelectionClick(event) {
        const clickedCardDiv = event.currentTarget;
        const clickedSlot = clickedCardDiv.closest('.creature-slot');
        const clickedIndex = parseInt(clickedSlot.dataset.slot, 10);

        if (!creatures[clickedIndex] || clickedIndex === targetSlotIdx) {
            // No permitir seleccionar el slot vacío o el slot de destino ya seleccionado
            return;
        }

        const creature = creatures[clickedIndex];
        const indexInSelected = selectedSacrifices.indexOf(clickedIndex);

        if (indexInSelected > -1) {
            selectedSacrifices.splice(indexInSelected, 1);
            currentSacrificeLevel -= creature.nivel;
            clickedCardDiv.classList.remove('is-sacrificing');
        } else {
            selectedSacrifices.push(clickedIndex);
            currentSacrificeLevel += creature.nivel;
            clickedCardDiv.classList.add('is-sacrificing');
        }
        updateModalContent();
    }

    // Añadir listeners para la selección de sacrificio
    creatureCardDivs.forEach(({ div: cardDiv, index: idx }) => {
        if (creatures[idx]) { // Solo si hay una criatura en el slot
            if (idx === targetSlotIdx) {
                cardDiv.classList.add('is-target-sacrifice'); // Resaltar la criatura en el slot objetivo
                // No añadir listener de clic a la criatura del slot objetivo, ya está seleccionada por defecto.
            } else {
                cardDiv.classList.remove('is-target-sacrifice');
                cardDiv.addEventListener('click', handleCreatureSelectionClick);
                if (selectedSacrifices.includes(idx)) { // Mantener resaltado si ya estaba seleccionado
                    cardDiv.classList.add('is-sacrificing');
                }
            }
        }
    });


    updateModalContent(); // Renderizar el contenido inicial

    document.getElementById("modal-ok").onclick = () => {
        modalBg.classList.add("hidden");
        modal.classList.add("hidden");
        // Limpiar listeners y clases después de usar el modal
        document.querySelectorAll('#creature-board .creature-slot .card').forEach(cardDiv => {
            if (cardDiv) {
                cardDiv.removeEventListener('click', handleCreatureSelectionClick);
                cardDiv.classList.remove('is-sacrificing', 'is-target-sacrifice');
            }
        });
        sacrificarYCambiarCriatura(handIdx, selectedSacrifices, targetSlotIdx);
    };

    document.getElementById("modal-cancel").onclick = () => {
        modalBg.classList.add("hidden");
        modal.classList.add("hidden");
        placingCard = null;
        draggedCard = null;
        // Limpiar listeners y clases después de cancelar
        document.querySelectorAll('#creature-board .creature-slot .card').forEach(cardDiv => {
            if (cardDiv) {
                cardDiv.removeEventListener('click', handleCreatureSelectionClick);
                cardDiv.classList.remove('is-sacrificing', 'is-target-sacrifice');
            }
        });
        updateAll(); // Refrescar el tablero
    };
}


/**
 * Permite sacrificar criaturas en juego para colocar una criatura de la mano cuyo coste sea mayor que el hueco disponible.
 * @param {number} handIdx - Índice de la carta de la mano a colocar.
 * @param {number[]} slotsASacrificar - Array de índices de slots de criaturas a sacrificar.
 * @param {number} targetSlotIdx - El índice del slot donde se colocará la nueva criatura.
 */
function sacrificarYCambiarCriatura(handIdx, slotsASacrificar, targetSlotIdx) {
    const cartaNueva = hand[handIdx];
    const costeNecesario = Math.max(0, cartaNueva.nivel - 1); // Coste de sacrificio es nivel - 1

    let sumaNiveles = 0;
    slotsASacrificar.forEach(idx => {
        if (creatures[idx]) sumaNiveles += creatures[idx].nivel;
    });

    if (sumaNiveles < costeNecesario) {
        showMessage(`Error: No se ha alcanzado el nivel de sacrificio. Necesitas ${costeNecesario}, tienes ${sumaNiveles}.`);
        placingCard = null;
        draggedCard = null;
        updateAll();
        return;
    }

    // Sacrificar criaturas seleccionadas
    slotsASacrificar.forEach(idx => {
        creatures[idx] = null;
        equipSlots[idx] = null;
        if(defender === idx) defender = null; // Si era defensor, remover
    });

    payForCard(cartaNueva, false); // La criatura se paga al final
    creatures[targetSlotIdx] = cartaNueva; // Colocar la nueva criatura en el slot de destino
    hand.splice(handIdx, 1);
    criaturaColocadaEsteTurno = true;
    placingCard = null;
    draggedCard = null;
    showMessage("¡Has invocado una criatura sacrificando otras!");
    forceUpdateAllCreatureStats();
    updateAll();
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
    playerPhase = 'main';
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

// FUNCIONES ADICIONALES (renderSummonerPoints, renderDeck, renderTurnBar, showMessage, music, attack functions, etc.)

function renderSummonerPoints() {
    document.getElementById("sp-display").textContent = `${currentSummonerPoints} / ${MAX_SP_CAP}`;
    document.getElementById("sp-display-opponent").textContent = `${currentSummonerPointsOpponent} / ${MAX_SP_CAP}`;
}

function renderDeck() {
    document.getElementById("deck-count").textContent = deck.length;
    document.getElementById("deck-count-opponent").textContent = deckOpponent.length;

    // Deshabilitar el mazo si no es el turno del jugador o no está en la fase principal
    const deckElement = document.getElementById("deck");
    if (activePlayer !== 'player' || playerPhase !== 'main') {
        deckElement.classList.add("disabled");
    } else {
        deckElement.classList.remove("disabled");
    }
}

let messageTimeout;
function showMessage(msg) {
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = msg;
    messageDiv.classList.remove("hidden");
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        messageDiv.classList.add("hidden");
    }, 3000);
}


// --- LÓGICA DE COMBATE ---

function initiateAttack(attackerIndex) {
    if (activePlayer !== 'player' || playerPhase !== 'attack') {
        showMessage("Solo puedes atacar en la fase de ataque.");
        return;
    }
    if (playerCreaturesAttacked[attackerIndex]) {
        showMessage("Esta criatura ya atacó este turno.");
        return;
    }
    if (defender === attackerIndex) {
        showMessage("El defensor no puede atacar.");
        return;
    }
    const attackerStats = getEffectiveCreatureStats(attackerIndex, false);
    if (attackerStats.atk <= 0) {
        showMessage("Esta criatura no puede atacar (ATK 0).");
        return;
    }

    // --- ESTO ES LO QUE TE FALTA ---
    attackingCreatureIndex = attackerIndex;

    // --- FLECHA DE ATAQUE: activar ---
    const attackerDiv = document.querySelector(`#creature-board .creature-zone:nth-child(${attackerIndex + 1}) .creature-slot .card`);
    if (attackerDiv) {
        const rect = attackerDiv.getBoundingClientRect();
        arrowOrigin = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        arrowTarget = { ...arrowOrigin };
        arrowActive = true;
        drawAttackArrow();
        window.addEventListener('mousemove', updateArrowTarget);
        window.addEventListener('keydown', onKeyDownAttackArrow);
        window.addEventListener('mousedown', onMouseDownAttackArrow);
    }
    showMessage(`Selecciona un objetivo para ${creatures[attackerIndex].nombre}. (ESC/clic fuera para cancelar)`);
    updateAll();
}


function updateArrowTarget(e) {
    if (!arrowActive) return;
    arrowTarget = { x: e.clientX, y: e.clientY };
    drawAttackArrow();
}

function executeAttack(targetIndex) {
    if (attackingCreatureIndex === null) {
        showMessage("Primero selecciona una criatura para atacar.");
        return;
    }

    const attackerCard = creatures[attackingCreatureIndex];
    if (!attackerCard) { // Si la criatura atacante ha sido eliminada por algún efecto
        attackingCreatureIndex = null;
        updateAll();
        return;
    }
    const attackerStats = getEffectiveCreatureStats(attackingCreatureIndex, false);

    if (targetIndex !== null) { // Atacar a una criatura
        const targetCard = creaturesOpponent[targetIndex];
        if (!targetCard) { // Si el objetivo ya no existe
            showMessage("El objetivo ya no está presente.");
            attackingCreatureIndex = null;
            updateAll();
            return;
        }

        const targetStats = getEffectiveCreatureStats(targetIndex, true);
        
        // Verificar si el objetivo es el defensor y es el único atacable
        if (defenderOpponent !== null && targetIndex !== defenderOpponent) {
            showMessage("Debes atacar al defensor del oponente.");
            return;
        }

        let damageToTarget = attackerStats.atk;
        targetCard.currentDef -= damageToTarget; // Aplicar daño a la defensa actual

        showMessage(`${attackerCard.nombre} ataca a ${targetCard.nombre} haciendo ${damageToTarget} de daño.`);

        if (targetCard.currentDef <= 0) {
            creaturesOpponent[targetIndex] = null;
            equipSlotsOpponent[targetIndex] = null; // Eliminar equipo
            if (defenderOpponent === targetIndex) {
                defenderOpponent = null; // Si el defensor es destruido, se elimina
            }
            showMessage(`${targetCard.nombre} ha sido derrotado.`);
        }
    } else { // Ataque directo a la vida del oponente
        if (defenderOpponent !== null && creaturesOpponent[defenderOpponent] !== null) {
            showMessage("Debes atacar al defensor del oponente primero.");
            return;
        }
        let damageToLife = attackerStats.atk;
        opponentLife -= damageToLife;
        showMessage(`${attackerCard.nombre} ataca directamente a la vida del rival haciendo ${damageToLife} de daño.`);
    }

    playerCreaturesAttacked[attackingCreatureIndex] = true;
    cancelAttackArrow();
    updateAll();
    checkGameOver();
}

async function executeAIAttack(attackerIndex, targetIndex) {
    await showAIAttackArrow(attackerIndex, targetIndex);
    const attackerCard = creaturesOpponent[attackerIndex];
    if (!attackerCard) return; // Criatura ya no existe

    const attackerStats = getEffectiveCreatureStats(attackerIndex, true);
    if (attackerStats.atk <= 0) return; // No puede atacar

    if (targetIndex !== null) { // Atacar a una criatura del jugador
        const targetCard = creatures[targetIndex];
        if (!targetCard) return; // Objetivo ya no existe

        let damageToTarget = attackerStats.atk;
        targetCard.currentDef -= damageToTarget;

        showMessage(`${attackerCard.nombre} del rival ataca a ${targetCard.nombre} haciendo ${damageToTarget} de daño.`);

        if (targetCard.currentDef <= 0) {
            creatures[targetIndex] = null;
            equipSlots[targetIndex] = null; // Eliminar equipo
            if (defender === targetIndex) {
                defender = null; // Si el defensor es destruido, se elimina
            }
            showMessage(`${targetCard.nombre} ha sido derrotado.`);
        }
    } else { // Ataque directo a la vida del jugador
        playerLife -= attackerStats.atk;
        showMessage(`${attackerCard.nombre} del rival ataca directamente a tu vida haciendo ${attackerStats.atk} de daño.`);
    }
    updateAll();
    checkGameOver();
}

function renderTurnBar() {
    const turnBar = document.getElementById("turn-bar");
    turnBar.innerHTML = ""; // Limpiar contenido anterior

    const turnInfo = document.createElement("div");
    turnInfo.textContent = `Turno: ${turno}`;
    turnBar.appendChild(turnInfo);

    const phaseInfo = document.createElement("div");
    if (activePlayer === 'player') {
        phaseInfo.textContent = `Fase: ${playerPhase.charAt(0).toUpperCase() + playerPhase.slice(1)}`;
    } else {
        phaseInfo.textContent = `Fase: Rival`;
    }
    turnBar.appendChild(phaseInfo);

    const nextPhaseButton = document.createElement("button");
    nextPhaseButton.id = "next-phase-button";
    if (activePlayer === 'player') {
        nextPhaseButton.textContent = "Siguiente Fase";
        nextPhaseButton.onclick = advancePhase;
        if (isAITurnInProgress || gameIsOver) {
            nextPhaseButton.disabled = true;
        } else {
            nextPhaseButton.disabled = false;
        }
    } else {
        nextPhaseButton.textContent = "Turno del Rival";
        nextPhaseButton.disabled = true; // Deshabilitado durante el turno del rival
    }
    turnBar.appendChild(nextPhaseButton);
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

    // Cambia esto:
    // document.body.addEventListener('click', startMusicOnFirstInteraction, { once: true });

    // Por esto:
    ['click', 'keydown', 'touchstart'].forEach(evt =>
        window.addEventListener(evt, startMusicOnFirstInteraction, { once: true })
    );

    const startingTrackIndex = Math.floor(Math.random() * playlist.length);
    loadTrack(startingTrackIndex);
    musicPlayer.load();
    // Intenta reproducir la música al cargar. Los navegadores pueden bloquearlo hasta la primera interacción del usuario.
    musicPlayer.play().catch(error => {
        console.log("La reproducción automática de música fue bloqueada por el navegador. Haz clic en el icono de música para iniciarla.", error);
    });
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
// Esta función no se usa con el setup actual, pero se mantiene por si se quiere un botón de inicio.
function startMusicOnFirstInteraction() {
    if (musicPlayer.paused && !musicPlayer.muted) {
        musicPlayer.play().catch(error => {
            console.warn("La reproducción automática de música fue bloqueada por el navegador. Error: ", error);
        });
    }
}

// Iniciar el juego solo cuando el DOM esté completamente cargado.
document.addEventListener('DOMContentLoaded', (event) => {
    initGame();
});


function restoreAllDefenses() {
    forceUpdateAllCreatureStats();
}

function forceUpdateAllCreatureStats() {
    // Para las criaturas del jugador
    for (let i = 0; i < 3; i++) {
        if (creatures[i]) {
            const stats = getEffectiveCreatureStats(i, false);
            creatures[i].currentDef = stats.def; // Restaura currentDef a la defensa efectiva total
        }
    }
    // Para las criaturas del oponente
    for (let i = 0; i < 3; i++) {
        if (creaturesOpponent[i]) {
            const stats = getEffectiveCreatureStats(i, true);
            creaturesOpponent[i].currentDef = stats.def; // Restaura currentDef a la defensa efectiva total
        }
    }
}