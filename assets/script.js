$(document).ready(function () {

    // Api keys
    var omdbApiKey = '7b82484f';
    var youtubeApiKey = 'AIzaSyCqW48cryog9NQLaXZPRd8prjOUo9vyMKs';

    $('aside').hide();

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
                <button class="favorite-button" data-movie='${JSON.stringify(movie)}'>Add to Favorites</button>
            </div>`;

            container.append(movieCard);
        });

        // Attach event listeners to the newly created buttons
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


    // Close Pop-up function 
    $('#closePopup').on('click', function () {
        $('#videoContainer').hide();
        $('#videoPopup').empty();
    });

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
    }

    // Function to add a movie to the favorites section in the DOM
    function addToFavoritesSection(movie) {
        var movieCard = `
            <div class="media-card">
                <img src="${movie.Poster}" alt="${movie.Title}">
                <p>${movie.Title}</p>
            </div>`;

        $('.favorite-movies .media-scroller').append(movieCard);
    }

    // Function to load favorites
    function loadFavorites() {
        var favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        var favoritesContainer = $('.favorite-movies .media-scroller');
        favoritesContainer.empty();

        // Log the favorites to the console
        console.log("Saved Favorites:", favorites);

        favorites.forEach(function (movie) {
            var movieCard = `
            <div class="media-card">
                <img src="${movie.Poster}" alt="${movie.Title}">
                <p>${movie.Title}</p>
            </div>`;
            favoritesContainer.append(movieCard);
        });
    }

    // Call functions to handle favorites
    handleFavoriteButtonClick();
    loadFavorites();
});
