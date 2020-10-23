(function main() {
    const config = {
        SEARCH_FORM: '#searchForm',
        SUBMIT_BUTTON: '#submitButton',
        TERM: '#term',
        MEDIA: '#media',
        LIMIT: '#limit'
    }

    document.addEventListener('DOMContentLoaded', iTunesDataHandler)


    function iTunesDataHandler() {
        let searchForm = document.querySelector(config.SEARCH_FORM);
        let submitButton = searchForm.querySelector(config.SUBMIT_BUTTON);

        submitButton.addEventListener('click', searchFormClickHandler);
    }

    async function iTunesDataFetcher() {
        let searchForm = document.querySelector(config.SEARCH_FORM);
        let baseUrl = searchForm.dataset.url;

        let searchConfig = {
            term: searchForm.querySelector(config.TERM).value,
            media: searchForm.querySelector(config.MEDIA).value,
            limit: searchForm.querySelector(config.LIMIT).value
        };

        let searchUrl = generateSearchUrl(baseUrl, searchConfig);
        let rawResult = await fetchJsonp(searchUrl);
        let iTunesDataObject = await rawResult.json();

        return iTunesDataObject;
    }

    function generateSearchUrl(baseUrl, searchConfig) {
        const keys = Object.keys(searchConfig);
        let mappedString = keys.map(key => `${key}=${searchConfig[key]}`);
        let joinedString = mappedString.join('&');
        let searchUrl = encodeURI(`${baseUrl}?${joinedString}`);

        return searchUrl;
    }

    function searchFormClickHandler(e) {
        e.preventDefault();
        let searchResultOutlet = document.querySelector('#searchResultOutlet');

        removeAllChildNodes(searchResultOutlet);

        // Debugging Purposes
        iTunesDataFetcher().then((iTunesDataObject) => {
            console.log(iTunesDataObject);
            generateSearchResults(iTunesDataObject);
        });
    }

    async function generateSearchResultEntry(entry) {
        let mustache = await fetch('searchResultEntry.mustache');
        let response = await mustache.text();
        let rendered = Mustache.render(response, {
            artist: entry.artistName,
            track: entry.trackName,
            collection: entry.collectionName,
            artwork: entry.artworkUrl100,
            artistUrl: entry.artistViewUrl,
            trackUrl: entry.trackViewUrl,
            previewUrl: entry.previewUrl
        });

        searchResultEntry = document.createElement('div');
        searchResultEntry.innerHTML = rendered;
        searchResultOutlet.appendChild(searchResultEntry.firstChild);
    }

    async function generateSearchResults(iTunesDataObject) {
        let mustache = await fetch('searchResultHeader.mustache');
        let response = await mustache.text();
        let rendered = Mustache.render(response, {
            resultCount: iTunesDataObject.resultCount
        });

        searchResultHeader = document.createElement('div');
        searchResultHeader.innerHTML = rendered;
        searchResultOutlet.appendChild(searchResultHeader.firstChild);

        iTunesDataObject.results.forEach(generateSearchResultEntry);
    }

    function removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }
})()
