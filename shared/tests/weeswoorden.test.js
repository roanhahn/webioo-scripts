// Test voor weeswoorden.js in een nagebootste pagina: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const script = fs.readFileSync(path.join(__dirname, '..', 'weeswoorden.js'), 'utf8');
const NBSP = '\u00A0';

function laad(body) {
  const fouten = [];
  const vc = new VirtualConsole().on('jsdomError', e => fouten.push(e.message));
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${body}<script>${script}</script></body></html>`, {
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  });
  return new Promise(res => dom.window.document.addEventListener('DOMContentLoaded', () =>
    setTimeout(() => res({ w: dom.window, d: dom.window.document, fouten }), 0)));
}

const tekst = (d, sel) => d.querySelector(sel).textContent;
const html = (d, sel) => d.querySelector(sel).innerHTML;

test('laatste twee woorden van een alinea krijgen een vaste spatie', async () => {
  const { d, fouten } = await laad('<p>Adverteren boven de kassa werkt</p>');
  assert.deepStrictEqual(fouten, []);
  assert.strictEqual(tekst(d, 'p'), `Adverteren boven de kassa${NBSP}werkt`);
});

test('koppen, lijstitems, citaten en bijschriften doen mee', async () => {
  const { d } = await laad('<h2>Zichtbaar op het koopmoment</h2><ul><li>Lokaal en regionaal bereik</li></ul><blockquote>Dit werkt echt goed</blockquote><figure><figcaption>Scherm bij de kassa</figcaption></figure>');
  assert.ok(tekst(d, 'h2').endsWith(`het${NBSP}koopmoment`));
  assert.ok(tekst(d, 'li').endsWith(`regionaal${NBSP}bereik`));
  assert.ok(tekst(d, 'blockquote').endsWith(`echt${NBSP}goed`));
  assert.ok(tekst(d, 'figcaption').endsWith(`de${NBSP}kassa`));
});

test('opmaak en links blijven heel', async () => {
  const { d } = await laad('<p>Lees meer over <a href="/tarieven">onze tarieven</a></p>');
  assert.strictEqual(html(d, 'p'), 'Lees meer over <a href="/tarieven">onze&nbsp;tarieven</a>');
});

test('spatie tussen twee opgemaakte stukken wordt ook gevonden', async () => {
  const { d } = await laad('<p>Dit is <strong>heel</strong> <em>belangrijk</em></p>');
  assert.strictEqual(tekst(d, 'p'), `Dit is heel${NBSP}belangrijk`);
  assert.ok(d.querySelector('p strong') && d.querySelector('p em'));
});

test('witruimte en regeleinden uit de HTML worden één vaste spatie', async () => {
  const { d } = await laad('<p>Bereken direct je\n      campagnetarief  </p>');
  assert.strictEqual(tekst(d, 'p').trim(), `Bereken direct je${NBSP}campagnetarief`);
});

test('teksten van één of twee woorden blijven ongemoeid', async () => {
  const { d } = await laad('<h3>Contact</h3><h3>Onze locaties</h3>');
  const [een, twee] = d.querySelectorAll('h3');
  assert.strictEqual(een.textContent, 'Contact');
  assert.strictEqual(twee.textContent, 'Onze locaties');
});

test('te lange laatste woorden worden overgeslagen', async () => {
  const { d } = await laad('<p>Wij regelen de advertentieopmaak campagnemanagementondersteuning</p>');
  assert.ok(!tekst(d, 'p').includes(NBSP));
});

test('een bestaande vaste spatie wordt niet nog eens gezet', async () => {
  const { d } = await laad('<p>Al netjes&nbsp;opgelost</p><p>Nog een keer laden mag</p>');
  assert.strictEqual(tekst(d, 'p'), `Al netjes${NBSP}opgelost`);
  const voor = d.body.innerHTML;
  d.defaultView.Weeswoorden.verwerk(d.body);
  assert.strictEqual(d.body.innerHTML, voor);
});

test('data-weeswoord="uit" zet het uit, ook op een element eromheen', async () => {
  const { d } = await laad('<p data-weeswoord="uit">Deze tekst blijft zoals hij is</p><div data-weeswoord="uit"><h2>Ook deze kop blijft zo</h2></div>');
  assert.ok(!tekst(d, 'p').includes(NBSP));
  assert.ok(!tekst(d, 'h2').includes(NBSP));
});

test('alleen het binnenste element wordt aangepast', async () => {
  const { d } = await laad('<ul><li><p>Een alinea in een lijst</p></li></ul>');
  assert.strictEqual(tekst(d, 'p'), `Een alinea in een${NBSP}lijst`);
  assert.strictEqual((tekst(d, 'li').match(/\u00A0/g) || []).length, 1);
});

test('tekst die later verschijnt wordt ook verwerkt', async () => {
  const { w, d } = await laad('<div id="lijst"></div>');
  const item = d.createElement('div');
  item.innerHTML = '<h3>Albert Heijn in het centrum</h3><p>Circa honderdduizend bezoekers per maand</p>';
  d.getElementById('lijst').appendChild(item);
  await new Promise(r => setTimeout(r, 50));
  assert.ok(tekst(d, '#lijst h3').endsWith(`het${NBSP}centrum`));
  assert.ok(tekst(d, '#lijst p').endsWith(`per${NBSP}maand`));
});

test('tekst in script en style wordt niet aangeraakt', async () => {
  const { d } = await laad('<p>Tekst met een <style>.a { color: red }</style> stijlblok erin</p>');
  assert.strictEqual(d.querySelector('style').textContent, '.a { color: red }');
  assert.ok(tekst(d, 'p').endsWith(`stijlblok${NBSP}erin`));
});
