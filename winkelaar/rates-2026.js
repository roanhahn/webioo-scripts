/*
 * Winkelaar – Eenmanszaak of BV calculator
 * Tarieven 2026 (alleen data, geen rekenlogica).
 * Jaarlijkse update: alleen dit bestand aanpassen, nieuwe tag, nieuwe hash.
 * Moet vóór calculator.js geladen worden.
 */
const RATES_2026={zelfstandigenaftrek:1200,startersaftrek:2123,mkbWinstvrijstellingPct:.127,box1Schijven:[{tot:38883,tarief:.3575},{tot:78426,tarief:.3756},{tot:1/0,tarief:.495}],tariefsaanpassingPct:.1194,zvw:{eenmanszaakPct:.0485,dgaPct:.0485,werkgeversheffingPct:.061,maxBijdrageInkomen:79409},algemeneHeffingskorting:{max:3115,afbouwGrens:29736,afbouwPct:.06398,nihilVanaf:78426},arbeidskorting:{max:5685,afbouwGrens:45592,afbouwPct:.0651,nihilVanaf:132920},vpbSchijven:[{tot:2e5,tarief:.19},{tot:1/0,tarief:.258}],box2:{eersteSchijfGrens:68843,eersteSchijfTarief:.245,tweedeSchijfTarief:.31}};
"undefined"!=typeof module?module.exports={RATES_2026:RATES_2026}:(window.RATES_2026=RATES_2026);
