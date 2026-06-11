declare global {
    interface Window {
        _paq: string[][]
    }
}

export function initMatomo() {

    console.info('init matomo analytics')

    var _paq = window._paq = window._paq || [];
    /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
    _paq.push(["disableCookies"]);
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function() {
      var u="//matomo.timescape-switches.ch/";
      _paq.push(['setTrackerUrl', u+'matomo.php']);
      _paq.push(['setSiteId', '1']);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.async=true; g.src=u+'matomo.js'; s!.parentNode!.insertBefore(g,s!);
    })();
}


export function updateMatomoWithNavigation(from: string) {
    console.log('hashchange', {
        pathname: window.location.pathname,
        title: document.title,
    })
    window._paq.push(['setCustomUrl', window.location.pathname])
    window._paq.push(['setDocumentTitle', document.title])
    window._paq.push(['setReferrerUrl', from])
    window._paq.push(['trackPageView'])
}
