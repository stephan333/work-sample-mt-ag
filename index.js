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

        // Debugging Purposes
        iTunesDataFetcher().then((iTunesDataObject) => {
            console.log(iTunesDataObject);

            // Hier weitermachen
            let searchResultOutlet = document.querySelector('#searchResultOutlet');
            let numSearchResults = document.createElement('span');
            let entry

            numSearchResults.innerHTML = `Es wurden ${iTunesDataObject.resultCount} Ergebnisse gefunden:`;
            searchResultOutlet.innerHTML = '';
            searchResultOutlet.appendChild(numSearchResults);

            iTunesDataObject.results.forEach(entry => {
                console.log(entry.artistName);
                template = document.createElement('div')
                template.innerHTML = `${entry.artistName} - ${entry.collectionName}`;
                searchResultOutlet.appendChild(template);
            });
        });
    }
})()
