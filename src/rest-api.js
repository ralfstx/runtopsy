const fetch = require('node-fetch');

module.exports = {
  buildQuery,
  getJson,
  postJson,
};

function buildQuery(query) {
  return Object.keys(query).map(key => `${key}=${encodeURIComponent(query[key])}`).join('&');
}

async function getJson(url, headers) {
  return await fetchJson('GET', url, null, headers);
}

async function postJson(url, data, headers) {
  return await fetchJson('POST', url, data, headers);
}

async function fetchJson(method, url, data, extraHeaders = {}) {
  let headers = Object.assign(data ? {'Content-Type': 'application/json'} : {}, extraHeaders);
  let options = Object.assign({ method, headers }, data ? { body: JSON.stringify(data) } : {});
  let response = await fetch(url, options);
  await checkStatus(response, url);
  return await response.json();
}

async function checkStatus(res, url) {
  if (!res.ok) {
    let text = await res.text();
    throw new Error(`HTTP ${res.status} (${res.statusText}) on ${url}:\nResponse: ${text}`);
  }
}
