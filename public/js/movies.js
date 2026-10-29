let TMDB_API_KEY = '691620cad3b3e10a9dddff77044272a4';
const TMDB_PROXY = 'https://0ao1qp.instatunnel.my';
const TMDB_BASE_URL = `${TMDB_PROXY}/3`;
const TMDB_IMAGE_BASE = `${TMDB_PROXY}/t/p/w500`;
const TMDB_BACKDROP = `${TMDB_PROXY}/t/p/original`;

const CATEGORIES = [
    { title: 'Trending', endpoint: '/trending/movie/week' },
    { title: 'Popular Movies', endpoint: '/movie/popular' },
    { title: 'Top Rated', endpoint: '/movie/top_rated' },
    { title: 'Upcoming', endpoint: '/movie/upcoming' },
    { title: 'Popular Shows', endpoint: '/tv/popular' }
];

let currentFeaturedMovie = null;
let allCarouselMovies = [];
let currentHeroIndex = 0;
let currentlyPlayingIMDBId = null;

async function initializeAPI() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        TMDB_API_KEY = data.TMDB_API_KEY;
    } catch (error) {
        console.error('Error fetching API config:', error);
    }
}

async function fetchMovies(endpoint = '/movie/popular') {
    try {
        const response = await fetch(`${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&page=1`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching movies:', error);
        return [];
    }
}

async function initMoviesPage() {
    await initializeAPI();
    await loadStreamingKey();
    
    const heroContainer = document.getElementById('netflix-hero');
    const carouselsContainer = document.getElementById('netflix-carousels');
    
    if (!heroContainer || !carouselsContainer) return;

    heroContainer.innerHTML = '';
    carouselsContainer.innerHTML = '';
    
    const trendingMovies = await fetchMovies('/trending/movie/week');
    if (trendingMovies.length > 0) {
        allCarouselMovies = [...trendingMovies];
        currentFeaturedMovie = trendingMovies[0];
        createHeroBanner(heroContainer, currentFeaturedMovie);
    }

    const recommendedMovies = await fetchMovies('/movie/now_playing');
    if (recommendedMovies.length > 0) {
        createCarousel(carouselsContainer, '💡 Recommended For You', recommendedMovies);
    }

    for (const category of CATEGORIES) {
        const movies = await fetchMovies(category.endpoint);
        if (movies.length > 0) {
            createCarousel(carouselsContainer, category.title, movies);
        }
    }
    
    const loadingMessage = document.getElementById('movies-loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
    

    const searchInput = document.getElementById('movies-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', async (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                carouselsContainer.innerHTML = '';
                heroContainer.style.display = 'block';
                closeAutocomplete();
  
                const recommendedMovies = await fetchMovies('/movie/now_playing');
                if (recommendedMovies.length > 0) {
                    createCarousel(carouselsContainer, '💡 Recommended For You', recommendedMovies);
                }

                CATEGORIES.forEach(async (category) => {
                    const movies = await fetchMovies(category.endpoint);
                    if (movies.length > 0) {
                        createCarousel(carouselsContainer, category.title, movies);
                    }
                });
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                try {
                    const movieResponse = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`);
                    const movieData = await movieResponse.json();
                    const movies = (movieData.results || []).slice(0, 5);
                    
                    const tvResponse = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`);
                    const tvData = await tvResponse.json();
                    const shows = (tvData.results || []).slice(0, 5);
                    
                    showAutocomplete([...movies, ...shows]);
                } catch (error) {
                    console.error('Autocomplete error:', error);
                }
            }, 200);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    performSearch(query);
                }
                closeAutocomplete();
            }
        });
    }
}

