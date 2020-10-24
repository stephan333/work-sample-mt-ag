// scope
var appVersion = '0.1.0';

// scope, IIFE, namespace
(function main(window) {
    { var currentAppVersion = window.appVersion; }

    console.log(`App-Version: ${currentAppVersion}`);

    const config = {
        SEARCH_FORM: '#searchForm',
        SUBMIT_BUTTON: '#submitButton',
        TERM: '#term',
        MEDIA: '#media',
        LIMIT: '#limit',
        ENTITY: '#entity'
    }

    document.addEventListener('DOMContentLoaded', iTunesDataHandler)

    // scope
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
            limit: searchForm.querySelector(config.LIMIT).value,
            entity: searchForm.querySelector(config.ENTITY).value
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

    // async-await
    async function searchFormClickHandler(e) {
        let searchResultOutlet = document.querySelector('#searchResultOutlet');
        let iTunesDataObject;
        let loadingAnimation = document.querySelector('#loadingAnimation');

        loadingAnimation.style.display = 'flex';
        e.preventDefault();
        removeAllChildNodes(searchResultOutlet);

        iTunesDataObject = await iTunesDataFetcher();
        generateSearchResults(iTunesDataObject);
    }

    // let scope
    async function generateSearchResultEntry(entry) {
        let mustache;
        let response;
        let rendered;
        let baseModel = {
            artist: entry.artistName,
            collection: entry.collectionName,
            collectionViewUrl: entry.collectionViewUrl,
            artwork: entry.artworkUrl100,
            artistUrl: entry.artistViewUrl
        };

        if (entry.wrapperType === 'collection') {
            mustache = await fetch('resultCollection.mustache');
            response = await mustache.text();
            rendered = Mustache.render(response, { ...baseModel });
        } else {
            mustache = await fetch('resultTrack.mustache');
            response = await mustache.text();
            rendered = Mustache.render(response, {
                ...baseModel,
                track: entry.trackName,
                trackUrl: entry.trackViewUrl,
                previewUrl: entry.previewUrl
            });
        }

        searchResultEntry = document.createElement('div');
        searchResultEntry.innerHTML = rendered;
        searchResultOutlet.appendChild(searchResultEntry.firstChild);
    }

    async function generateSearchResults(iTunesDataObject) {
        let mustache = await fetch('resultHeader.mustache');
        let response = await mustache.text();
        let rendered = Mustache.render(response, {
            resultCount: iTunesDataObject.resultCount
        });

        searchResultHeader = document.createElement('div');
        searchResultHeader.innerHTML = rendered;
        searchResultOutlet.appendChild(searchResultHeader.firstChild);

        iTunesDataObject.results.forEach(generateSearchResultEntry);

        loadingAnimation.style.display = 'none';
    }

    function removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }
})(window)
