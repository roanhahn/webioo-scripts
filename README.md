# Webioo scripts

JavaScript voor klantsites van Webioo Digital Agency, geladen via jsDelivr.

Deze repo is voor klanten waar alleen Webioo aan werkt. Werkt er een externe partij mee aan de code, dan krijgt die klant een eigen repo in `webioo-nl` (zoals `webioo-nl/abk`), zodat die partij niet bij de code van andere klanten kan.

## Structuur

Eén map per klant, alles in kleine letters.

```
scripts/
├── shared/                  herbruikbaar voor alle klanten
│   ├── weeswoorden.js       voorkomt één los woord op de laatste regel
│   ├── weeswoorden.css      nettere regelafbreking voor koppen en alinea's
│   └── tests/
└── winkelaar/
    ├── rates-2026.js        tarieven en grenzen 2026 (alleen data)
    ├── calculator.js        rekenlogica en weergave van de eenmanszaak/BV-calculator
    ├── origineel.html       de code zoals die vóór de overstap in Webflow stond (terugvaloptie)
    └── tests/
        └── test-cases.js    referentieberekeningen (berekenhet.nl, wetaxus.nl)
```

## Laden in Webflow

Een script laad je altijd via een vaste versie (tag) en met een integrity-hash:

```html
<script src="https://cdn.jsdelivr.net/gh/webioo-nl/scripts@<tag>/<map>/<bestand>.js" integrity="sha384-…" crossorigin="anonymous"></script>
```

De hash reken je uit in Terminal:

```bash
echo "sha384-$(curl -s <link> | openssl dgst -sha384 -binary | openssl base64 -A)"
```

Elke versie heeft een eigen hash. Klopt de hash niet met het bestand, dan laadt de browser het script niet. Zo kan er nooit ongemerkt andere code op een klantsite draaien.

## Versies

- Tags gelden voor de hele repo, dus met de klant (of `shared`) ervoor: `winkelaar-v1.0.0`, `shared-v1.0.0`.
  - laatste cijfer: een fix
  - middelste cijfer: iets nieuws, de pagina in Webflow hoeft niet mee te veranderen
  - eerste cijfer: de pagina in Webflow moet mee aangepast worden
- In de link altijd een tag gebruiken, nooit `@main`.
- Een tag nooit opnieuw gebruiken voor andere code. Een fout herstel je met een nieuwe versie.
- Voor elke versie die live gaat een release maken met: wat er veranderd is, op welke pagina's, sinds wanneer live, en de hashes.

## Werkwijze

`main` is beveiligd: wijzigingen gaan via een branch en een pull request.

1. Branch maken vanaf `main`, bijvoorbeeld `winkelaar/rates-2027` of `fix/…`.
2. Wijzigen, committen, pushen en een pull request openen.
3. Na het mergen een tag zetten op de merge-commit en die pushen.
4. Controleren of de tag op GitHub staat. Staat hij er nog niet, dan geeft jsDelivr een foutpagina en reken je de hash van die foutpagina uit.
5. Hash ophalen, scripttag in Webflow bijwerken, eerst op webflow.io testen, daarna live publiceren.

Geen geheimen in deze repo, zoals API-tokens of wachtwoorden. De repo is openbaar, en alles wat in de browser draait kan iedereen toch zien.

## Testen

```bash
npm install   # eenmalig, voor de paginatests
npm test
```

Draait de tests van `shared/` in een nagebootste pagina en vergelijkt de Winkelaar-calculator met referentieberekeningen. Bij die laatste is een verschil van een paar euro normaal: de referentietools ronden per tussenstap af.

## Gedeelde scripts

### Weeswoorden

Zet een vaste spatie tussen de laatste twee woorden van koppen, alinea's, lijstitems, citaten en bijschriften, zodat er nooit één woord alleen op de laatste regel staat. De CSS zorgt daarnaast in browsers die het kennen voor een evenwichtigere regelverdeling.

```html
<!-- Inside <head> tag -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/webioo-nl/scripts@shared-vX.Y.Z/shared/weeswoorden.css" integrity="sha384-…" crossorigin="anonymous">

<!-- Before </body> tag -->
<script src="https://cdn.jsdelivr.net/gh/webioo-nl/scripts@shared-vX.Y.Z/shared/weeswoorden.js" integrity="sha384-…" crossorigin="anonymous"></script>
```

- Teksten van minder dan drie woorden en teksten waarvan de laatste twee woorden samen langer zijn dan 18 tekens, worden overgeslagen.
- Uitzetten voor een element en alles erbinnen: `data-weeswoord="uit"`.
- Tekst die later op de pagina verschijnt (bijvoorbeeld bijgeladen CMS-items) wordt ook verwerkt.
- Een bestaande `&nbsp;` tussen de laatste twee woorden blijft staan; het script doet dan niets.
- Handmatig opnieuw uitvoeren voor een stuk van de pagina: `Weeswoorden.verwerk(element)`.

## In gebruik

| Klant | Pagina | Bestanden (in deze volgorde laden) | Versie |
|---|---|---|---|
| Winkelaar | winkelaar.nl/eenmanszaak-of-bv-calculator | `winkelaar/rates-2026.js`, `winkelaar/calculator.js` | `winkelaar-v1.0.0` |

### Winkelaar: jaarlijkse tariefupdate

De tarieven staan los van de rekenlogica in `rates-2026.js`. Voor een nieuw jaar komt er een nieuw tarievenbestand. Let op: `calculator.js` verwijst naar de naam `RATES_2026`, dus die verwijzing moet mee veranderen.

## Controle live sites

Elke maandagochtend kijkt GitHub Actions of de live sites de scripts uit deze repo nog goed laden: is de pagina bereikbaar, staan de scripts er nog in, en klopt de integrity-hash met het bestand bij jsDelivr. Gaat er iets mis, dan komt er een issue in deze repo.

- Pagina's en bestanden staan in `monitor/sites.json`. Een site toevoegen = een blok bijschrijven met `naam`, `url` en `verwacht` (paden in deze repo).
- Met de hand starten: tabblad Actions > Controle live sites > Run workflow.
- GitHub zet geplande workflows uit als er 60 dagen niets in de repo gebeurt. Je krijgt daar vooraf een mail over; met één klik in het tabblad Actions zet je hem weer aan.