function createHeroBanner(container, movie) {
    const backdropUrl = movie.backdrop_path 
        ? `${TMDB_BACKDROP}${movie.backdrop_path}` 
        : `${TMDB_IMAGE_BASE}${movie.poster_path}`;
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    
    const heroBanner = document.createElement('div');
    heroBanner.className = 'hero-banner';
    heroBanner.style.backgroundImage = `url('${backdropUrl}')`;
    
    heroBanner.innerHTML = `
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <h1 class="hero-title">${movie.title}</h1>
            <div class="hero-meta">
                <span class="hero-rating">⭐ ${rating}/10</span>
                <span class="hero-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
            </div>
            <p class="hero-description">${movie.overview || 'No description available'}</p>
            <div class="hero-buttons">
                <button class="hero-btn play-btn" onclick="openDetailModal(${movie.id}, false)">▶ Play</button>
                <button class="hero-btn info-btn" onclick="openDetailModal(${movie.id}, false)">ℹ More Info</button>
            </div>
        </div>
    `;
    
    container.appendChild(heroBanner);
}

function createCarousel(container, title, movies) {
    const section = document.createElement('div');
    section.className = 'carousel-section';
    
    const titleEl = document.createElement('h2');
    titleEl.className = 'carousel-title';
    titleEl.textContent = title;
    
    const carouselWrapper = document.createElement('div');
    carouselWrapper.className = 'carousel-wrapper';
    
    const track = document.createElement('div');
    track.className = 'carousel-track';
    
    movies.slice(0, 12).forEach((movie, index) => {
        const card = createMovieCard(movie, index);
        track.appendChild(card);
    });
    
    const leftBtn = document.createElement('button');
    leftBtn.className = 'carousel-scroll-btn carousel-scroll-left hidden';
    leftBtn.innerHTML = '◀';
    leftBtn.onclick = () => track.scrollBy({ left: -400, behavior: 'smooth' });
    
    const rightBtn = document.createElement('button');
    rightBtn.className = 'carousel-scroll-btn carousel-scroll-right';
    rightBtn.innerHTML = '▶';
    rightBtn.onclick = () => track.scrollBy({ left: 400, behavior: 'smooth' });
    
    track.addEventListener('scroll', () => {
        const atStart = track.scrollLeft <= 10;
        const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 10;
        
        leftBtn.classList.toggle('hidden', atStart);
        rightBtn.classList.toggle('hidden', atEnd);
    });
    
    carouselWrapper.appendChild(leftBtn);
    carouselWrapper.appendChild(track);
    carouselWrapper.appendChild(rightBtn);
    
    section.appendChild(titleEl);
    section.appendChild(carouselWrapper);
    container.appendChild(section);
    requestAnimationFrame(() => {
    rightBtn.classList.toggle('hidden', track.scrollWidth <= track.clientWidth + 10);
});
}

function createMovieCard(movie, index) {
    const card = document.createElement('div');
    card.className = 'carousel-movie-card';
    card.style.animationDelay = `${index * 0.05}s`;
    
    const posterUrl = movie.poster_path 
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}` 
        : '/static/favicons/deltav10.png';
    
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const title = movie.title || movie.name || 'Unknown';
    const year = movie.release_date ? movie.release_date.split('-')[0] : (movie.first_air_date ? movie.first_air_date.split('-')[0] : 'N/A');
    const isShow = !!movie.name;
    
    card.innerHTML = `
        <div class="carousel-poster">
            <img src="${posterUrl}" alt="${title}" loading="lazy">
            <div class="carousel-overlay">
                <button class="carousel-play-btn">▶ More Info</button>
            </div>
        </div>
        <div class="carousel-info">
            <h3>${title}</h3>
            <div class="carousel-meta">
                <span>⭐ ${rating}</span>
                <span>${year}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => openDetailModal(movie.id, isShow));
    
    return card;
}

let currentStreamingKey = '';
let currentDetailData = null;
let cachedSeasons = {};

async function loadStreamingKey() {
    try {
        const response = await fetch('/api/streaming-key');
        const data = await response.json();
        currentStreamingKey = data.STREAMING_API_KEY;
    } catch (error) {
        console.error('Error loading streaming key:', error);
    }
}

function playDirectly(id, isShow) {
    openFullscreenPlayer(id, isShow);
}

function playMovie(movieId, movieTitle) {
    openFullscreenPlayer(movieId);
}

