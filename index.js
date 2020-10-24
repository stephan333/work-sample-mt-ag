// scope
var appVersion = '0.1.0';

// scope, IIFE, namespace
(function main(window) {
    // var
    {
        var currentAppVersion = window.appVersion;
        var currentSearchTerm = null;
        var currentSearchType = null;
    }

    console.log(`iTunes Medienkatalog App-Version: ${currentAppVersion}`);

    const element = {
        BODY: '#body',
        searchForm: {
            FORM: '#searchForm',
            SUBMIT_BTN: '#submitButton',
            TERM: '#term',
            MEDIA: '#media',
            LIMIT: '#limit',
            ENTITY: '#entity'
        },
        searchResult: {
            OUTLET: '#searchResultOutlet',
            INFO: '#searchResultsInfoText'
        }
    }

    document.addEventListener('DOMContentLoaded', iTunesDataHandler)

    // scope
    function iTunesDataHandler() {
        let searchForm = document.querySelector(element.searchForm.FORM);
        let submitButton = searchForm.querySelector(element.searchForm.SUBMIT_BTN);

        submitButton.addEventListener('click', searchFormClickHandler);
    }

    async function iTunesDataFetcher() {
        let searchForm = document.querySelector(element.searchForm.FORM);
        let baseUrl = searchForm.dataset.url;
        let term = searchForm.querySelector(element.searchForm.TERM).value;
        let entity = searchForm.querySelector(element.searchForm.ENTITY).value;

        currentSearchTerm = term;

        let searchConfig = {
            term,
            media: searchForm.querySelector(element.searchForm.MEDIA).value,
            limit: searchForm.querySelector(element.searchForm.LIMIT).value,
            entity
        };

        let searchUrl = generateSearchUrl(baseUrl, searchConfig);
        let rawResult = await fetchJsonp(searchUrl);
        let iTunesDataObject = await rawResult.json();

        if (entity === 'album') {
            currentSearchType = iTunesDataObject.resultCount === 1 ? 'Album' : 'Alben';
        } else {
            currentSearchType = iTunesDataObject.resultCount === 1 ? 'Track' : 'Tracks';
        }

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
        let searchResultOutlet = document.querySelector(element.searchResult.OUTLET);
        let bodyElement = document.querySelector(element.BODY);
        let notSearchedYet = document.querySelector(element.searchResult.INFO);
        let iTunesDataObject;

        e.preventDefault();
        showLoadingAnimation(true, bodyElement);
        notSearchedYet.style.display = 'none';
        removeAllChildNodes(searchResultOutlet);

        iTunesDataObject = await iTunesDataFetcher();

        if (iTunesDataObject.resultCount === 0) {
            let searchTerm = encodeURIComponent(currentSearchTerm);
            let templateFile = 'templates/emptyResultSet.mustache';

            searchResultOutlet.prepend(await generateTemplate(templateFile, { searchTerm }));
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

            templateFile = 'templates/resultTrack.mustache';
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
        let bodyElement = document.querySelector(element.BODY);
        let templateFile = 'templates/resultHeader.mustache';
        let resultCount = iTunesDataObject.resultCount;
        let resultCountString;

        resultCountString = resultCount === 1 ? ' ein' : `n ${resultCount}`;

        let templateVars = {
            resultCountString,
            resultType: currentSearchType
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

    // async-await
    async function generateTemplate(template, templateVars = null) {
        let mustache = await fetch(template);
        let response = await mustache.text();
        let rendered = Mustache.render(response, templateVars);

        wrapperElement = document.createElement('div');
        wrapperElement.innerHTML = rendered;

        return wrapperElement.firstChild;
    }
})(window)

