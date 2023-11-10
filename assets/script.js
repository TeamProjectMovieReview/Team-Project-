$(document).ready(function() {
    var omdbApiKey = '7b82484f';
    var youtubeApiKey = 'AIzaSyDPU8IN-u247_xtIkgR5GdC_5ByMJiXW2w'; 

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
        const iframe = $('<iframe>', {
            width: 560,
            height: 315,
            src: `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`,
            frameborder: 0,
            allow: 'autoplay; encrypted-media',
            allowfullscreen: true
        });

        $('#videoPopup').empty().append(iframe);
        $('#videoContainer').show();
    }

    // Function to populate movies in the container
    var populateMovies = function(movies, container) {
        movies.forEach(function(movie) {
            var title = movie.Title;
            var poster = movie.Poster;

            var movieCard = 
            `<div class="media-card">
                <img src="${poster}" alt="${title}">
                <p>${title}</p>
                <button class="watch-trailer-button" data-movie-title="${title}">Watch Trailer</button>
            </div>`;

            container.append(movieCard);
        });

        // Attach event listeners to the newly created buttons
        $('.watch-trailer-button').on('click', function() {
            let movieTitle = $(this).data('movie-title');
            searchYouTube(movieTitle, 1)
                .then(data => showTrailerPopup(data.videoId, data.startTime))
                .fail(error => console.error(error));
        });
    };

    // Function to fetch movie data from OMDB API
    var fetchMovies = function(searchTerm) {
        var apiUrl = `https://www.omdbapi.com/?apikey=${omdbApiKey}&s=${searchTerm}`;

        return new Promise(function(resolve, reject) {
            $.ajax({
                url: apiUrl,
                success: function(data) {
                    if (data.Search) {
                        resolve(data.Search);
                    } else {
                        reject('No movies found');
                    }
                },
                error: function() {
                    reject('Error fetching data');
                }
            });
        });
    };

    // Call the fetchMovies function for each section using classes
    fetchMovies('2023')
        .then(function(movies) {
            populateMovies(movies, $('.top-movies .media-scroller'));
        })
        .catch(function(error) {
            console.error(error);
        });

    fetchMovies('Cool')
        .then(function(movies) {
            populateMovies(movies, $('.suggested-movies .media-scroller'));
        })
        .catch(function(error) {
            console.error(error);
        });

    $('#closePopup').on('click', function() {
        $('#videoContainer').hide();
        $('#videoPopup').empty(); 
    });

    // Search bar functionality 
    // Add event listener to search button that uses search bar text value 
    // Use the text value as the searchTerm for fetchMovies 
    // Populate movies in the search container using data from that search 


});