async function openDetailModal(tmdbId, isShow = false) {
    let modal = document.getElementById('detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'detail-modal';
        modal.className = 'detail-modal';
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDetailModal();
        });
    }
    
    modal.innerHTML = `
        <div class="detail-content">
            <button class="detail-close" onclick="closeDetailModal()">✕</button>
            <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #fff;">
                <p>Loading...</p>
            </div>
        </div>
    `;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    try {
        const endpoint = isShow ? 'tv' : 'movie';
        const response = await fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        currentDetailData = data;
        
        let imdbId = data.imdb_id || '';
        if (isShow) {
            const externalRes = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
            const externalData = await externalRes.json();
            imdbId = externalData.imdb_id || '';
        }
        
        const backdropUrl = data.backdrop_path 
            ? `${TMDB_BACKDROP}${data.backdrop_path}` 
            : (data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : '');
        
        const title = data.title || data.name || 'Unknown';
        const year = data.release_date ? data.release_date.split('-')[0] : (data.first_air_date ? data.first_air_date.split('-')[0] : '');
        const rating = data.vote_average ? Math.round(data.vote_average * 10) : 0;
        const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : (data.episode_run_time?.[0] ? `${data.episode_run_time[0]}m per episode` : '');
        const genres = data.genres ? data.genres.map(g => g.name).join(', ') : '';
        const description = data.overview || 'No description available.';
        
        let seasonsHTML = '';
        if (isShow && data.seasons) {
            const validSeasons = data.seasons.filter(s => s.season_number > 0);
            if (validSeasons.length > 0) {
                const seasonOptions = validSeasons.map(s => 
                    `<option value="${s.season_number}">Season ${s.season_number}: ${s.name || 'Season ' + s.season_number}</option>`
                ).join('');
                
                seasonsHTML = `
                    <div class="seasons-section">
                        <div class="seasons-header">
                            <h3 class="seasons-title">Episodes</h3>
                            <select class="season-dropdown" id="season-selector" onchange="loadSeasonEpisodes(${tmdbId}, this.value)">
                                ${seasonOptions}
                            </select>
                        </div>
                        <div id="episodes-container" class="episodes-grid">
                            <p style="color: #aaa;">Loading episodes...</p>
                        </div>
                    </div>
                `;
            }
        }
        
        modal.innerHTML = `
            <div class="detail-content">
                <button class="detail-close" onclick="closeDetailModal()">✕</button>
                <div class="detail-backdrop" style="background-image: url('${backdropUrl}')">
                    <div class="detail-backdrop-overlay"></div>
                </div>
                <div class="detail-info">
                    <h1 class="detail-title">${title}</h1>
                    <div class="detail-meta">
                        <span class="detail-rating">${rating}% Match</span>
                        <span class="detail-year">${year}</span>
                        ${runtime ? `<span class="detail-runtime">${runtime}</span>` : ''}
                    </div>
                    <div class="detail-buttons">
                        <button class="detail-play-btn" onclick="playFromDetail(${tmdbId}, ${isShow}, '${imdbId}')">
                            ▶ Play
                        </button>
                    </div>
                    <p class="detail-description">${description}</p>
                    ${genres ? `<p class="detail-genres" style="color: #777; font-size: 0.9rem;">Genres: ${genres}</p>` : ''}
                </div>
                ${seasonsHTML}
            </div>
        `;
        if (isShow && data.seasons) {
            const firstSeason = data.seasons.find(s => s.season_number > 0);
            if (firstSeason) {
                loadSeasonEpisodes(tmdbId, firstSeason.season_number);
            }
        }
        
    } catch (err) {
        console.error('go die', err);
        modal.innerHTML = `
            <div class="detail-content">
                <button class="detail-close" onclick="closeDetailModal()">✕</button>
                <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #fff;">
                    <p>Failed to load details. Please try again.</p>
                </div>
            </div>
        `;
    }
}

