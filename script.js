// API Configuration
const API_BASE_URL = 'https://pokeapi.co/api/v2';
const POKEMON_PER_PAGE = 20;

// State Management
let currentOffset = 0;
let allPokemon = [];
let filteredPokemon = [];
let currentFilter = 'all';
let isLoading = false;

// Type Colors Mapping
const typeColors = {
    fire: 'var(--type-fire)',
    water: 'var(--type-water)',
    grass: 'var(--type-grass)',
    electric: 'var(--type-electric)',
    psychic: 'var(--type-psychic)',
    normal: 'var(--type-normal)',
    fighting: 'var(--type-fighting)',
    flying: 'var(--type-flying)',
    poison: 'var(--type-poison)',
    ground: 'var(--type-ground)',
    rock: 'var(--type-rock)',
    bug: 'var(--type-bug)',
    ghost: 'var(--type-ghost)',
    steel: 'var(--type-steel)',
    ice: 'var(--type-ice)',
    dragon: 'var(--type-dragon)',
    dark: 'var(--type-dark)',
    fairy: 'var(--type-fairy)'
};

// DOM Elements
const pokemonGrid = document.getElementById('pokemonGrid');
const loadingElement = document.getElementById('loading');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('pokemonModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');

// Initialize App
async function init() {
    await loadPokemon();
    setupEventListeners();
}

// Setup Event Listeners
function setupEventListeners() {
    loadMoreBtn.addEventListener('click', loadMorePokemon);
    searchInput.addEventListener('input', handleSearch);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });

    modalOverlay.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Load Pokemon from API
async function loadPokemon() {
    if (isLoading) return;

    isLoading = true;
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/pokemon?limit=${POKEMON_PER_PAGE}&offset=${currentOffset}`);
        const data = await response.json();

        // Fetch detailed data for each Pokemon
        const pokemonPromises = data.results.map(pokemon => fetchPokemonDetails(pokemon.url));
        const pokemonDetails = await Promise.all(pokemonPromises);

        allPokemon = [...allPokemon, ...pokemonDetails];
        filteredPokemon = [...allPokemon];

        renderPokemon(pokemonDetails);
        currentOffset += POKEMON_PER_PAGE;

    } catch (error) {
        console.error('Error loading Pokemon:', error);
        pokemonGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Failed to load Pokémon. Please try again.</p>';
    } finally {
        hideLoading();
        isLoading = false;
    }
}

// Fetch detailed Pokemon data
async function fetchPokemonDetails(url) {
    const response = await fetch(url);
    return await response.json();
}

// Render Pokemon cards
function renderPokemon(pokemonList, append = true) {
    if (!append) {
        pokemonGrid.innerHTML = '';
    }

    pokemonList.forEach((pokemon, index) => {
        const card = createPokemonCard(pokemon, index);
        pokemonGrid.appendChild(card);
    });
}

// Create Pokemon card element
function createPokemonCard(pokemon, index) {
    const card = document.createElement('div');
    card.className = 'pokemon-card';
    card.style.animationDelay = `${index * 0.05}s`;

    const types = pokemon.types.map(type => type.type.name);
    const typesHTML = types.map(type =>
        `<span class="type-badge" style="background: ${typeColors[type] || 'var(--type-normal)'}">${type}</span>`
    ).join('');

    const imageUrl = pokemon.sprites.other['official-artwork'].front_default ||
        pokemon.sprites.front_default ||
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';

    card.innerHTML = `
        <div class="pokemon-number">#${String(pokemon.id).padStart(3, '0')}</div>
        <div class="pokemon-image-container">
            <img src="${imageUrl}" alt="${pokemon.name}" class="pokemon-image">
        </div>
        <h3 class="pokemon-name">${pokemon.name}</h3>
        <div class="pokemon-types">
            ${typesHTML}
        </div>
    `;

    card.addEventListener('click', () => showPokemonDetails(pokemon));

    return card;
}

// Show Pokemon details in modal
async function showPokemonDetails(pokemon) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const types = pokemon.types.map(type => type.type.name);
    const typesHTML = types.map(type =>
        `<span class="type-badge" style="background: ${typeColors[type] || 'var(--type-normal)'}">${type}</span>`
    ).join('');

    const imageUrl = pokemon.sprites.other['official-artwork'].front_default ||
        pokemon.sprites.front_default;

    // Fetch species data for additional info
    let flavorText = 'A mysterious Pokémon.';
    try {
        const speciesResponse = await fetch(pokemon.species.url);
        const speciesData = await speciesResponse.json();
        const englishEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
        if (englishEntry) {
            flavorText = englishEntry.flavor_text.replace(/\f/g, ' ');
        }
    } catch (error) {
        console.error('Error fetching species data:', error);
    }

    const statsHTML = pokemon.stats.map(stat => {
        const percentage = Math.min((stat.base_stat / 255) * 100, 100);
        return `
            <div class="stat-bar">
                <div class="stat-info">
                    <span class="stat-name">${stat.stat.name.replace('-', ' ')}</span>
                    <span class="stat-value">${stat.base_stat}</span>
                </div>
                <div class="stat-progress">
                    <div class="stat-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');

    modalBody.innerHTML = `
        <div class="modal-header">
            <img src="${imageUrl}" alt="${pokemon.name}" class="modal-pokemon-image">
            <h2 class="modal-pokemon-name">${pokemon.name}</h2>
            <div class="modal-pokemon-number">#${String(pokemon.id).padStart(3, '0')}</div>
            <div class="pokemon-types" style="justify-content: center; margin-top: 1rem;">
                ${typesHTML}
            </div>
        </div>
        <div class="modal-body">
            <div class="stats-section">
                <h3 class="section-title">About</h3>
                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem;">${flavorText}</p>
                
                <div class="info-grid" style="margin-bottom: 2rem;">
                    <div class="info-item">
                        <div class="info-label">Height</div>
                        <div class="info-value">${(pokemon.height / 10).toFixed(1)} m</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Weight</div>
                        <div class="info-value">${(pokemon.weight / 10).toFixed(1)} kg</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Abilities</div>
                        <div class="info-value" style="font-size: 1rem;">
                            ${pokemon.abilities.map(a => a.ability.name.replace('-', ' ')).join(', ')}
                        </div>
                    </div>
                </div>
                
                <h3 class="section-title">Base Stats</h3>
                ${statsHTML}
            </div>
        </div>
    `;
}

