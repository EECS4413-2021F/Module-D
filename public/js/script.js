(function () {
  'use strict';

  const GetTaxesAPI     = '/api/taxes';
  const GetTaxByCodeAPI = '/api/taxes/:code';

  /**
   * Supplant does variable substitution on the string. 
   * It scans through the string looking for expressions enclosed in 
   * {{ }} braces. If an expression is found, use it as a key on the object,
   * and if the key has a string value or number value, it is substituted for
   * the bracket expression and it repeats. This is useful for automatically
   * fixing URLs or for templating HTML.
   *
   * Based on: http://www.crockford.com/javascript/remedial.html
   * 
   * @param {string} str 
   * @param {object} object
   * @returns {string}
   */
  function supplant(str, object) {
    return str.replace(
      /\{\{[ ]*([^{} ]*)[ ]*\}\}/g,
      function (a, b) {
        let r = object[b];
        return typeof r === 'string' || typeof r === 'number' ? r : a;
      }
    );
  }

  function doAjax(url, method) {
    // Create the XHR request
    const request = new XMLHttpRequest();
    // Return it as a Promise
    return new Promise(function (resolve, reject) {
      // Setup our listener to process compeleted requests
      request.onreadystatechange = function () {
        // Only run if the request is complete
        if (request.readyState !== 4) return;  
        // Process the response
        if (request.status >= 200 && request.status < 300) { // When successful
          resolve(JSON.parse(request.responseText));
        } else { // When failed
          reject({
            status: request.status,
            statusText: request.statusText
          });
        }
      };
      // Setup our HTTP request
		  request.open(method || 'GET', url, true);
		  // Send the request
		  request.send();
    });
  }

  function changeView(url, title, html) {
    const data = { url, title, html };
    document.title = title;
    document.getElementById('page').innerHTML = html;
    if (window.location.hash !== url) {
      window.history.pushState(data, '', url);
    }
  }

  window.onpopstate = function (e) {
    if (e.state) {
      document.title = e.state.title;
      showView(e.state.url);
    }
  };

  const templates = {};
  const routes = {
    provinces() {
      doAjax(GetTaxesAPI).then((taxes) => {
        const content = taxes.map(t => supplant(templates['province-item'], t)).join('');
        const html    = supplant(templates['provinces-page'], { content });

        changeView('#/provinces', 'Provinces', html);
      });
    },
    taxes(code) {
      doAjax(GetTaxByCodeAPI.replace(':code', code)).then((tax) => {
        changeView(`#/taxes/${code}`, `Taxes in ${tax.province}`, supplant(templates['tax-page'], tax));
      });
    },
    index() {
      routes.provinces();
    }
  };

  function showView(hash) {
    if (hash.startsWith('#/')) {
      const [ route, ...params ] = hash.substr(2).split('/');
      if (routes[route]) {
        routes[route](...params);
      } else {
        routes.index();
      }
    } else {
      routes.index();
    }
  }

  document.querySelectorAll('script[type="text/x-template"]').forEach((el) => {
    templates[el.id] = el.innerText;
  });

  window.addEventListener('hashchange', () => showView(window.location.hash));
  showView(window.location.hash);
}());
