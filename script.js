// ==================== ENCRYPTION UTILITY ====================
const Crypto = {
    key: 'mwm-secret-key-2024',
   
    encrypt(text) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result);
    },
   
    decrypt(encryptedText) {
        try {
            const text = atob(encryptedText);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length);
                result += String.fromCharCode(charCode);
            }
            return result;
        } catch (e) {
            return null;
        }
    }
};

// ==================== PASSWORD TOGGLE - SYNCHRONIZED ====================
function togglePassword(inputId, toggleElement) {
    const input = document.getElementById(inputId);
    const isPassword = input.type === 'password';
   
    // Toggle the input type
    input.type = isPassword ? 'text' : 'password';
   
    // Update the icon based on the NEW state
    // SLASHED EYE = password is HIDDEN (can't see it)
    // OPEN EYE = password is VISIBLE (can see it)
    if (isPassword) {
        // Changed to text (password now VISIBLE) - show OPEN eye
        toggleElement.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
        toggleElement.style.color = '#003366';
    } else {
        // Changed to password (password now HIDDEN) - show SLASHED eye
        toggleElement.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        `;
        toggleElement.style.color = '#666';
    }
}

// ==================== AUTHENTICATION ====================
function showSignUp() {
    document.getElementById('signInBox').classList.add('hidden');
    document.getElementById('signUpBox').classList.remove('hidden');
}

function showSignIn() {
    document.getElementById('signUpBox').classList.add('hidden');
    document.getElementById('signInBox').classList.remove('hidden');
}

function validatePassword(password) {
    const minLength = 8;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$]/.test(password);
   
    return password.length >= minLength && hasNumber && hasSymbol;
}

document.getElementById('signUpForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
   
    const username = document.getElementById('signUpUsername').value;
    const name = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    const confirmPassword = document.getElementById('signUpConfirmPassword').value;
   
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
   
    if (!validatePassword(password)) {
        alert('Password must be at least 8 characters with 1 number and 1 symbol (!@#$)');
        return;
    }
   
    if (localStorage.getItem(`user_${username}`)) {
        alert('Username already exists!');
        return;
    }
   
    const user = {
        username: username,
        name: name,
        email: `${name}`,
        password: Crypto.encrypt(password),
        createdAt: new Date().toISOString()
    };
   
    localStorage.setItem(`user_${username}`, JSON.stringify(user));
    localStorage.setItem('currentUser', username);
   
    localStorage.setItem(`movies_watching_${username}`, JSON.stringify([]));
    localStorage.setItem(`movies_watched_${username}`, JSON.stringify([]));
    localStorage.setItem(`movies_favorite_${username}`, JSON.stringify([]));
   
    window.location.href = 'project.html';
});

document.getElementById('signInForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
   
    const username = document.getElementById('signInUsername').value;
    const password = document.getElementById('signInPassword').value;
   
    const userData = localStorage.getItem(`user_${username}`);
   
    if (!userData) {
        alert('User not found!');
        return;
    }
   
    const user = JSON.parse(userData);
    const decryptedPassword = Crypto.decrypt(user.password);
   
    if (decryptedPassword !== password) {
        alert('Invalid password!');
        return;
    }
   
    localStorage.setItem('currentUser', username);
    window.location.href = 'project.html';
});

// ==================== MAIN APPLICATION ====================
let currentTab = 'watching';
let currentSection = 'home';
let currentRatingMovie = null;
let selectedRating = 0;

function initApp() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser && window.location.pathname.includes('project.html')) {
        window.location.href = 'index.html';
        return;
    }
   
    if (currentUser) {
        const userData = JSON.parse(localStorage.getItem(`user_${currentUser}`));
        document.getElementById('profileUsername').textContent = userData.username;
        document.getElementById('profileEmail').textContent = userData.email;
       
        loadMovies();
    }
}

function showSection(section) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
   
    document.getElementById(`${section}Section`).classList.remove('hidden');
    document.getElementById(`nav${section.charAt(0).toUpperCase() + section.slice(1)}`).classList.add('active');
   
    const watchTabs = document.getElementById('watchTabs');
    const aboutTabs = document.getElementById('aboutTabs');
   
    if (section === 'home') {
        watchTabs.classList.remove('hidden');
        aboutTabs.classList.add('hidden');
        currentSection = 'home';
        loadMovies();
    } else if (section === 'favorite') {
        watchTabs.classList.add('hidden');
        aboutTabs.classList.add('hidden');
        currentSection = 'favorite';
        loadFavorites();
    } else if (section === 'profile') {
        watchTabs.classList.add('hidden');
        aboutTabs.classList.add('hidden');
    } else if (section === 'about') {
        watchTabs.classList.add('hidden');
        aboutTabs.classList.remove('hidden');
    }
}

function switchTab(tab) {
    currentTab = tab;
   
    document.getElementById('watchingTab').classList.toggle('active', tab === 'watching');
    document.getElementById('watchedTab').classList.toggle('active', tab === 'watched');
   
    // Clear search when switching tabs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
   
    loadMovies();
}

function switchAboutTab(tab) {
    document.getElementById('aboutMwmTab').classList.toggle('active', tab === 'about');
    document.getElementById('developersTab').classList.toggle('active', tab === 'developers');
   
    document.getElementById('aboutMwmContent').classList.toggle('hidden', tab !== 'about');
    document.getElementById('developersContent').classList.toggle('hidden', tab !== 'developers');
}

function getMovies(type) {
    const currentUser = localStorage.getItem('currentUser');
    const key = `movies_${type}_${currentUser}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function saveMovies(type, movies) {
    const currentUser = localStorage.getItem('currentUser');
    const key = `movies_${type}_${currentUser}`;
    localStorage.setItem(key, JSON.stringify(movies));
}

// ==================== SEARCH FUNCTIONALITY ====================
function searchMovies() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
   
    const grid = document.getElementById('moviesGrid');
    const movies = getMovies(currentTab);
   
    // Clear grid but keep the add button for watching tab
    grid.innerHTML = '';
   
    if (currentTab === 'watching') {
        const addCard = document.createElement('div');
        addCard.className = 'add-movie-card';
        addCard.onclick = openAddMovieModal;
        addCard.innerHTML = `
            <div class="add-icon">+</div>
            <p class="add-text">ADD MOVIE</p>
        `;
        grid.appendChild(addCard);
    }
   
    // Filter movies based on search term
    const filteredMovies = searchTerm === '' ? movies : movies.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm) ||
        movie.genre.toLowerCase().includes(searchTerm) ||
        movie.releaseDate.includes(searchTerm)
    );
   
    filteredMovies.forEach((movie, index) => {
        const card = createMovieCard(movie, index);
        grid.appendChild(card);
    });
   
    // Show message if no results found
    if (filteredMovies.length === 0 && searchTerm !== '') {
        const noResults = document.createElement('div');
        noResults.style.cssText = 'color: #ffffff; font-size: 18px; text-align: center; width: 100%; font-family: var(--content-font); margin-top: 50px;';
        noResults.textContent = 'No movies found matching your search.';
        grid.appendChild(noResults);
    }
}

