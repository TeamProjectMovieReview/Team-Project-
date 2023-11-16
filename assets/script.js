    // Api keys
    var omdbApiKey = '7b82484f';
    var youtubeApiKey = 'AIzaSyDPU8IN-u247_xtIkgR5GdC_5ByMJiXW2w';


$(document).ready(function () {

    // Function to populate movies in the container
    var populateMovies = function (movies, container) {
        movies.forEach(function (movie) {
            var title = movie.Title;
            var poster = movie.Poster;

            var movieCard = `
            <div class="media-card">
                <img src="${poster}" alt="${title}">
                <p>${title}</p>
                <button class="watch-trailer-button" data-movie-title="${title}">Watch Trailer</button>
                <button class="favorite-button" data-movie='${JSON.stringify(movie)}'>Add ⭐</button>
            </div>`;

            container.append(movieCard);
        });

        // Watch trailer button functionality
        $('.watch-trailer-button').on('click', function () {
            let movieTitle = $(this).data('movie-title');
            searchYouTube(movieTitle, 1)
                .then(data => showTrailerPopup(data.videoId, data.startTime))
                .fail(error => console.error(error));
        });
    };

    // Function to fetch movie data from OMDB API
    var fetchMovies = function (searchTerm) {
        var apiUrl = `https://www.omdbapi.com/?apikey=${omdbApiKey}&s=${searchTerm}`;

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: apiUrl,
                success: function (data) {
                    if (data.Search) {
                        resolve(data.Search);
                    } else {
                        reject('No movies found');
                    }
                },
                error: function () {
                    reject('Error fetching data');
                }
            });
        });
    };

    // Function to shuffle an array
        function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }


    // Call the fetchMovies function for each section using classes
    fetchMovies('2023')
        .then(function (movies) {
            // Shuffle the movies array
            let shuffledMovies = shuffleArray(movies);
            populateMovies(movies, $('.top-movies .media-scroller'));
        })
        .catch(function (error) {
            console.error(error);
        });

    fetchMovies('Cool')
    .then(function (movies) {
        // Shuffle the movies array
        let shuffledMovies = shuffleArray(movies);
        populateMovies(shuffledMovies, $('.suggested-movies .media-scroller'));
    })
    .catch(function (error) {
        console.error(error);
    });
});

// Hide results 
    $('aside').hide();


// YouTube api functionality
    // Function to parse ISO 8601 duration returned by YouTube API
    function parseDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        let hours = (parseInt(match[1], 10) || 0);
        let minutes = (parseInt(match[2], 10) || 0);
        let seconds = (parseInt(match[3], 10) || 0);
        return hours * 3600 + minutes * 60 + seconds;
    }

    // Function to search YouTube for trailers, fetch details, and return a random video ID with a start time
    function searchYouTube(query, maxResults) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)} trailer&key=${youtubeApiKey}&maxResults=${maxResults}&type=video`;
        return $.getJSON(searchUrl).then(data => {
            if (data.items.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.items.length);
                const videoId = data.items[randomIndex].id.videoId;
                return $.getJSON(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${youtubeApiKey}`).then(details => {
                    const duration = details.items[0].contentDetails.duration;
                    const durationInSeconds = parseDuration(duration);
                    if (durationInSeconds > 30) {
                        const startTime = Math.floor(Math.random() * (durationInSeconds - 30));
                        return { videoId, startTime };
                    } else {
                        return $.Deferred().reject("Video is too short for 30-second playback.").promise();
                    }
                });
            } else {
                return $.Deferred().reject("No trailers found for " + query).promise();
            }
        });
    }

    // Function to create and show the trailer popup
    function showTrailerPopup(videoId, startTime) {
        console.log(videoId, startTime);
        const iframe = $('<iframe>', {
            width: 560,
            height: 315,
            src: `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`,
            frameborder: 0,
            allow: 'autoplay; encrypted-media',
            allowfullscreen: true
        });

        $('#videoPopup').empty().append(iframe);
        $('aside').show();

    }

    // Close Pop-up function 
    $('#closePopup').on('click', function () {
        $('#videoContainer').hide();
        $('#videoPopup').empty();
    });

    // Adding to favorites function
    function handleFavoriteButtonClick() {
        $('body').on('click', '.favorite-button', function () {
            var movieData = $(this).data('movie');
            var favorites = JSON.parse(localStorage.getItem('favorites')) || [];

            // Check if the movie is already in favorites to prevent duplicates
            if (!favorites.some(favorite => favorite.imdbID === movieData.imdbID)) {
                favorites.push(movieData);
                localStorage.setItem('favorites', JSON.stringify(favorites));

                // Add this movie to the favorites section immediately
                addToFavoritesSection(movieData);
            }
        });

        // Remove from Favorites button
        $('body').on('click', '.remove-button', function () {
            var movieId = $(this).data('movie-id');
            removeFromFavorites(movieId);
        });
    }


    // Function to add a movie to the favorites section in the DOM
    function addToFavoritesSection(movie) {
        var movieCard = `
            <div class="media-card" data-movie-id="${movie.imdbID}">
                <img src="${movie.Poster}" alt="${movie.Title}">
                <p>${movie.Title}</p>
                <button class="watch-trailer-button" data-movie-title="${movie.Title}">Watch Trailer</button>
                <button class="remove-button" data-movie-id="${movie.imdbID}">Remove ⭐</button>
            </div>`;

        $('.favorite-movies .media-scroller').append(movieCard);

        // Watch trailer button functionality
        $('.watch-trailer-button').on('click', function () {
            let movieTitle = $(this).data('movie-title');
            searchYouTube(movieTitle, 1)
                .then(data => showTrailerPopup(data.videoId, data.startTime))
                .fail(error => console.error(error));
        });
    }

    // Function to remove a movie from the favorites section
    function removeFromFavorites(movieId) {
        var favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        
        // Find the index of the movie with the given ID in the favorites array
        var index = favorites.findIndex(movie => movie.imdbID === movieId);
        
        if (index !== -1) {
            // Remove the movie from the favorites array
            favorites.splice(index, 1);
            
            // Update the local storage
            localStorage.setItem('favorites', JSON.stringify(favorites));
        
            removeMovieFromDOM(movieId);
        }
    }
    
    // Function to remove movie card
    function removeMovieFromDOM(movieId) {
        var cardToRemove = $(`.favorite-movies .media-scroller .media-card[data-movie-id="${movieId}"]`);
        cardToRemove.remove();
    }
    

    // Function to load favorites
    function loadFavorites() {
        var favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        var favoritesContainer = $('.favorite-movies .media-scroller');
        favoritesContainer.empty();

        // Log the favorites to the console
        console.log("Saved Favorites:", favorites);

        favorites.forEach(function (movie) {
            addToFavoritesSection(movie)
        });
    }

    // Call functions to handle favorites
    handleFavoriteButtonClick();
    loadFavorites();


    