async function loadSimilarContent(tmdbId, isShow = false) {
    try {
        const endpoint = isShow ? 'tv' : 'movie';
        const response = await fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}/similar?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const similar = data.results ? data.results.slice(0, 15) : [];
        
        if (similar.length === 0) {
            createMoreLikeThisSection([]);
            return;
        }
        
        createMoreLikeThisSection(similar);
    } catch (err) {
        console.error('Error loading similar content:', err);
        createMoreLikeThisSection([]);
    }
}

function createMoreLikeThisSection(similar) {

    const oldSection = document.getElementById('more-like-this-container');
    if (oldSection) oldSection.remove();
    
    if (similar.length === 0) return;
    
    const section = document.createElement('div');
    section.id = 'more-like-this-container';
    section.className = 'more-like-this-container';
    
    const title = document.createElement('h2');
    title.className = 'more-like-this-title';
    title.textContent = 'More Like This';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'similar-carousel-wrapper';
    
    const track = document.createElement('div');
    track.id = 'similar-track';
    track.className = 'similar-carousel-track';
    
    similar.forEach(item => {
        const poster = item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '/static/favicons/deltav10.png';
        const itemTitle = item.title || item.name || 'Unknown';
        const isItemShow = !!item.name;
        
        const card = document.createElement('div');
        card.className = 'similar-carousel-item';
        card.innerHTML = `
            <img src="${poster}" alt="${itemTitle}" loading="lazy">
            <div class="similar-overlay">
                <span class="similar-play">▶</span>
            </div>
            <p class="similar-title">${itemTitle}</p>
        `;
        card.onclick = () => openDetailModal(item.id, isItemShow);
        track.appendChild(card);
    });
    
    const leftBtn = document.createElement('button');
    leftBtn.className = 'similar-scroll-btn similar-scroll-left hidden';
    leftBtn.innerHTML = '◀';
    leftBtn.onclick = () => track.scrollBy({ left: -400, behavior: 'smooth' });
    
    const rightBtn = document.createElement('button');
    rightBtn.className = 'similar-scroll-btn similar-scroll-right';
    rightBtn.innerHTML = '▶';
    rightBtn.onclick = () => track.scrollBy({ left: 400, behavior: 'smooth' });

    track.addEventListener('scroll', () => {
        const atStart = track.scrollLeft <= 10;
        const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 10;
        
        leftBtn.classList.toggle('hidden', atStart);
        rightBtn.classList.toggle('hidden', atEnd);
    });
    
    wrapper.appendChild(leftBtn);
    wrapper.appendChild(track);
    wrapper.appendChild(rightBtn);
    
    section.appendChild(title);
    section.appendChild(wrapper);

    const modal = document.getElementById('detail-modal');
    modal.parentNode.insertBefore(section, modal.nextSibling);
}

function closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

}

