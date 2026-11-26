const test = require('node:test');
const assert = require('node:assert');
const { controleerSite, sha384 } = require('../check-sites.js');

const SCRIPT = 'console.log("hallo");';
const LINK = 'https://cdn.jsdelivr.net/gh/webioo-nl/scripts@klant-v1.0.0/klant/script.js';

// Bouwt een nep-internet: een pagina en het script bij jsDelivr.
function nepFetch({ pagina, paginaStatus = 200, scriptStatus = 200 }) {
  return async (url) => {
    const body = url === LINK ? SCRIPT : pagina;
    const status = url === LINK ? scriptStatus : paginaStatus;
    return {
      status,
      text: async () => body,
      arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    };
  };
}

const site = { naam: 'Test', url: 'https://example.com/', verwacht: ['klant/script.js'] };

test('alles goed als script aanwezig is en de hash klopt', async () => {
  const pagina = `<script src="${LINK}" integrity="${sha384(SCRIPT)}" crossorigin="anonymous"></script>`;
  const r = await controleerSite(site, nepFetch({ pagina }));
  assert.deepStrictEqual(r.problemen, []);
  assert.deepStrictEqual(r.goed, ['klant-v1.0.0/klant/script.js']);
});

test('fout als de hash niet klopt', async () => {
  const pagina = `<script src="${LINK}" integrity="sha384-verkeerd"></script>`;
  const r = await controleerSite(site, nepFetch({ pagina }));
  assert.match(r.problemen[0], /hash in de pagina klopt niet/);
});

test('fout als het verwachte script uit de pagina is verdwenen', async () => {
  const r = await controleerSite(site, nepFetch({ pagina: '<p>leeg</p>' }));
  assert.match(r.problemen[0], /staat niet meer in de pagina/);
});

test('fout als de pagina niet bereikbaar is', async () => {
  const r = await controleerSite(site, nepFetch({ pagina: '', paginaStatus: 404 }));
  assert.match(r.problemen[0], /HTTP 404/);
});

test('fout als jsDelivr het bestand niet geeft', async () => {
  const pagina = `<script src="${LINK}" integrity="${sha384(SCRIPT)}"></script>`;
  const r = await controleerSite(site, nepFetch({ pagina, scriptStatus: 404 }));
  assert.match(r.problemen.join(), /HTTP 404 bij jsDelivr/);
});

test('fout als de integrity-hash ontbreekt', async () => {
  const r = await controleerSite(site, nepFetch({ pagina: `<script src="${LINK}"></script>` }));
  assert.match(r.problemen[0], /geen integrity-hash/);
});

test('andere externe scripts worden genegeerd', async () => {
  const pagina = `<script src="${LINK}" integrity="${sha384(SCRIPT)}"></script><script src="https://cdn.example.com/x.js"></script>`;
  const r = await controleerSite(site, nepFetch({ pagina }));
  assert.deepStrictEqual(r.problemen, []);
});