function searchFavorites() {
    const searchInput = document.getElementById('favoriteSearchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
   
    const grid = document.getElementById('favoriteGrid');
    const favorites = getMovies('favorite');
   
    grid.innerHTML = '';
   
    // Filter favorites based on search term
    const filteredFavorites = searchTerm === '' ? favorites : favorites.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm) ||
        movie.genre.toLowerCase().includes(searchTerm) ||
        movie.releaseDate.includes(searchTerm)
    );
   
    if (filteredFavorites.length === 0) {
        if (searchTerm === '') {
            grid.innerHTML = '<p style="color: #ffffff; font-size: 20px; text-align: center; width: 100%; font-family: var(--content-font);">No favorite movies yet.</p>';
        } else {
            grid.innerHTML = '<p style="color: #ffffff; font-size: 18px; text-align: center; width: 100%; font-family: var(--content-font); margin-top: 50px;">No favorites found matching your search.</p>';
        }
        return;
    }
   
    filteredFavorites.forEach((movie, index) => {
        const card = document.createElement('div');
        card.className = 'movie-card';
       
        const ratingDisplay = movie.rating ? `<p>RATINGS: ${'★'.repeat(movie.rating)}${'☆'.repeat(5-movie.rating)}</p>` : '';
       
        card.innerHTML = `
            <div class="movie-info">
                <p>TITLE: ${movie.title}</p>
                <p>GENRE: ${movie.genre}</p>
                <p>DATE RELEASED: ${movie.releaseDate}</p>
                ${ratingDisplay}
            </div>
            <div class="movie-actions">
                <button class="movie-btn btn-delete" onclick="removeFavorite(${index})">REMOVE</button>
            </div>
        `;
       
        grid.appendChild(card);
    });
}

