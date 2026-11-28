/*
 * Weeswoorden voorkomen
 *
 * Een weeswoord is één los woord op de laatste regel van een kop of alinea.
 * Dit script zet tussen de laatste twee woorden van een tekst een vaste
 * spatie (U+00A0). Op een vaste spatie breekt de browser nooit af, dus die
 * twee woorden komen altijd samen op de laatste regel, bij elke schermbreedte.
 *
 * Welke elementen:   koppen, alinea's, lijstitems, citaten en bijschriften
 *                    (zie SELECTOR hieronder), en losse tekstblokken: een <div>
 *                    waar alleen tekst (met eventueel een link, vet of cursief)
 *                    in staat. Webflow maakt van een Text Block zo'n <div>.
 *                    Een ander element erbij zetten kan met data-weeswoord="aan".
 * Overgeslagen:      teksten van minder dan drie woorden, en teksten waarvan
 *                    de laatste twee woorden samen te lang zijn om nog netjes
 *                    op een smal scherm te passen (zie MAX_LENGTE).
 * Uitzetten:         data-weeswoord="uit" op een element of op een element
 *                    eromheen.
 * Later geladen:     tekst die na het laden van de pagina verschijnt (bijvoorbeeld
 *                    CMS-items die via een lijst worden bijgeladen) wordt ook
 *                    verwerkt.
 *
 * Alleen de spatie zelf wordt vervangen. Links, vet en andere opmaak in de
 * tekst blijven ongewijzigd.
 */
(function (root) {
  'use strict';

  var SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption';
  // Alles wat wordt bekeken: de elementen hierboven, losse <div>'s en elementen die
  // met data-weeswoord="aan" zijn aangezet. Bij <div>'s beslist tekstblok() verderop.
  var KANDIDATEN = SELECTOR + ', div, [data-weeswoord="aan"]';
  // Elementen die gewoon meelopen in de tekst. Staat er iets anders in een <div>
  // (een afbeelding, een knop, een ander blok), dan is het een indelingsblok en
  // geen tekstblok, en blijft het ongemoeid.
  var INLINE = ['A', 'ABBR', 'B', 'BR', 'CITE', 'CODE', 'EM', 'I', 'MARK', 'SMALL',
    'SPAN', 'STRONG', 'SUB', 'SUP', 'U', 'TIME', 'WBR'];
  var MAX_LENGTE = 18; // maximaal aantal tekens van de laatste twee woorden samen
  var MIN_WOORDEN = 3;
  var VASTE_SPATIE = '\u00A0';

  var doc = root.document;

  // Alle tekstknopen binnen een element, in leesvolgorde.
  // Tekst in <script> en <style> doet niet mee.
  function tekstknopen(el) {
    var knopen = [];
    var walker = doc.createTreeWalker(el, root.NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var ouder = node.parentNode && node.parentNode.nodeName;
        return ouder === 'SCRIPT' || ouder === 'STYLE'
          ? root.NodeFilter.FILTER_REJECT
          : root.NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) knopen.push(walker.currentNode);
    return knopen;
  }

  // Is dit een <div> met alleen tekst en opmaak erin, zoals een Text Block?
  function tekstblok(el) {
    if (el.nodeName !== 'DIV') return false;
    var kinderen = el.querySelectorAll('*');
    for (var i = 0; i < kinderen.length; i++) {
      if (INLINE.indexOf(kinderen[i].nodeName) === -1) return false;
    }
    return true;
  }

  // Verwerkt één element. Geeft true terug als er een vaste spatie is gezet.
  function verwerkElement(el) {
    if (el.closest('[data-weeswoord="uit"]')) return false;

    var aangezet = el.getAttribute('data-weeswoord') === 'aan';

    // Een <div> telt alleen mee als het een tekstblok is (zie tekstblok()).
    if (el.nodeName === 'DIV' && !aangezet && !tekstblok(el)) return false;

    // Bevat het element zelf weer koppen of alinea's (bijvoorbeeld een <li> met
    // een <p> erin), dan worden die binnenste elementen verwerkt en dit niet.
    if (el.querySelector(SELECTOR)) return false;

    // De gewone spaties tellen als scheiding tussen woorden; een bestaande
    // vaste spatie ook, zodat een tekst niet twee keer wordt aangepast.
    var woorden = el.textContent.trim().split(/[\s\u00A0]+/);
    if (woorden.length < MIN_WOORDEN) return false;

    var laatste = woorden[woorden.length - 1];
    var voorlaatste = woorden[woorden.length - 2];
    if ((voorlaatste + ' ' + laatste).length > MAX_LENGTE) return false;

    var knopen = tekstknopen(el);

    // Van achter naar voren door de tekst lopen:
    // 1. eerst witruimte aan het einde overslaan,
    // 2. dan het laatste woord overslaan,
    // 3. de witruimte daarvóór is de plek waar de vaste spatie moet komen.
    var fase = 'einde';
    for (var k = knopen.length - 1; k >= 0; k--) {
      var tekst = knopen[k].data;
      for (var i = tekst.length - 1; i >= 0; i--) {
        var teken = tekst[i];
        var isWit = /\s/.test(teken);

        if (fase === 'einde') {
          if (!isWit) fase = 'woord';
          continue;
        }

        if (fase === 'woord' && isWit) {
          if (teken === VASTE_SPATIE) return false; // staat er al

          // Hele reeks witruimte vóór het laatste woord vervangen door één
          // vaste spatie (in de HTML staan soms meerdere spaties of een regeleinde).
          var begin = i;
          while (begin > 0 && /\s/.test(tekst[begin - 1])) begin--;
          knopen[k].data = tekst.slice(0, begin) + VASTE_SPATIE + tekst.slice(i + 1);
          return true;
        }
      }
    }
    return false;
  }

  // Verwerkt alle passende elementen binnen een stuk van de pagina.
  function verwerk(bereik) {
    bereik = bereik || doc.body;
    var aantal = 0;
    if (bereik.matches && bereik.matches(KANDIDATEN) && verwerkElement(bereik)) aantal++;
    bereik.querySelectorAll(KANDIDATEN).forEach(function (el) {
      if (verwerkElement(el)) aantal++;
    });
    return aantal;
  }

  // Nieuwe elementen die later op de pagina komen, ook verwerken.
  // Meerdere wijzigingen kort na elkaar worden samen in één keer afgehandeld.
  function volgWijzigingen() {
    var wachtrij = [];
    var gepland = false;

    new root.MutationObserver(function (wijzigingen) {
      wijzigingen.forEach(function (w) {
        w.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) wachtrij.push(node);
        });
      });
      if (wachtrij.length && !gepland) {
        gepland = true;
        root.requestAnimationFrame(function () {
          var elementen = wachtrij.splice(0);
          gepland = false;
          elementen.forEach(function (el) {
            if (el.isConnected) verwerk(el);
          });
        });
      }
    }).observe(doc.body, { childList: true, subtree: true });
  }

  function start() {
    verwerk(doc.body);
    volgWijzigingen();
  }

  root.Weeswoorden = { verwerk: verwerk };

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
