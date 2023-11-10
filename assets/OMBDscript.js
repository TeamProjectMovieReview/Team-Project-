$(document).ready(function() {
    var apiKey = '7b82484f';

    // Function to fetch movie data from OMDB API
    var fetchMovies = function(searchTerm) {
        var apiUrl = `https://www.omdbapi.com/?apikey=${apiKey}&s=${searchTerm}`;

        return new Promise(function(resolve, reject) {
            $.ajax({
                url: apiUrl,
                success: function(data) {
                    if (data.Search) {
                        resolve(data.Search);
                    } else {
                        reject('No movies found');
                    }
                    console.log(data)
                },
            });
        });
    };


    // Function to populate movies in the container
    var populateMovies = function(movies, container) {
        movies.forEach(function(movie) {
            var title = movie.Title;
            var poster = movie.Poster;

            console.log(title)

            var movieCard = 
            `<div class="media-card">
                <img src="${poster}" alt="${title}">
                <p>${title}</p>
            </div>`;

            container.append(movieCard);
        });
    };

    // Call the fetchMovies function for each section using classes
    fetchMovies('2023')
        .then(function(movies) {
            populateMovies(movies, $('.top-movies .media-scroller'));
        })

    fetchMovies('Cool')
        .then(function(movies) {
            populateMovies(movies, $('.suggested-movies .media-scroller'));
        })
});