async function loadSeasonEpisodes(tmdbId, seasonNumber) {
    const container = document.getElementById('episodes-container');
    if (!container) return;
    
    container.innerHTML = '<p style="color: #aaa;">Loading episodes...</p>';

    const cacheKey = `${tmdbId}-${seasonNumber}`;
    if (cachedSeasons[cacheKey]) {
        renderEpisodes(cachedSeasons[cacheKey], tmdbId, seasonNumber);
        return;
    }
    
    try {
        const response = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`);
        const seasonData = await response.json();
        
        cachedSeasons[cacheKey] = seasonData;
        renderEpisodes(seasonData, tmdbId, seasonNumber);
        
    } catch (err) {
        console.error('Error loading episodes:', err);
        container.innerHTML = '<p style="color: #aaa;">Failed to load episodes.</p>';
    }
}

function renderEpisodes(seasonData, tmdbId, seasonNumber) {
    const container = document.getElementById('episodes-container');
    if (!container || !seasonData.episodes) return;
    
    container.innerHTML = seasonData.episodes.map(ep => {
        const stillUrl = ep.still_path 
            ? `${TMDB_IMAGE_BASE}${ep.still_path}` 
            : '/static/favicons/deltav10.png';
        const runtime = ep.runtime ? `${ep.runtime}m` : '';
        const description = ep.overview || 'No description available.';
        
        return `
            <div class="episode-card" onclick="playEpisode(${tmdbId}, ${seasonNumber}, ${ep.episode_number})">
                <div class="episode-thumbnail">
                    <img src="${stillUrl}" alt="Episode ${ep.episode_number}" loading="lazy">
                    <div class="episode-play-overlay">
                        <div class="episode-play-icon">▶</div>
                    </div>
                </div>
                <div class="episode-info">
                    <div class="episode-header">
                        <span class="episode-number">${ep.episode_number}.</span>
                        <span class="episode-runtime">${runtime}</span>
                    </div>
                    <div class="episode-title">${ep.name || 'Episode ' + ep.episode_number}</div>
                    <p class="episode-description">${description}</p>
                </div>
            </div>
        `;
    }).join('');
}

async function playFromDetail(tmdbId, isShow, imdbId) {
    closeDetailModal();
    if (isShow) {

        openFullscreenPlayer(tmdbId, true, 1, 1);
    } else {
        openFullscreenPlayer(tmdbId, false);
    }
}

async function playEpisode(tmdbId, season, episode) {
    closeDetailModal();
    openFullscreenPlayer(tmdbId, true, season, episode);
}

let currentShowData = null;
let currentImdbId = null;
let currentShowTmdbId = null;

async function openFullscreenPlayer(tmdbId, isShow = false, season = 1, episode = 1) {
    let modal = document.getElementById('fullscreen-player-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fullscreen-player-modal';
        modal.className = 'fullscreen-player-modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="fullscreen-player-content">
            <button class="fullscreen-close" onclick="closeFullscreenPlayer()">✕ Close</button>
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #fff; flex-direction: column;">
                <p style="margin-bottom: 1rem;">Loading...</p>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    try {
        let imdbId = '';
        
        if (isShow) {

            const [showRes, externalIdsRes] = await Promise.all([
                fetch(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`),
                fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`)
            ]);
            const showData = await showRes.json();
            const externalIds = await externalIdsRes.json();
            imdbId = externalIds.imdb_id || '';
            currentShowData = showData;
            currentImdbId = imdbId;
            currentShowTmdbId = tmdbId;
            console.log(tmdbId);
            const seasons = showData.seasons ? showData.seasons.filter(s => s.season_number > 0) : [];
            const seasonOptions = seasons.map(s => 
                `<option value="${s.season_number}" ${s.season_number === season ? 'selected' : ''}>Season ${s.season_number}</option>`
            ).join('');
            
            const currentSeason = seasons.find(s => s.season_number === season);
            const episodeCount = currentSeason ? currentSeason.episode_count : 10;
            const episodeOptions = Array.from({length: episodeCount}, (_, i) => 
                `<option value="${i + 1}" ${i + 1 === episode ? 'selected' : ''}>Episode ${i + 1}</option>`
            ).join('');
            
            modal.innerHTML = `
                <div class="fullscreen-player-content">
                    <button class="fullscreen-close" onclick="closeFullscreenPlayer()">✕ Close</button>
                    <div class="episode-selector" style="position: absolute; top: 1.5rem; left: 1.5rem; z-index: 2001; display: flex; gap: 0.5rem;">
                        <select id="season-select" onchange="changeSeason(${tmdbId})" style="padding: 0.5rem; background: rgba(0,0,0,0.8); color: #fff; border: 1px solid var(--color-accent); border-radius: 0.25rem; cursor: pointer;">
                            ${seasonOptions}
                        </select>
                        <select id="episode-select" onchange="changeEpisode(${tmdbId})" style="padding: 0.5rem; background: rgba(0,0,0,0.8); color: #fff; border: 1px solid var(--color-accent); border-radius: 0.25rem; cursor: pointer;">
                            ${episodeOptions}
                        </select>
                    </div>
                    <div class="fullscreen-player-wrapper">
                        <iframe 
                            id="video-iframe"
                            src=" https://nfhbv6.instatunnel.my/player.html?url=https://vidlink.pro/tv/${tmdbId}/${season}/${episode}"
                            width="100%" 
                            height="100%" 
                            frameborder="0" 
                            allowfullscreen
                            referrerpolicy="origin"
                            style="position: absolute; top: 0; left: 0;">
                        </iframe>
                    </div>
                </div>
            `;
        } else {
            const movieRes = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
            const movieData = await movieRes.json();
            imdbId = movieData.imdb_id || '';
            
            if (!imdbId) {
                throw new Error('No IMDb ID found');
            }
            else {
                console.log(imdbId);
            }
            modal.innerHTML = `
                <div class="fullscreen-player-content">
                    <button class="fullscreen-close" onclick="closeFullscreenPlayer()">✕ Close</button>
                    <div class="fullscreen-player-wrapper">
                        <iframe 
                            src=" https://nfhbv6.instatunnel.my/player.html?url=https://vidlink.pro/movie/${imdbId}""
                            width="100%" 
                            height="100%" 
                            frameborder="0" 
                            allowfullscreen
                            referrerpolicy="origin"
                            style="position: absolute; top: 0; left: 0;">
                        </iframe>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        console.error('Error loading:', err);
        modal.innerHTML = `
            <div class="fullscreen-player-content">
                <button class="fullscreen-close" onclick="closeFullscreenPlayer()">✕ Close</button>
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #fff; flex-direction: column;">
                    <p style="margin-bottom: 1rem;">Unable to load player</p>
                    <p style="font-size: 0.9rem; color: #aaa;">This title may not be available for streaming</p>
                </div>
            </div>
        `;
    }
}

