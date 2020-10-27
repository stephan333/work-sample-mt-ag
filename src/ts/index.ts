import Mustache from 'mustache';
import fetchJsonp from 'fetch-jsonp';

interface IBaseModel {
    artist: string;
    collection: string;
    collectionViewUrl: string;
    artwork: string;
    artistUrl: string;
    releaseDate: string;
}

(function main() {
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
    const currentAppVersion = '0.2.0';
    const searchResultOutlet: HTMLElement | null = document.querySelector(element.searchResult.OUTLET);
    let currentSearchTerm: string | null = '';
    let currentSearchType: string = '';

window.console.log(`App-Version: ${currentAppVersion}`);
    document.addEventListener('DOMContentLoaded', iTunesDataHandler)

    function iTunesDataHandler() {
        const searchForm = document.querySelector(element.searchForm.FORM);
        const submitButton: HTMLButtonElement | null = searchForm!.querySelector(element.searchForm.SUBMIT_BTN);

        submitButton!!.addEventListener('click', searchFormClickHandler);
    }

    async function iTunesDataFetcher() {
        const searchForm: HTMLFormElement | null = document.querySelector(element.searchForm.FORM);
        const searchTerm: HTMLInputElement | null = document.querySelector(element.searchForm.FORM);
        const searchEntity: HTMLInputElement | null = document.querySelector(element.searchForm.FORM);
        const searchMedia: HTMLSelectElement | null = document.querySelector(element.searchForm.MEDIA);
        const searchLimit: HTMLSelectElement | null = document.querySelector(element.searchForm.LIMIT);
        const baseUrl = searchForm?.dataset.url;
        const term = searchTerm!!.value;
        const entity = searchEntity!!.value;

        currentSearchTerm = term;

        const searchConfig = {
            term,
            media: searchMedia!!.value,
            limit: searchLimit!!.value,
            entity
        };

        const searchUrl = generateSearchUrl(baseUrl!!, searchConfig);
        const rawResult = await fetchJsonp(searchUrl);
        const iTunesDataObject = await rawResult.json();

        if (entity === 'album') {
            currentSearchType = iTunesDataObject.resultCount === 1 ? 'Album' : 'Alben';
        } else {
            currentSearchType = iTunesDataObject.resultCount === 1 ? 'Track' : 'Tracks';
        }

        return iTunesDataObject;
    }

    function generateSearchUrl(baseUrl: string, searchConfig: any) {
        const keys = Object.keys(searchConfig);
        const mappedString = keys.map(key => `${key}=${searchConfig[key]}`);
        const joinedString = mappedString.join('&');
        const searchUrl = encodeURI(`${baseUrl}?${joinedString}`);

        return searchUrl;
    }

    async function searchFormClickHandler(e: MouseEvent) {
        const bodyElement: HTMLBodyElement | null = document.querySelector(element.BODY);
        const notSearchedYet: HTMLDivElement | null = document.querySelector(element.searchResult.INFO);
        let iTunesDataObject;

        e.preventDefault();
        showLoadingAnimation(true, bodyElement!!);
        notSearchedYet!!.style.display = 'none';
        removeAllChildNodes(searchResultOutlet!!);

        iTunesDataObject = await iTunesDataFetcher();

        if (iTunesDataObject.resultCount === 0) {
            const searchTerm = encodeURIComponent(currentSearchTerm!!);
            const templateFile = 'templates/emptyResultSet.mustache';
            const node = await generateTemplate(templateFile, { searchTerm });

            if (node !== null) {
                searchResultOutlet!!.prepend();
            }

            showLoadingAnimation(false, bodyElement!!)
        } else {
            generateSearchResults(iTunesDataObject);
        }
    }

    async function generateSearchResultEntry(entry: any) {
        const artist = entry.artistName;
        const releaseDate = englishToGermanDate(entry.releaseDate);
        const baseModel: IBaseModel = {
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
            const track = entry.trackName;
            const searchTerm = encodeURIComponent(`${artist} ${track}`);

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

        searchResultOutlet!!.appendChild(searchResultEntry!!);
    }

    async function generateSearchResults(iTunesDataObject: any) {
        const bodyElement: HTMLBodyElement | null = document.querySelector(element.BODY);
        const templateFile = 'templates/resultHeader.mustache';
        const resultCount = iTunesDataObject.resultCount;
        let resultCountString;

        resultCountString = resultCount === 1 ? ' ein' : `n ${resultCount}`;

        const templateVars = {
            resultCountString,
            resultType: currentSearchType
        };
        const node = await generateTemplate(templateFile, templateVars);

        searchResultOutlet!!.appendChild(node!!);
        iTunesDataObject.results.forEach(generateSearchResultEntry);
        showLoadingAnimation(false, bodyElement!!);
    }

    function removeAllChildNodes(parent: HTMLElement) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    async function showLoadingAnimation(toggleValue: boolean, targetNode: HTMLElement) {
        if (toggleValue === true) {
            const templateFile = 'templates/loadingAnimation.mustache';
            const node = await generateTemplate(templateFile);

            if (node !== null) {
                targetNode.appendChild(node);
            }
        } else {
            const loadingAnimationNode: HTMLElement = targetNode.lastChild as HTMLElement;

            if (loadingAnimationNode.id === 'loadingAnimation') {
                targetNode.removeChild(loadingAnimationNode);
            }
        }
    }

    function englishToGermanDate(dateString: string) {
        return `${dateString.substr(8, 2)}.${dateString.substr(5, 2)}.${dateString.substr(0, 4)}`;
    }

    async function generateTemplate(template: string, templateVars: any = null) {
        const mustache: any = await fetchJsonp(template);
        const response = await mustache.text();
        const rendered = Mustache.render(response, templateVars);
        const wrapperElement = document.createElement('div');

        wrapperElement.innerHTML = rendered;

        return wrapperElement.firstChild;
    }
})()
