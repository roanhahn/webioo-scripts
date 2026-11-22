# Webioo scripts

JavaScript voor klantsites van Webioo Digital Agency, geladen via jsDelivr.

Deze repo is voor klanten waar alleen Webioo aan werkt. Werkt er een externe partij mee aan de code, dan krijgt die klant een eigen repo in `webioo-nl` (zoals `webioo-nl/abk`), zodat die partij niet bij de code van andere klanten kan.

## Structuur

Eén map per klant, alles in kleine letters.

```
scripts/
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

- Tags gelden voor de hele repo, dus met de klant ervoor: `winkelaar-v1.0.0`, `winkelaar-v1.0.1`.
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
node winkelaar/tests/test-cases.js
```

Vergelijkt de uitkomsten van de calculator met referentieberekeningen. Een verschil van een paar euro is normaal: de referentietools ronden per tussenstap af.

## In gebruik

| Klant | Pagina | Bestanden (in deze volgorde laden) | Versie |
|---|---|---|---|
| Winkelaar | winkelaar.nl/eenmanszaak-of-bv-calculator | `winkelaar/rates-2026.js`, `winkelaar/calculator.js` | `winkelaar-v1.0.0` |

### Winkelaar: jaarlijkse tariefupdate

De tarieven staan los van de rekenlogica in `rates-2026.js`. Voor een nieuw jaar komt er een nieuw tarievenbestand. Let op: `calculator.js` verwijst naar de naam `RATES_2026`, dus die verwijzing moet mee veranderen.
