// scope
var appVersion = '0.1.0';

// scope, IIFE, namespace
(function main(window) {
    // var
    { 
        var currentAppVersion = window.appVersion;
        var currentSearchTerm = null;
    }

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
        let searchTerm = searchForm.querySelector(config.TERM).value;

        currentSearchTerm = searchTerm;

        let searchConfig = {
            term: searchTerm,
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
        let bodyElement = document.querySelector('#body');
        let notSearchedYet = document.querySelector('#searchResultsInfoText');
        let iTunesDataObject;

        e.preventDefault();
        showLoadingAnimation(true, bodyElement);
        notSearchedYet.style.display = 'none';
        removeAllChildNodes(searchResultOutlet);

        iTunesDataObject = await iTunesDataFetcher();

        if (iTunesDataObject.resultCount === 0) {
            let searchTerm = encodeURIComponent(currentSearchTerm);

            mustache = await fetch('templates/emptyResultSet.mustache');
            response = await mustache.text();
            rendered = Mustache.render(response, { searchTerm });
            searchResultEntry = document.createElement('div');
            searchResultEntry.innerHTML = rendered;
            searchResultOutlet.prepend(searchResultEntry.firstChild);
            showLoadingAnimation(false, bodyElement)
        } else {
            generateSearchResults(iTunesDataObject);
        }
    }

    // let scope
    async function generateSearchResultEntry(entry) {
        let mustache;
        let response;
        let rendered;
        let artist = entry.artistName;
        let releaseDate = englishToGermanDate(entry.releaseDate);
        let baseModel = {
            artist,
            collection: entry.collectionName,
            collectionViewUrl: entry.collectionViewUrl,
            artwork: entry.artworkUrl100,
            artistUrl: entry.artistViewUrl,
            releaseDate
        };

        if (entry.wrapperType === 'collection') {
            mustache = await fetch('templates/resultCollection.mustache');
            response = await mustache.text();
            rendered = Mustache.render(response, { ...baseModel });
        } else {
            let track = entry.trackName;
            let searchTerm = encodeURIComponent(`${artist} ${track}`);

            mustache = await fetch('templates/resultTrack.mustache');
            response = await mustache.text();

            rendered = Mustache.render(response, {
                ...baseModel,
                track,
                trackUrl: entry.trackViewUrl,
                previewUrl: entry.previewUrl,
                searchTerm
            });
        }

        searchResultEntry = document.createElement('div');
        searchResultEntry.innerHTML = rendered;
        searchResultOutlet.appendChild(searchResultEntry.firstChild);
    }

    async function generateSearchResults(iTunesDataObject) {
        let mustache = await fetch('templates/resultHeader.mustache');
        let response = await mustache.text();
        let rendered = Mustache.render(response, {
            resultCount: iTunesDataObject.resultCount
        });
        let bodyElement = document.querySelector('#body');

        searchResultHeader = document.createElement('div');
        searchResultHeader.innerHTML = rendered;
        searchResultOutlet.appendChild(searchResultHeader.firstChild);

        iTunesDataObject.results.forEach(generateSearchResultEntry);

        showLoadingAnimation(false, bodyElement);
    }

    function removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    async function showLoadingAnimation(toggleValue, targetNode) {
        let mustache = await fetch('templates/loadingAnimation.mustache');
        let response = await mustache.text();
        let rendered = Mustache.render(response);

        if (toggleValue === true) {
            animationNode = document.createElement('div');
            animationNode.innerHTML = rendered;
            targetNode.appendChild(animationNode.firstChild);
        } else {
            targetNode.removeChild(targetNode.lastChild);
        }
    }

    function englishToGermanDate(dateString) {
        return `${dateString.substr(8, 2)}.${dateString.substr(5, 2)}.${dateString.substr(0, 4)}`;
    }
})(window)
