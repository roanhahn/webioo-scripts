/*
 * Controleert of de live sites de scripts uit deze repo nog goed laden.
 *
 * Per pagina in sites.json:
 * 1. De pagina moet bereikbaar zijn (HTTP 200).
 * 2. Elk bestand uit "verwacht" moet in de HTML voorkomen als <script src> of <link href>.
 * 3. Elk gevonden bestand uit deze repo wordt opgehaald bij jsDelivr. De sha384-hash van
 *    de inhoud moet gelijk zijn aan het integrity-attribuut in de pagina. Klopt die niet,
 *    dan weigert de browser het bestand en werkt het script op de site niet.
 *
 * Uitvoeren: node monitor/check-sites.js
 * Bij een probleem eindigt het script met exitcode 1 en staat de uitleg in monitor-rapport.md.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Alleen bestanden uit deze repo worden gecontroleerd, andere externe scripts niet.
const REPO_CDN = 'cdn.jsdelivr.net/gh/webioo-nl/scripts@';

// Haalt alle <script>- en <link>-tags uit de HTML en geeft per tag de link en de integrity terug.
function vindBestanden(html) {
  const tags = html.match(/<(script|link)\b[^>]*>/gi) || [];
  const gevonden = [];
  for (const tag of tags) {
    const link = attribuut(tag, 'src') || attribuut(tag, 'href');
    if (!link || !link.includes(REPO_CDN)) continue;
    gevonden.push({ link, integrity: attribuut(tag, 'integrity') });
  }
  return gevonden;
}

function attribuut(tag, naam) {
  const m = tag.match(new RegExp('\\s' + naam + '\\s*=\\s*["\']([^"\']*)["\']', 'i'));
  return m ? m[1] : null;
}

// Rekent de hash uit zoals de browser dat doet bij het controleren van integrity.
function sha384(inhoud) {
  return 'sha384-' + crypto.createHash('sha384').update(inhoud).digest('base64');
}

// Controleert één pagina. fetchFn is los meegegeven zodat de tests een nep-internet kunnen gebruiken.
async function controleerSite(site, fetchFn = fetch) {
  const problemen = [];
  const goed = [];

  let html;
  try {
    const res = await fetchFn(site.url);
    if (res.status !== 200) {
      problemen.push(`Pagina geeft HTTP ${res.status}`);
      return { site, problemen, goed };
    }
    html = await res.text();
  } catch (e) {
    problemen.push(`Pagina niet bereikbaar: ${e.message}`);
    return { site, problemen, goed };
  }

  const bestanden = vindBestanden(html);

  for (const pad of site.verwacht || []) {
    if (!bestanden.some(b => b.link.endsWith('/' + pad))) {
      problemen.push(`\`${pad}\` staat niet meer in de pagina`);
    }
  }

  for (const b of bestanden) {
    const naam = b.link.split(REPO_CDN)[1];
    try {
      const res = await fetchFn(b.link);
      if (res.status !== 200) {
        problemen.push(`\`${naam}\` geeft HTTP ${res.status} bij jsDelivr`);
        continue;
      }
      const inhoud = Buffer.from(await res.arrayBuffer());
      if (!b.integrity) {
        problemen.push(`\`${naam}\` heeft geen integrity-hash in de pagina`);
      } else if (!b.integrity.split(/\s+/).includes(sha384(inhoud))) {
        problemen.push(`\`${naam}\`: hash in de pagina klopt niet met het bestand, de browser blokkeert het script`);
      } else {
        goed.push(naam);
      }
    } catch (e) {
      problemen.push(`\`${naam}\` niet op te halen: ${e.message}`);
    }
  }

  return { site, problemen, goed };
}

function maakRapport(resultaten) {
  const regels = ['## Controle live sites', ''];
  for (const r of resultaten) {
    const status = r.problemen.length ? '❌' : '✅';
    regels.push(`### ${status} ${r.site.naam}`, r.site.url, '');
    for (const p of r.problemen) regels.push(`- ${p}`);
    for (const g of r.goed) regels.push(`- \`${g}\` laadt en de hash klopt`);
    regels.push('');
  }
  return regels.join('\n');
}

async function main() {
  const sites = JSON.parse(fs.readFileSync(path.join(__dirname, 'sites.json'), 'utf8'));
  const resultaten = [];
  for (const site of sites) resultaten.push(await controleerSite(site));

  const rapport = maakRapport(resultaten);
  console.log(rapport);
  fs.writeFileSync('monitor-rapport.md', rapport);
  // Op GitHub verschijnt dit overzicht bovenaan de pagina van de run.
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, rapport);

  if (resultaten.some(r => r.problemen.length)) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { vindBestanden, controleerSite, sha384 };
