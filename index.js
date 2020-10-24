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
            let templateFile = 'templates/emptyResultSet.mustache';

            searchResultOutlet.prepend(await generateTemplate(templateFile, searchTerm));
            showLoadingAnimation(false, bodyElement)
        } else {
            generateSearchResults(iTunesDataObject);
        }
    }

    // let scope
    async function generateSearchResultEntry(entry) {
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
        let searchResultEntry;
        let templateFile;
        let templateVars;

        if (entry.wrapperType === 'collection') {
            templateFile = 'templates/resultCollection.mustache';
            searchResultEntry = await generateTemplate(templateFile, baseModel);
        } else {
            let track = entry.trackName;
            let searchTerm = encodeURIComponent(`${artist} ${track}`);

            templateFile = 'templates/resultCollection.mustache';
            templateVars = {
                ...baseModel,
                track,
                trackUrl: entry.trackViewUrl,
                previewUrl: entry.previewUrl,
                searchTerm
            };
            searchResultEntry = await generateTemplate(templateFile, templateVars);
        }

        searchResultOutlet.appendChild(searchResultEntry);
    }

    async function generateSearchResults(iTunesDataObject) {
        let bodyElement = document.querySelector('#body');
        let templateFile = 'templates/resultHeader.mustache'
        let templateVars = {
            resultCount: iTunesDataObject.resultCount
        };

        searchResultOutlet.appendChild(await generateTemplate(templateFile, templateVars));
        iTunesDataObject.results.forEach(generateSearchResultEntry);
        showLoadingAnimation(false, bodyElement);
    }

    function removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    async function showLoadingAnimation(toggleValue, targetNode) {
        if (toggleValue === true) {
            let templateFile = 'templates/loadingAnimation.mustache';
            targetNode.appendChild(await generateTemplate(templateFile));
        } else {
            let loadingAnimationNode = targetNode.lastChild;

            if (loadingAnimationNode.id = 'loadingAnimation') {
                targetNode.removeChild(loadingAnimationNode);
            }
        }
    }

    function englishToGermanDate(dateString) {
        return `${dateString.substr(8, 2)}.${dateString.substr(5, 2)}.${dateString.substr(0, 4)}`;
    }

    async function generateTemplate(template, templateVars = null) {
        let mustache = await fetch(template);
        let response = await mustache.text();
        let rendered = Mustache.render(response, templateVars);
    
        wrapperElement = document.createElement('div');
        wrapperElement.innerHTML = rendered;
        
        return wrapperElement.firstChild;
    }
})(window)