// Variables for search bar 
const movieSearchBox = document.getElementById('movie-search-box');
const searchList = document.getElementById('search-list');
const resultGrid = document.getElementById('result-grid');
const resultsContainer = document.getElementById('results-container');

// load movies from API
function loadMovies(searchTerm) {
    const URL = `https://omdbapi.com/?s=${searchTerm}&page=1&apikey=7b82484f`;

    $.ajax({
        url: URL,
        method: 'GET',
        dataType: 'json'
    })
    .done((data) => {
        if (data.Response === "True") {
            displayMovieList(data.Search);
        }
    })
    .fail((error) => {
        console.error('Error loading movies:', error);
    });
}

function findMovies() {
    const searchTerm = movieSearchBox.value.trim();
    searchList.classList.toggle('hide-search-list', searchTerm.length === 0);

    if (searchTerm.length > 0) {
        loadMovies(searchTerm);
    }
}

function displayMovieList(movies) {
    searchList.innerHTML = movies.map(movie => {
        const moviePoster = movie.Poster !== "N/A" ? movie.Poster : "image_not_found.png";

        return `
            <div class="search-list-item" data-id="${movie.imdbID}">
                <div class="search-item-thumbnail">
                    <img src="${moviePoster}">
                </div>
                <div class="search-item-info">
                    <h2>${movie.Title}</h2>
                    <p>${movie.Year}</p>
                </div>
            </div>`;
    }).join('');

    loadMovieDetails();
    resultsContainer.style.display = 'block';
}

function loadMovieDetails() {
    searchList.addEventListener('click', async (event) => {
        const movie = event.target.closest('.search-list-item');

        if (movie) {
            searchList.classList.add('hide-search-list');
            movieSearchBox.value = "";

            try {
                const result = await fetch(`https://www.omdbapi.com/?i=${movie.dataset.id}&apikey=7b82484f`);
                const movieDetails = await result.json();
                displayMovieDetails(movieDetails);
            } catch (error) {
                console.error('Error loading movie details:', error);
            }
        }
    });
}

// Display movie details for selected movie
function displayMovieDetails(movie) {
    resultGrid.innerHTML = `
        <div class="movie-poster" style="display: flex;">
            <img src="${movie.Poster !== "N/A" ? movie.Poster : "image_not_found.png"}" alt="movie poster">
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.Title}</h3>
            <ul class="movie-misc-info">
                <li class="year">Year: ${movie.Year}</li>
                <li class="rated">Ratings: ${movie.Rated}</li>
                <li class="released">Released: ${movie.Released}</li>
            </ul>
            <p class="genre"><b>Genre:</b> ${movie.Genre}</p>
            <p class="writer"><b>Writer:</b> ${movie.Writer}</p>
            <p class="actors"><b>Actors: </b>${movie.Actors}</p>
            <p class="plot"><b>Plot:</b> ${movie.Plot}</p>
            <p class="language"><b>Language:</b> ${movie.Language}</p>
            <p class="awards"><b><i class="fas fa-award"></i></b> ${movie.Awards}</p>
            <button class="watch-trailer-button" data-movie-title="${movie.Title}">Watch Trailer</button>
            <button class="favorite-button" data-movie='${JSON.stringify(movie)}'>Add ⭐</button>
        </div>`;

        // Watch trailer button functionality 
        $('.results-container').on('click', '.watch-trailer-button', function () {
            let movieTitle = $(this).data('movie-title');
            searchYouTube(movieTitle, 1)
                .then(data => showTrailerPopup(data.videoId, data.startTime));
        });

        // Add to favorites button functionality 
        $('.watch-trailer-button').on('click', function () {
            let movieTitle = $(this).data('movie-title');
            console.log(movieTitle, "LOOK")
            searchYouTube(movieTitle, 1)
                .then(data => showTrailerPopup(data.videoId, data.startTime))
                .fail(error => console.error(error));

                
        

        // Check if the movie is already in favorites to prevent duplicates
        if (!favorites.some(favorite => favorite.imdbID === movieData.imdbID)) {
            favorites.push(movieData);
            localStorage.setItem('favorites', JSON.stringify(favorites));

            // Add this movie to the favorites section immediately
            addToFavoritesSection(movieData);
        }
        });
}

window.addEventListener('click', (event) => {
    if (event.target.className !== "form-control") {
        searchList.classList.add('hide-search-list');
    }
});