function changeSeason(tmdbId) {
    const seasonSelect = document.getElementById('season-select');
    const episodeSelect = document.getElementById('episode-select');
    const season = parseInt(seasonSelect.value);

    if (currentShowData && currentShowData.seasons) {
        const seasonData = currentShowData.seasons.find(s => s.season_number === season);
        const episodeCount = seasonData ? seasonData.episode_count : 10;
        episodeSelect.innerHTML = Array.from({length: episodeCount}, (_, i) => 
            `<option value="${i + 1}">Episode ${i + 1}</option>`
        ).join('');
    }

    const iframe = document.getElementById('video-iframe');
    if (iframe && currentImdbId) {
        iframe.src = `https://server.taila7246c.ts.net/player.html?url=https://vidlink.pro/tv/${currentShowTmdbId}/${season}/1`;
    }
}

function changeEpisode(tmdbId) {
    const seasonSelect = document.getElementById('season-select');
    const episodeSelect = document.getElementById('episode-select');
    const season = parseInt(seasonSelect.value);
    const episode = parseInt(episodeSelect.value);
    
    const iframe = document.getElementById('video-iframe');
    if (iframe && currentImdbId) {
        iframe.src = `https://server.taila7246c.ts.net/player.html?url=https://vidlink.pro/tv/${currentShowTmdbId}/${season}/${episode}`;
    }
}

