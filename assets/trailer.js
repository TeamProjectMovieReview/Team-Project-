$(document).ready(function() {
    // Function to parse ISO 8601 duration returned by YouTube API
    function parseDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        let hours = (parseInt(match[1], 10) || 0);
        let minutes = (parseInt(match[2], 10) || 0);
        let seconds = (parseInt(match[3], 10) || 0);
        return hours * 3600 + minutes * 60 + seconds;
    }

    // Function to search YouTube for trailers to return a random video ID with a start time
    function searchYouTube(query, apiKey, maxResults) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=${maxResults}&type=video`;
        return $.getJSON(searchUrl).then(data => {
            if (data.items.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.items.length);
                const videoId = data.items[randomIndex].id.videoId;
                return $.getJSON(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`).then(details => {
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

    // Event listener for the show trailer button within a media card
    $('.showTrailer').on('click', function() {
        const $mediaCard = $(this).closest('.media-card');
        const movieTitle = $mediaCard.find('.movie-title').text(); 
        const apiKey = 'AIzaSyDPU8IN-u247_xtIkgR5GdC_5ByMJiXW2w'; 

        searchYouTube(movieTitle + ' trailer', apiKey, 1)
            .then(data => showTrailerPopup(data.videoId, data.startTime))
            .fail(error => console.error(error));
    });

    // Event listener for the close button of the trailer popup
    $('#closePopup').on('click', function() {
        $('#videoContainer').hide();
        $('#videoPopup').empty();
    });
});
