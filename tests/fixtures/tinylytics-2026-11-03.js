(function() {
  const collect_url = "https://tinylytics.app/collector/pyyHixpxxAjwk8mz1YBC"
  let lastTrackedUrl = null
  const numberFormatter = new Intl.NumberFormat()

  function formatCount(value) {
    let numericValue = Number(value)
    return Number.isFinite(numericValue) ? numberFormatter.format(numericValue) : value
  }







  function runTinylytics() {
    const path = window.location.pathname
    if (lastTrackedUrl !== window.location.href) {
      let should_collect = localStorage.getItem("tinylytics_ignore") == null
      let current_url = encodeURIComponent(window.location.href)
      let set_ignore_param = new URLSearchParams(document.location.search)?.get("tiny_ignore") || new URLSearchParams(document.location.search)?.get("ti")
      let hostname = window.location.protocol + "//" + window.location.hostname
      let referrer = document.referrer.indexOf(hostname) < 0 ? encodeURIComponent(document.referrer) : ""
      if(set_ignore_param){
        if(set_ignore_param === "true" && localStorage.getItem("tinylytics_ignore") == null){
          localStorage.setItem("tinylytics_ignore", true)
          should_collect = false
          alert("Tinylytics will no longer track your own hits in this browser.")
        }
        else if (set_ignore_param === "false" && localStorage.getItem("tinylytics_ignore") != null){
          localStorage.removeItem("tinylytics_ignore")
          should_collect = true
          alert("Tinylytics has been enabled for this website, for this browser.")
        }
        if(set_ignore_param === "true"){
          localStorage.setItem("tinylytics_ignore", true)
        }
      }
      if (window.location.protocol === 'file:') {
        should_collect = false
      }
      if(should_collect){
        lastTrackedUrl = window.location.href
        const hitUrl = `${collect_url}?url=${current_url}&path=${path}&referrer=${referrer}`
        if ('sendBeacon' in navigator && navigator.sendBeacon(hitUrl)) {
        } else {
          fetch(hitUrl, {method: "post"})
        }
      }
    }

  }

    (function() {
    let debounceMap = new Map();

    document.addEventListener('click', function(event) {
      if (event.button !== 0) return;
      if (localStorage.getItem("tinylytics_ignore") != null) return;
      if (window.location.protocol === 'file:') return;

      let tagged = event.target.closest('[data-tinylytics-event]');
      if (tagged) {
        let eventName = tagged.getAttribute('data-tinylytics-event').trim();
        if (!eventName || !eventName.includes('.')) return;

        eventName = eventName.replace(/->/g, '.');
        let eventValue = tagged.getAttribute('data-tinylytics-event-value') || '';
        if (!shouldSendEvent(tagged.id || tagged.className || tagged.tagName)) return;

        sendTinylyticsEvent(eventName, eventValue, false);
        return;
      }

    }, true);


    function shouldSendEvent(key) {
      let lastSent = debounceMap.get(key);
      if (lastSent && (Date.now() - lastSent) < 500) return false;

      debounceMap.set(key, Date.now());
      return true;
    }

    function sendTinylyticsEvent(eventName, eventValue, leavePage) {
      let current_url = encodeURIComponent(window.location.href)
      let path = window.location.pathname
      let hostname = window.location.protocol + "//" + window.location.hostname
      let referrer = document.referrer.indexOf(hostname) < 0 ? encodeURIComponent(document.referrer) : ""
      let eventHitUrl = `${collect_url}?url=${current_url}&path=${path}&referrer=${referrer}&event=${encodeURIComponent(eventName)}&event_value=${encodeURIComponent(eventValue)}`;
      let usedBeacon = false;

      usedBeacon = ('sendBeacon' in navigator && navigator.sendBeacon(eventHitUrl));

      if (!usedBeacon) {
        fetch(eventHitUrl, {method: "post"})
      }
    }

  })();


  runTinylytics()
  document.addEventListener('turbo:load', runTinylytics)
})()