function closeFullscreenPlayer() {
    const modal = document.getElementById('fullscreen-player-modal');
    if (modal) {
        modal.innerHTML = '';
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function showAutocomplete(results) {
    let autocomplete = document.getElementById('search-autocomplete');
    const searchInput = document.getElementById('movies-search');
    const searchSticky = document.querySelector('.netflix-search-sticky');
    
    if (!autocomplete && searchSticky) {
        autocomplete = document.createElement('div');
        autocomplete.id = 'search-autocomplete';
        autocomplete.className = 'search-autocomplete';
        searchSticky.appendChild(autocomplete);
    }
    
    if (!autocomplete) return;
    
    autocomplete.innerHTML = results.map((item, index) => {
        const poster = item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '/static/favicons/deltav10.png';
        const title = item.title || item.name || 'Unknown';
        const type = item.title ? 'Movie' : 'Show';
        const isShow = !!item.name;
        const escapedTitle = title.replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        return `
            <div class="autocomplete-item" onclick="selectAndPlayAutoComplete(${item.id}, ${isShow}, '${escapedTitle}')">
                <img src="${poster}" alt="${title}">
                <div class="autocomplete-info">
                    <div class="autocomplete-title">${title}</div>
                    <div class="autocomplete-type">${type}</div>
                </div>
            </div>
        `;
    }).join('');
    
    autocomplete.style.display = 'block';
}

function selectAndPlayAutoComplete(id, isShow, title) {
    document.getElementById('movies-search').value = title;
    closeAutocomplete();
    playDirectly(id, isShow);
}

function closeAutocomplete() {
    const autocomplete = document.getElementById('search-autocomplete');
    if (autocomplete) {
        autocomplete.style.display = 'none';
    }
}

function selectAutoComplete(title) {
    document.getElementById('movies-search').value = title;
    closeAutocomplete();
}

async function performSearch(query) {
    const carouselsContainer = document.getElementById('netflix-carousels');
    const heroContainer = document.getElementById('netflix-hero');
    
    try {
        const movieResponse = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`);
        const movieData = await movieResponse.json();
        const movies = movieData.results || [];
        
        const tvResponse = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`);
        const tvData = await tvResponse.json();
        const shows = tvData.results || [];
        
        carouselsContainer.innerHTML = '';
        heroContainer.style.display = 'none';
        
        if (movies.length > 0 || shows.length > 0) {
            setTimeout(() => {
                carouselsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            
            if (movies.length > 0) {
                createCarousel(carouselsContainer, `🎬 Movies: "${query}"`, movies);
            }
            if (shows.length > 0) {
                createCarousel(carouselsContainer, `📺 TV Shows: "${query}"`, shows);
            }
        } else {
            carouselsContainer.innerHTML = '<div style="padding: 3rem 2rem; text-align: center; color: #aaa;"><p style="font-size: 1.2rem;">No results found for "<strong>' + query + '</strong>"</p></div>';
        }
    } catch (error) {
        console.error('Search error:', error);
        carouselsContainer.innerHTML = '<div style="padding: 3rem 2rem; text-align: center; color: #aaa;"><p>Error searching. Please try again.</p></div>';
    }
}

function closeMovieModal() {
    const modal = document.getElementById('movie-modal');
    modal.style.display = 'none';
}

async function showMovieModal(movie) {
    const modal = document.getElementById('movie-modal');
    const infoContainer = document.getElementById('modal-movie-info');
    const moreLikeThisCarousel = document.getElementById('more-like-this-carousel');
    
    if (!modal || !infoContainer) return;
    
    const posterUrl = `${TMDB_IMAGE_BASE}${movie.poster_path}`;
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const year = movie.release_date ? movie.release_date.split('-')[0] : movie.first_air_date ? movie.first_air_date.split('-')[0] : 'N/A';
    const genres = movie.genres ? movie.genres.map(g => g.name).join(', ') : 'N/A';
    
    infoContainer.innerHTML = `
        <div style="display: flex; gap: 2rem;">
            <img src="${posterUrl}" alt="${movie.title}" style="width: 150px; height: 225px; object-fit: cover; border-radius: 0.5rem;">
            <div>
                <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">${movie.title}</h2>
                <p style="color: #aaa; margin-bottom: 0.5rem;">
                    <span style="color: var(--color-accent);">⭐ ${rating}/10</span> • ${year} • ${genres}
                </p>
                <p style="margin-top: 1rem; line-height: 1.6; color: #ddd; max-width: 400px;">${movie.overview || 'No description available'}</p>
            </div>
        </div>
    `;

    if (moreLikeThisCarousel) {
        moreLikeThisCarousel.innerHTML = '<p style="color: #aaa;">Loading similar content...</p>';
        
        try {
            const endpoint = movie.media_type === 'tv' ? `/tv/${movie.id}/similar` : `/movie/${movie.id}/similar`;
            const response = await fetch(`${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}`);
            const data = await response.json();
            const similar = data.results || [];
            
            moreLikeThisCarousel.innerHTML = '';
            
            if (similar.length === 0) {
                moreLikeThisCarousel.innerHTML = '<p style="color: #aaa;">No similar content available</p>';
            } else {
                similar.slice(0, 12).forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'more-like-this-card';
                    card.onclick = () => showMovieModal(item);
                    
                    const poster = document.createElement('div');
                    poster.className = 'more-like-this-poster';
                    
                    const img = document.createElement('img');
                    img.src = `${TMDB_IMAGE_BASE}${item.poster_path || item.backdrop_path}`;
                    img.alt = item.title || item.name;
                    
                    poster.appendChild(img);
                    card.appendChild(poster);
                    moreLikeThisCarousel.appendChild(card);
                });
            }
        } catch (error) {
            console.error('Error loading similar content:', error);
            moreLikeThisCarousel.innerHTML = '<p style="color: #aaa;">Error loading similar content</p>';
        }
    }
    
    modal.style.display = 'flex';
}

function setupScrollEffect() {
    const hero = document.getElementById('netflix-hero');
    const searchSticky = document.querySelector('.netflix-search-sticky');
    
    if (!hero || !searchSticky) return;
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight || 500;

        const fadeStart = heroHeight * 0.2;
        const fadeEnd = heroHeight * 0.6;
        
        if (scrollY >= fadeEnd) {

            hero.classList.add('fade-out');
            hero.style.opacity = '0';

            if (allCarouselMovies.length > 0 && scrollY > fadeEnd + 100) {
                currentHeroIndex = (currentHeroIndex + 1) % allCarouselMovies.length;
                updateHeroBanner(hero, allCarouselMovies[currentHeroIndex]);
            }
        } else if (scrollY > fadeStart) {

            hero.classList.add('fade-out');
            const progress = (scrollY - fadeStart) / (fadeEnd - fadeStart);
            hero.style.opacity = Math.max(0, 1 - progress);
        } else {

            hero.classList.remove('fade-out');
            hero.style.opacity = '1';
        }

        if (scrollY > fadeStart) {
            searchSticky.classList.add('visible');
        } else {
            searchSticky.classList.remove('visible');
        }
    }, { passive: true });
}

