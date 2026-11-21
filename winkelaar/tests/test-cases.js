/*
 * Testcases voor de Winkelaar-calculator (niet laden op de site).
 * Uitvoeren: node winkelaar/tests/test-cases.js
 */
const TEST_CASES=[{naam:"Berekenhet.nl — winst €150.000, met startersaftrek",bron:"berekenhet.nl",input:{winstUitOnderneming:15e4,dgaSalaris:58e3,extraKostenBv:0,zelfstandigenaftrek:!0,startersaftrek:!0},verwacht:{eenmanszaak:{zelfstandigenaftrek:3323,mkbWinstvrijstelling:18628,belastbaarInkomen:128049,belastingBox1:53316,zvw:3851,heffingskortingen:0,tariefsaanpassingBox1:2620,nettoInkomen:90213},bv:{winstVoorVpb:92e3,vennootschapsbelasting:17480,winstNaBelasting:74520,belastingBox2:18625,nettoDividend:55895,belastingBox1Salaris:21080,zvwDga:2812,heffingskortingenDga:4877,nettoInkomen:94880}}},{naam:"Wetaxus.nl — winst €150.000, zonder startersaftrek",bron:"wetaxus.nl",input:{winstUitOnderneming:15e4,dgaSalaris:58e3,extraKostenBv:0,zelfstandigenaftrek:!0,startersaftrek:!1},verwacht:{eenmanszaak:{zelfstandigenaftrek:1200,mkbWinstvrijstelling:18898,belastbaarInkomen:129902,belastingBox1:54234,zvw:3851,heffingskortingen:0,tariefsaanpassingBox1:2400,nettoInkomen:89516},bv:{winstVoorVpb:92e3,vennootschapsbelasting:17480,winstNaBelasting:74520,belastingBox2:18626,nettoDividend:55894,nettoDgaSalaris:38983,nettoInkomen:94877}}}];
if (require.main === module) {
  const { RATES_2026 } = require('../rates-2026.js');
  // calculator.js bevat ook de weergave; zonder pagina stopt die meteen.
  global.document = { getElementById: () => null };
  const origWarn = console.warn; console.warn = () => {};
  const calc = require('../calculator.js');
  console.warn = origWarn;
  let fouten = 0;
  for (const tc of TEST_CASES) {
    const res = calc.vergelijk(tc.input, RATES_2026);
    for (const kant of ['eenmanszaak','bv']) {
      for (const [veld, verwacht] of Object.entries(tc.verwacht[kant])) {
        const echt = res[kant][veld];
        const ok = Math.abs(Math.round(echt) - verwacht) <= 5; // referentietools ronden per stap af, kleine verschillen zijn normaal
        if (!ok) { fouten++; console.log('AFWIJKING', tc.bron, kant, veld, 'verwacht', verwacht, 'kreeg', Math.round(echt)); }
      }
    }
  }
  console.log(fouten === 0 ? 'Alle testcases OK (marge ±5 euro)' : fouten + ' afwijkingen');
}
module.exports = { TEST_CASES };