function loadMovies() {
    const grid = document.getElementById('moviesGrid');
    const movies = getMovies(currentTab);
   
    grid.innerHTML = '';
   
    if (currentTab === 'watching') {
        const addCard = document.createElement('div');
        addCard.className = 'add-movie-card';
        addCard.onclick = openAddMovieModal;
        addCard.innerHTML = `
            <div class="add-icon">+</div>
            <p class="add-text">ADD MOVIE</p>
        `;
        grid.appendChild(addCard);
    }
   
    movies.forEach((movie, index) => {
        const card = createMovieCard(movie, index);
        grid.appendChild(card);
    });
}

function createMovieCard(movie, index) {
    const card = document.createElement('div');
    card.className = 'movie-card';
   
    let buttons = '';
    let infoLines = '';
   
    if (currentTab === 'watching') {
        buttons = `
            <button class="movie-btn btn-finish" onclick="finishMovie(${index})">FINISH</button>
            <button class="movie-btn btn-delete" onclick="deleteMovie(${index})">DELETE</button>
        `;
        infoLines = `
            <p>TITLE: ${movie.title}</p>
            <p>GENRE: ${movie.genre}</p>
            <p>DATE RELEASED: ${movie.releaseDate}</p>
            <p>DATE ADDED: ${new Date(movie.addedAt).toLocaleDateString()}</p>
        `;
    } else {
        const isFav = isFavorite(movie);
        buttons = `
            <button class="movie-btn btn-rate" onclick="openRateModal(${index})">RATE</button>
            <button class="movie-btn btn-favorite ${isFav ? 'active' : ''}" onclick="toggleFavorite(${index})">FAVORITE</button>
        `;
        const ratingDisplay = movie.rating ? `<p>RATINGS: ${'★'.repeat(movie.rating)}${'☆'.repeat(5-movie.rating)}</p>` : '';
        const commentsDisplay = movie.comments ? `<p>COMMENT: ${movie.comments}</p>` : '';
        infoLines = `
            <p>TITLE: ${movie.title}</p>
            <p>GENRE: ${movie.genre}</p>
            <p>DATE RELEASED: ${movie.releaseDate}</p>
            <p>DATE ADDED: ${new Date(movie.addedAt).toLocaleDateString()}</p>
            ${ratingDisplay}
            ${commentsDisplay}
        `;
    }
   
    card.innerHTML = `
        <div class="movie-info">
            ${infoLines}
        </div>
        <div class="movie-actions">
            ${buttons}
        </div>
    `;
   
    return card;
}

function openAddMovieModal() {
    document.getElementById('addMovieModal').classList.remove('hidden');
}

function closeAddMovieModal() {
    document.getElementById('addMovieModal').classList.add('hidden');
    document.getElementById('addMovieForm').reset();
}

document.getElementById('addMovieForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
   
    const movie = {
        title: document.getElementById('movieTitle').value,
        genre: document.getElementById('movieGenre').value,
        releaseDate: document.getElementById('movieReleaseDate').value,
        rating: 0,
        comments: '',
        addedAt: new Date().toISOString()
    };
   
    const movies = getMovies('watching');
    movies.push(movie);
    saveMovies('watching', movies);
   
    closeAddMovieModal();
    loadMovies();
    showToast('Movie added!');
});

