// Todas las cartas del juego, equilibradas y ampliadas
const cartas = [
    // Criaturas básicas
    { nombre: "Skuller", ataque: 1, defensa: 2, elemento: "oscuridad", tipo: "zombie", nivel: 1, categoria: "criatura", descripcion: "Un zombi débil pero fiel." },
    { nombre: "Firia", ataque: 2, defensa: 1, elemento: "fuego", tipo: "bestia", nivel: 2, categoria: "criatura", descripcion: "Bestia ígnea de colmillos ardientes." },
    { nombre: "Lumina", ataque: 1, defensa: 2, elemento: "luz", tipo: "heroe", nivel: 1, categoria: "criatura", descripcion: "Guardián radiante de los inocentes." },
    { nombre: "Caballero Valiente", ataque: 2, defensa: 4, elemento: "luz", tipo: "heroe", nivel: 3, categoria: "criatura", descripcion: "Defensor implacable de su reino." },
    { nombre: "Dragón de Magma", ataque: 5, defensa: 3, elemento: "fuego", tipo: "dragon", nivel: 5, categoria: "criatura", descripcion: "Su aliento derrite la roca." },
    { nombre: "Numina", ataque: 6, defensa: 2, elemento: "fuego", tipo: "hechicero", nivel: 6, categoria: "criatura", descripcion: "Una poderosa hechicera Hin." },
    // Nuevas criaturas equilibradas
    { nombre: "Golem de Piedra", ataque: 2, defensa: 5, elemento: "tierra", tipo: "golem", nivel: 4, categoria: "criatura", descripcion: "Defensa sólida como la roca." },
    { nombre: "Serpiente Venenosa", ataque: 3, defensa: 1, elemento: "oscuridad", tipo: "bestia", nivel: 2, categoria: "criatura", descripcion: "Su mordida debilita al enemigo." },
    { nombre: "Ángel Guardián", ataque: 2, defensa: 3, elemento: "luz", tipo: "heroe", nivel: 3, categoria: "criatura", descripcion: "Protege a los aliados con su luz." },

    // Equipamientos
    { nombre: "Espada Sagrada", categoria: "equipamiento", nivel: 2, efectos: { atk: 1 }, descripcion: "Equipamiento: +1 ATK." },
    { nombre: "Escudo Sagrado", categoria: "equipamiento", nivel: 2, efectos: { def: 1 }, descripcion: "Equipamiento: +1 DEF." },
    { nombre: "Armadura de Hierro", categoria: "equipamiento", nivel: 3, efectos: { def: 2 }, descripcion: "Equipamiento: +2 DEF." },
    { nombre: "Lanza de Fuego", categoria: "equipamiento", nivel: 3, efectos: { atk: 2 }, descripcion: "Equipamiento: +2 ATK." },

    // Activos (buff global propio)
    { nombre: "Tótem Arcano", categoria: "activo", nivel: 3, efectos: { def: 1, global: true }, descripcion: "Tus criaturas ganan +1 DEF." },
    { nombre: "Aura de Valor", categoria: "activo", nivel: 4, efectos: { atk: 1, global: true }, descripcion: "Tus criaturas ganan +1 ATK." },

    // Activos (debuff global al oponente)
    { nombre: "Estatua Maldita", categoria: "activo", nivel: 4, efectos: { atk: -1, global: true, soloOponente: true }, descripcion: "Las criaturas del oponente pierden 1 ATK." },
    { nombre: "Niebla Encantada", categoria: "ambiente", nivel: 2, efectos: { atk: -1, global: true, soloOponente: true }, descripcion: "Las criaturas del oponente pierden 1 ATK." },
    { nombre: "Pantano Lento", categoria: "ambiente", nivel: 3, efectos: { def: -1, global: true, soloOponente: true }, descripcion: "Las criaturas del oponente pierden 1 DEF." }
];