// Close modal
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === '') {
        filteredPokemon = currentFilter === 'all'
            ? allPokemon
            : allPokemon.filter(p => p.types.some(t => t.type.name === currentFilter));
    } else {
        const baseFilter = currentFilter === 'all'
            ? allPokemon
            : allPokemon.filter(p => p.types.some(t => t.type.name === currentFilter));

        filteredPokemon = baseFilter.filter(pokemon =>
            pokemon.name.toLowerCase().includes(searchTerm) ||
            String(pokemon.id).includes(searchTerm)
        );
    }

    pokemonGrid.innerHTML = '';
    renderPokemon(filteredPokemon, false);
}

// Handle filter
function handleFilter(e) {
    const filterType = e.target.dataset.type;
    currentFilter = filterType;

    // Update active state
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // Filter Pokemon
    if (filterType === 'all') {
        filteredPokemon = allPokemon;
    } else {
        filteredPokemon = allPokemon.filter(pokemon =>
            pokemon.types.some(type => type.type.name === filterType)
        );
    }

    // Apply search if active
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm !== '') {
        filteredPokemon = filteredPokemon.filter(pokemon =>
            pokemon.name.toLowerCase().includes(searchTerm) ||
            String(pokemon.id).includes(searchTerm)
        );
    }

    pokemonGrid.innerHTML = '';
    renderPokemon(filteredPokemon, false);
}

// Load more Pokemon
async function loadMorePokemon() {
    await loadPokemon();

    // Re-apply current filter
    if (currentFilter !== 'all') {
        filteredPokemon = allPokemon.filter(pokemon =>
            pokemon.types.some(type => type.type.name === currentFilter)
        );
    }
}

// Show/Hide loading
function showLoading() {
    loadingElement.classList.remove('hidden');
    loadMoreBtn.disabled = true;
}

function hideLoading() {
    loadingElement.classList.add('hidden');
    loadMoreBtn.disabled = false;
}

// Start the app
init();
