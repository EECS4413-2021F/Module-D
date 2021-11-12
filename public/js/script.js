(function () {
  'use strict';

  /**
   * Supplant does variable substitution on the string. It scans through the
   * string looking for expressions enclosed in {{ }} braces. If an expression
   * is found, use it as a key on the object, and if the key has a string value
   * or number value, it is substituted for the bracket expression and it repeats.
   * This is useful for automatically fixing URLs or for templating HTML.
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

  /**
   * Make an AJAX request with XHR. Returns a Promise.
   * 
   * @param {string} url 
   * @param {'GET'|'POST'|'PUT'|'HEAD'|'DELETE'} method 
   * @param {*} data
   * @returns {Promise}
   */
  function doAjax(url, method, data) {
    const request = new XMLHttpRequest();                    // create the XHR request    
    return new Promise(function (resolve, reject) {          // return it as a Promise
      request.onreadystatechange = function () {             // setup our listener to process compeleted requests
        if (request.readyState !== 4) return;                // only run if the request is complete
        if (request.status >= 200 && request.status < 300) { // process the response, when successful
          resolve(JSON.parse(request.responseText));
        } else { // when failed
          reject({
            status: request.status,
            statusText: request.statusText
          });
        }
      };
      request.open(method || 'GET', url, true);                       // setup our HTTP request
      if (data) {                                                     // when data is given...
        request.setRequestHeader("Content-type", "application/json"); // set the request content-type as JSON, and
        request.send(JSON.stringify(data));                           // send data as JSON in the request body.
      } else {
        request.send(); // send the request
      }
    });
  }

  /**
   * Invoke the route associated with the given URL hash. If no route matches,
   * redirects to the default route.
   *
   * @param {string} hash 
   */
  function invokeRoute(hash) {
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

  /**
   * Actually change the content of the view. Replaces the innerHTML in the
   * #page element, and then updates the history, either by pushing a new state
   * or replacing the existing state if this is a redirection.
   *
   * @param {string} url 
   * @param {string} title 
   * @param {string} html 
   * @param {boolean} isRedirect
   */
  function changeView(url, title, html, isRedirect = false) {
    const data = { url, title, html };
    document.title = title;
    document.getElementById('page').innerHTML = html;
    if (window.location.hash !== url) {
      if (isRedirect) {
        window.history.replaceState(data, '', url);
      } else {
        window.history.pushState(data, '', url);
      }
    }
  }

  const GetTaxesAPI     = '/api/taxes';
  const GetTaxByCodeAPI = '/api/taxes/:code';

  const templates = {};
  const routes = {
    provinces(isRedirect) {
      doAjax(GetTaxesAPI).then((taxes) => {
        const content = taxes.map(t => supplant(templates['province-item'], t)).join('');
        const html    = supplant(templates['provinces-page'], { content });

        changeView('#/provinces', 'Provinces', html, isRedirect);
      });
    },
    taxes(code) {
      doAjax(GetTaxByCodeAPI.replace(':code', code)).then((tax) => {
        changeView(`#/taxes/${code}`, `Taxes in ${tax.province}`, supplant(templates['tax-page'], tax));
      });
    },
    calculator() {
      doAjax(GetTaxesAPI).then((taxes) => {
        const provinces = taxes.map(t => supplant(templates['province-dropdown-item'], t)).join('');
        const html = supplant(templates['calculator-page'], { provinces });

        function changeProvince() {
          const code = document.getElementById('province').value;
          const province = taxes.find(t => t.code === code);
          if (!province) return;

          document.getElementById('type').value = province.type;
          document.getElementById('gst').value = '' + province.GST.toFixed(2) + '%';
          document.getElementById('pst').value = '' + province.PST.toFixed(2) + '%';
          updateTotals();
        }

        function updateTotals() {
          if (!document.getElementById('province').value) return;

          const toPercent = (v) => (v.endsWith('%') ? v.substr(0, v.length - 1) : v) / 100;
          const amount = +(document.getElementById('amount').value);
          const gst    = toPercent(document.getElementById('gst').value);
          const pst    = toPercent(document.getElementById('pst').value);

          document.getElementById('taxes').value = (amount * (gst + pst)).toFixed(2);
          document.getElementById('total').value = (amount * (gst + pst + 1)).toFixed(2);
        }

        changeView('#/calculator', 'Calculator', html);
        document.getElementById('province').addEventListener('change', changeProvince);
        document.getElementById('amount').addEventListener('change', updateTotals);
        document.getElementById('amount').addEventListener('keyup', updateTotals);
      });
    },
    index() {
      routes.provinces(true);
    }
  };

  document.querySelectorAll('script[type="text/x-template"]').forEach((el) => { templates[el.id] = el.innerText; });
  window.addEventListener('hashchange', () => invokeRoute(window.location.hash));
  window.addEventListener('popstate', (ev) => {
    if (ev.state) {
      document.title = ev.state.title;
      invokeRoute(ev.state.url);
    }
  });
  invokeRoute(window.location.hash);
}());
