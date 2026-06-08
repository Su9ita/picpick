(function () {
  if (window.__picpickPageHookInstalled) return;
  window.__picpickPageHookInstalled = true;

  var IMAGE_URL_PATTERN = /\.(jpe?g|png|gif|webp|avif|bmp)(?:[?#].*)?$/i;
  var capturedUrls = new Set();
  var capturedBodies = [];

  function post(kind, payload) {
    try {
      window.postMessage({
        source: 'picpick-page-hook',
        kind: kind,
        payload: payload,
      }, '*');
    } catch (_) {
      // Ignore messaging failures.
    }
  }

  function normalizeUrl(value) {
    if (!value || typeof value !== 'string') return null;
    if (value.indexOf('data:') === 0 || value.indexOf('blob:') === 0) return null;

    try {
      return new URL(value, location.href).href;
    } catch (_) {
      return null;
    }
  }

  function collectUrl(value) {
    var url = normalizeUrl(value);
    if (!url) return;

    if (IMAGE_URL_PATTERN.test(url) || /[?&](format|type)=webp(?:&|$)/i.test(url)) {
      if (!capturedUrls.has(url)) {
        capturedUrls.add(url);
        post('url', { url: url });
      }
    }
  }

  function collectText(text, baseUrl) {
    if (!text || typeof text !== 'string') return;

    var patterns = [
      /https?:\\?\/\\?\/[^"'<>)\s]+?\.(?:jpe?g|png|gif|webp|avif|bmp)(?:[?#][^"'<>)\s]*)?/gi,
      /(?:src|data-src|data-lazy-src|data-original|url|image|path)["'\s:=>]+([^"'<>,\s]+?\.(?:jpe?g|png|gif|webp|avif|bmp)(?:[?#][^"'<>,\s]*)?)/gi,
    ];

    for (var i = 0; i < patterns.length; i++) {
      var pattern = patterns[i];
      var match;
      while ((match = pattern.exec(text)) !== null) {
        var raw = (match[1] || match[0]).replace(/\\\//g, '/');
        try {
          collectUrl(new URL(raw, baseUrl || location.href).href);
        } catch (_) {
          collectUrl(raw);
        }
      }
    }
  }

  function rememberBody(url, bodyText) {
    if (!bodyText || bodyText.length < 20) return;
    capturedBodies.push({ url: url || location.href, body: bodyText.slice(0, 200000) });
    if (capturedBodies.length > 20) capturedBodies.shift();
    post('body', { url: url || location.href, body: bodyText.slice(0, 200000) });
  }

  function requestUrl(input) {
    if (typeof input === 'string') return input;
    if (input && typeof input.url === 'string') return input.url;
    return '';
  }

  if (typeof window.fetch === 'function') {
    var originalFetch = window.fetch;
    window.fetch = function () {
      var url = requestUrl(arguments[0]);
      collectUrl(url);

      return originalFetch.apply(this, arguments).then(function (response) {
        try {
          var clone = response.clone();
          var contentType = clone.headers && clone.headers.get('content-type') || '';
          if (/image\//i.test(contentType)) {
            collectUrl(response.url || url);
          } else if (/json|text|javascript|html/i.test(contentType)) {
            clone.text().then(function (text) {
              rememberBody(response.url || url, text);
              collectText(text, response.url || url);
            }).catch(function () {});
          }
        } catch (_) {
          // Keep the original request unaffected.
        }

        return response;
      });
    };
  }

  if (typeof window.XMLHttpRequest === 'function') {
    var originalOpen = XMLHttpRequest.prototype.open;
    var originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this.__picpickUrl = url;
      collectUrl(url);
      return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
      try {
        this.addEventListener('load', function () {
          var responseUrl = this.responseURL || this.__picpickUrl || location.href;
          var contentType = this.getResponseHeader && this.getResponseHeader('content-type') || '';
          if (/image\//i.test(contentType)) {
            collectUrl(responseUrl);
          } else if (typeof this.responseText === 'string') {
            rememberBody(responseUrl, this.responseText);
            collectText(this.responseText, responseUrl);
          }
        });
      } catch (_) {}

      return originalSend.apply(this, arguments);
    };
  }

  var imageSrc = Object.getOwnPropertyDescriptor(Image.prototype, 'src');
  if (imageSrc && imageSrc.set) {
    Object.defineProperty(Image.prototype, 'src', {
      configurable: true,
      enumerable: imageSrc.enumerable,
      get: imageSrc.get,
      set: function (value) {
        collectUrl(value);
        return imageSrc.set.call(this, value);
      },
    });
  }

  var originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (typeof name === 'string' && /^(src|href|data-src|data-lazy-src|data-original)$/i.test(name)) {
      collectUrl(value);
    }
    return originalSetAttribute.apply(this, arguments);
  };

  window.addEventListener('message', function (event) {
    if (event.source !== window || !event.data || event.data.source !== 'picpick-content') return;
    if (event.data.kind === 'dump') {
      post('dump', {
        urls: Array.from(capturedUrls),
        bodies: capturedBodies,
      });
    }
  });
})();