function updateHeroBanner(container, movie) {
    if (!movie) return;
    
    const backdropUrl = movie.backdrop_path 
        ? `${TMDB_BACKDROP}${movie.backdrop_path}` 
        : `${TMDB_IMAGE_BASE}${movie.poster_path}`;
    
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    container.style.opacity = '0';
    
    setTimeout(() => {
        container.innerHTML = '';
        const heroBanner = document.createElement('div');
        heroBanner.className = 'hero-banner';
        heroBanner.style.backgroundImage = `url('${backdropUrl}')`;
        
        heroBanner.innerHTML = `
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <h1 class="hero-title">${movie.title}</h1>
                <div class="hero-meta">
                    <span class="hero-rating">⭐ ${rating}/10</span>
                    <span class="hero-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                </div>
                <p class="hero-description">${movie.overview || 'No description available'}</p>
                <div class="hero-buttons">
                    <button class="hero-btn play-btn" onclick="openDetailModal(${movie.id}, false)">▶ Play</button>
                    <button class="hero-btn info-btn" onclick="openDetailModal(${movie.id}, false)">ℹ More Info</button>
                </div>
            </div>
        `;
        
        container.appendChild(heroBanner);

        setTimeout(() => {
            container.style.opacity = '1';
        }, 50);
    }, 200);
}

window.initMoviesPageOnLoad = () => {
    initMoviesPageWithRetry();
};

async function initMoviesPageWithRetry(maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
        if (document.getElementById('netflix-carousels')) {
            initMoviesPage();
            setupScrollEffect();
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('netflix-carousels')) {
        initMoviesPageWithRetry();
    }
});

const _origRoute = window.route;
window.route = function(event) {
    closeFullscreenPlayer();
    if (_origRoute) _origRoute(event);
};