function finishMovie(index) {
    const watching = getMovies('watching');
    const movie = watching.splice(index, 1)[0];
   
    saveMovies('watching', watching);
   
    const watched = getMovies('watched');
    watched.push(movie);
    saveMovies('watched', watched);
   
    loadMovies();
    showToast('Moved to watched!');
}

function deleteMovie(index) {
    const movies = getMovies(currentTab);
    movies.splice(index, 1);
    saveMovies(currentTab, movies);
    loadMovies();
    showToast('Movie deleted!');
}

function openRateModal(index) {
    currentRatingMovie = index;
    selectedRating = 0;
   
    const movies = getMovies('watched');
    const movie = movies[index];
   
    if (movie.rating) {
        selectedRating = movie.rating;
        updateStarDisplay();
    }
   
    if (movie.comments) {
        document.getElementById('movieComments').value = movie.comments;
    } else {
        document.getElementById('movieComments').value = '';
    }
   
    document.getElementById('rateModal').classList.remove('hidden');
   
    document.querySelectorAll('.star').forEach(star => {
        star.onclick = function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStarDisplay();
        };
    });
}

function updateStarDisplay() {
    document.querySelectorAll('.star').forEach(star => {
        const rating = parseInt(star.dataset.rating);
        star.classList.toggle('active', rating <= selectedRating);
    });
}

function closeRateModal() {
    document.getElementById('rateModal').classList.add('hidden');
    document.getElementById('movieComments').value = '';
    selectedRating = 0;
    updateStarDisplay();
}

function submitRating() {
    if (selectedRating === 0) {
        alert('Please select a rating!');
        return;
    }
   
    const movies = getMovies('watched');
    movies[currentRatingMovie].rating = selectedRating;
    movies[currentRatingMovie].comments = document.getElementById('movieComments').value;
   
    saveMovies('watched', movies);
    closeRateModal();
    loadMovies();
    showToast('Rating saved!');
}

function isFavorite(movie) {
    const favorites = getMovies('favorite');
    return favorites.some(fav =>
        fav.title === movie.title &&
        fav.releaseDate === movie.releaseDate
    );
}

function toggleFavorite(index) {
    const watched = getMovies('watched');
    const movie = watched[index];
    const favorites = getMovies('favorite');
   
    const existingIndex = favorites.findIndex(fav =>
        fav.title === movie.title &&
        fav.releaseDate === movie.releaseDate
    );
   
    if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
        saveMovies('favorite', favorites);
        showToast('Removed from favorites!');
    } else {
        favorites.push({...movie});
        saveMovies('favorite', favorites);
        showToast('ADDED TO FAVORITE!');
    }
   
    loadMovies();
}

function loadFavorites() {
    const grid = document.getElementById('favoriteGrid');
    const favorites = getMovies('favorite');
   
    grid.innerHTML = '';
   
    if (favorites.length === 0) {
        grid.innerHTML = '<p style="color: #ffffff; font-size: 20px; text-align: center; width: 100%; font-family: var(--content-font);">No favorite movies yet.</p>';
        return;
    }
   
    favorites.forEach((movie, index) => {
        const card = document.createElement('div');
        card.className = 'movie-card';
       
        const ratingDisplay = movie.rating ? `<p>RATINGS: ${'★'.repeat(movie.rating)}${'☆'.repeat(5-movie.rating)}</p>` : '';
       
        card.innerHTML = `
            <div class="movie-info">
                <p>TITLE: ${movie.title}</p>
                <p>GENRE: ${movie.genre}</p>
                <p>DATE RELEASED: ${movie.releaseDate}</p>
                ${ratingDisplay}
            </div>
            <div class="movie-actions">
                <button class="movie-btn btn-delete" onclick="removeFavorite(${index})">REMOVE</button>
            </div>
        `;
       
        grid.appendChild(card);
    });
}

function removeFavorite(index) {
    const favorites = getMovies('favorite');
    favorites.splice(index, 1);
    saveMovies('favorite', favorites);
    loadFavorites();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
   
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', initApp);
A
