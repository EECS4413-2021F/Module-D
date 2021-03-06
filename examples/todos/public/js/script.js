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

  const TodosAPI = '/todos';

  const templates = {};
  const routes = {
    async todos(isRedirect) {      
      try {
        const todos   = await doAjax(TodosAPI);
        const content = todos.map((t, i) => supplant(templates['todos-item'], { text: t, index: i })).join('');
        const html    = supplant(templates['todos-page'], { content });

        changeView('#/todos', 'Todos', html, isRedirect);
        
        document.getElementById('add-todo').addEventListener('click', async () => {
          let text = document.forms['new-todo']['todo-text'].value; // document.getElementById('todo-text').value;
          await doAjax(TodosAPI, 'POST', { text });
          routes.todos();
        });

        document.querySelectorAll('.edit-btn').forEach((btn) => { // document.getElementsByClassName('edit-btn')
          btn.addEventListener('click', async () => {
            let index = btn.dataset.index; // btn.getAtttribute('data-index')
            const text = prompt(`Edit item ${index}`);
            if (text !== null) {
              await doAjax(TodosAPI + '/' + index, 'PUT', { text });
              routes.todos();
            }
          });
        });

        document.querySelectorAll('.delete-btn').forEach((btn) => { // document.getElementsByClassName('delete-btn')
          btn.addEventListener('click', async () => {
            let index = btn.dataset.index; // btn.getAtttribute('data-index')
            const doDelete = confirm(`Delete item ${index}`);
            if (doDelete) {
              await doAjax(TodosAPI + '/' + index, 'DELETE');
              routes.todos();
            }
          });
        });
      } catch (err) {
        console.log(err);
      }
    },
    index() {
      routes.todos(true);
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
