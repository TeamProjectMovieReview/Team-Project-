const apiKey = 'AIzaSyCqW48cryog9NQLaXZPRd8prjOUo9vyMKs';
const apiUrl = 'https://www.googleapis.com/youtube/v3/search';

const movieSearchBox = document.getElementById('searchMovies');
const searchList = document.getElementById('search-list');
const resultGrid = document.getElementById('result-grid');
const youtubeResultsContainer = document.getElementById('results'); // Add this line

// Load movies from API
async function loadMovies(searchTerm) {
    const omdbUrl = `https://omdbapi.com/?s=${searchTerm}&page=1&apikey=7b82484f`;
    const omdbResponse = await fetch(omdbUrl);
    const omdbData = await omdbResponse.json();

    if (omdbData.Response === 'True') {
        displayMovieList(omdbData.Search);
    }
}

// Display search results
function displayResults(items) {
    youtubeResultsContainer.innerHTML = ''; // Update results container

    items.forEach((item) => {
        const videoId = item.id.videoId;
        const title = item.snippet.title;

        const videoElement = document.createElement('iframe');
        videoElement.width = 300;
        videoElement.height = 200;
        videoElement.src = `https://www.youtube.com/embed/${videoId}`;
        videoElement.title = title;

        youtubeResultsContainer.appendChild(videoElement); // Update container
    });
}

// Search for movies using the YouTube API
function searchMovies(keyword) {
    const maxResults = 10;
    const youtubeRequestUrl = `${apiUrl}?part=snippet&maxResults=${maxResults}&q=${keyword}&type=video&key=${apiKey}`;

    fetch(youtubeRequestUrl)
        .then((response) => response.json())
        .then((data) => {
            displayResults(data.items);
        })
        .catch((error) => console.error('Error:', error));
}

// Event listener for the search button
document.getElementById('searchButton').addEventListener('click', () => {
    const searchBox = document.getElementById('searchMovies');
    const keyword = searchBox.value.trim();
    
    if (keyword.length > 0) {
        searchList.classList.remove('hide-search-list');
        loadMovies(keyword);
        searchMovies(keyword);
    } else {
        searchList.classList.add('hide-search-list');
    }
});

// Rest of your existing functions (findMovies, displayMovieList, loadMovieDetails, displayMovieDetails) remain unchanged.
