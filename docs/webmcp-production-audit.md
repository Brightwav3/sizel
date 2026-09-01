# Audit produkční věrohodnosti WebMCP

Stav po opravách 31. 8. 2026: odstraněna automatická volba sestavy z WebMCP; přidán samostatný výběr agenta z prohlédnutých kandidátů. Výběr se promítá do původního builderu; dodatečný panel s vysvětlením byl na přání uživatele odstraněn. Opraveny sdílené kontroly úplnosti, dostupnosti, množství a rozpočtu, atomická změna skříně a ventilátorů, undo a zahájení checkoutu. Read snapshot čeká na asynchronní čtení. Doručení používá aktuální datum. Checkout a syntetické recenze jsou označené jako demo. Níže je zachován původní audit; ne všechny jeho nálezy nadále popisují aktuální kód.

Neopraveno nahrazením reálných služeb: katalog zůstává syntetický, stav je v paměti, neexistuje platební backend ani upozorňovací služba. Kvalitu všech vysvětlení agenta nelze vynutit pouhou validací parametrů.

> Historical snapshot from 31. 8. 2026. This audit describes the pre-current tool surface and is retained for decision history; it is not a report of the current 37-tool, 197-test implementation.

Datum: 31. 8. 2026. Rozsah: místní zdrojový kód Rigsmith, 34 definic nástrojů, jejich vazby na UI, katalog, košík a checkout. Nejde o audit nasazeného serveru ani o měření skutečného prohlížeče.

**Verdikt: demo skutečně zjednodušuje doménu natolik, že jeho rychlost nedokazuje připravenost reálného e-shopu. Samotná agregace WebMCP volání je ale použitelná i v produkci.** Z kódu nelze dovodit úmysl klamat. README výslovně uvádí fiktivní obchod a lokální katalog. Benchmark dokumentuje omezení, odděluje čas volání od času celého úkolu a nezahrnuje nákup.

## 1. P1 — Agent obchází některé kontroly UI a dostupnosti

- `src/features/pc-builder/builderVals.ts:103`: UI nedovolí přidat nekompletní sestavu. `src/app/webmcp/tools.ts:810` kontroluje jen kompatibilitu všech `picks`, včetně výchozích dílů. Neověřuje `chosen`. Agent tedy může přidat sestavu i při nulovém počtu výslovně vybraných dílů.
- `add_build_to_cart` nekontroluje sklad. Reprodukce: kompatibilní návrh pro 1700 USD s chladičem `alpine-liquid-420` má `availability.allInStock: false`, přesto se přidá do košíku a `start_checkout` uspěje.
- `src/entities/cart/cartTotals.ts:54`: příznak nedostupnosti se počítá jen u samostatných produktů, nikdy u sestavy. Košík tak nedostupnost sestavy ani nenahlásí.
- `src/app/webmcp/tools.ts:792`: u produktu se kontroluje pouze nulový sklad. Dvě volání s `quantity: 5` vytvoří deset kusů i u GPU, jehož hlášený sklad je nižší než pět. Limit pěti kusů je jen limit přírůstku v jednom volání.

**Dopad:** tvrzení „stejné kontroly jako člověk“ neplatí. Společný controller sám o sobě nestačí, když obchodní pravidla zůstávají v disabled tlačítkách nebo pouze v některých handlerech. Přidání do košíku samo ještě neutrácí peníze; popisy nástrojů jsou v tomto bodě nepřesné.

**Náprava:** jedno společné ověření úplnosti, kompatibility a objednatelnosti pro UI i WebMCP. U skutečného nákupu autoritativní ověření ceny a dostupnosti na serveru. Pokud obchod dovoluje předobjednávky, musí je výslovně označit a mít odpovídající pravidla.

## 2. P1 — Úspěšná odpověď nemusí odpovídat dokončené změně

- `src/app/webmcp/tools.ts:565`: změna skříně provede dvě `instance.set(...)` za sebou. `src/app/App.tsx:217` v obou případech vytváří celý objekt `picks` ze stávajícího `this.state`. Při dávkování aktualizací druhý zápis ventilátorů přepíše změnu skříně. Odpověď se přitom počítá ze samostatného správně sestaveného `next`.
- Cílený test se skutečnými metodami controlleru a odloženou frontou `setState` potvrdil starou skříň a ventilátory nové skříně, ačkoli handler hlásil novou skříň. Jde o reprodukci dávkování ve fixture, nikoli test React DOM v živém prohlížeči.
- `src/app/webmcp/tools.ts:884`: `start_checkout` změní pouze route a vrátí `step: "delivery"`. Při původním `state.step = 2` zůstane skutečný krok review. Potvrzeno cíleným testem.
- `src/app/webmcp/tools.ts:214`: `read_shop` čte vnořené výsledky synchronně a přetypováním předpokládá `ToolCallResult`. Nahrazení čtení asynchronním backendem bez změny agregátoru skončí `section_unavailable`.

**Náprava:** atomický zápis skříně a ventilátorů, výsledek až po dokončené změně, explicitní nastavení checkout kroku, asynchronní agregace čtení. Ověřit také souběžná volání a opakování po timeoutu. Dnes pro zápisy není doložená transakční ani idempotentní vrstva.

## 3. P1 — Sklad, recenze, hlídání a checkout jsou simulace

- `src/data/catalog/realCatalog.ts:5` importuje lokální JSON, cena pochází z `demo_price_cents` na řádku 62. Ve zkoumané aplikaci není obchodní backend pro ceny, sklad nebo objednávky.
- `src/data/catalog/listingStock.ts:29` vyrábí kladné skladové počty hashem SKU, kategorie a barvy. Nulovou dostupnost zachovává z katalogu; kladný počet není inventura.
- `src/data/catalog/reviews.ts:40` a `:96` generují hodnocení a recenze. Také `verified` je generované. `get_reviews` je přesto popisuje jako text nakupujících a nevrací příznak syntetických dat.
- `src/app/App.tsx:39` drží košík a hlídače pouze v paměti komponenty. Není zde persistence ani služba sledující změny a odesílající upozornění. Toast „We will tell you when it is back“ slibuje víc, než implementace dělá.
- `src/features/checkout/CheckoutScreens.tsx:26`: údajná formulářová pole jsou `div`, nikoli vstupy. `checkoutVals.ts:72` přepíná kroky a nakonec route `done` bez validace, platby a vytvoření objednávky. Potvrzení má pevné číslo `48-2291`.
- `src/entities/build/metrics.ts:149`: doručení se odvozuje od pevného 29. 8. 2026, nikoli od aktuálního data.

**Dopad:** demo neměří latenci ani selhání skladu, platby, ukládání či notifikací. Shoda UI a WebMCP zde může znamenat pouze shodu dvou pohledů na stejnou simulaci.

**Náprava:** pro demo označit syntetická data i v odpovědích agentovi. Pro produkční tvrzení zapojit skutečné služby a otestovat jejich chyby, změny dat a obnovu po reloadu. Není nutné přesouvat každé čtení na server; cache je legitimní, pokud je definovaná její platnost.

## 4. P1 — Doporučení optimalizuje zjednodušený model a rozvolňuje rozpočet

- `src/data/catalog/realCatalog.ts:91`: GPU FPS = zaokrouhlení `boostClockMHz / 25 + capacityGB * 2`. CPU skóre je počet jader × 8 + boost GHz × 8; RAM skóre je rychlost / 60. Nejde o měřené herní výsledky.
- `src/entities/build/metrics.ts:137`: výsledné FPS násobí uvedená skóre a pevný koeficient rozlišení. Doporučovač tak hledá dobré skóre v modelu; bez validace nelze výsledek vydávat za kvalitní reálné doporučení. Odpovědi s upozorněním „catalog estimate; not a game benchmark“ jsou správný začátek.
- Kompatibilita kontroluje sedm vybraných pravidel. Neověřuje například rozměry radiátoru, výšku chladiče či BIOS podporu konkrétního CPU. Chybějící fakt zpravidla nevyvolá konflikt. `compatible: true` tedy znamená „bez konfliktu ve známých pravidlech“, nikoli záruku sestavitelnosti.
- `src/app/webmcp/buildAdvisor.ts:210` dovoluje 10 % nad zadáním; na řádku 360 porovnává `withinBudget` s tímto zvýšeným limitem. Test: rozpočet 800 USD → cena 868 USD a `withinBudget: true`; 850 USD → 928 USD a opět true. Nejde jen o názvosloví: agent může respektování rozpočtu chybně potvrdit.

**Náprava:** tvrdý uživatelský rozpočet nebo výslovně povolená tolerance; oddělit `withinBudget` a `withinTolerance`. U kompatibility vracet neověřené podmínky. U výkonu uvést zdroj, rozsah platnosti a nejistotu místo falešné přesnosti.

## 5. Co je legitimní optimalizace a co benchmark skutečně dokazuje

**P1 pro věrohodnost asistovaného výběru: doporučení nevrací důvody jednotlivých rozhodnutí.** `src/app/webmcp/tools.ts:687` deleguje výběr na `recommendBuild`; výstup obsahuje seznam dílů a souhrnné metriky, nikoli porovnané alternativy, důvody jejich odmítnutí a kompromisy. Algoritmus tato rozhodnutí dělá podle rozpočtových podílů, skóre, kompatibility a cen, ale nezachovává je jako vysvětlení. Agent může použít `get_product`, `compare_products` či `explain_build_bottleneck`, takže není bez informací. Samotná rychlá cesta však nedokládá, že porozuměl vhodnosti každého dílu pro zadání. Vysvětlení bottlenecku navíc popisuje omezení výsledné sestavy v interním modelu; nevysvětluje celý výběr.

**P1 pro společnou práci s člověkem: průběh výběru není na stránce vidět.** `read_shop` a porovnávání jsou záměrně bez navigace i mutací. `src/app/App.tsx:273` zapíše všech devět dílů najednou a označí všechny jako vybrané; route nezmění, jen nastaví toast. Plovoucí karta se může aktualizovat, takže nejde o naprostou absenci vizuální reakce. Není však zde zobrazení hledaných kandidátů, porovnání a důvodů výběru. Benchmark přímo předepisuje pořadí čtení → aplikování hotového návrhu → otevření builderu. Popsaný přechod homepage → hotová sestava proto odpovídá implementaci, nikoli jen pomalému překreslování.

**Doporučený směr:** zachovat rychlá strukturovaná čtení, ale při zahájení asistovaného sestavování otevřít pracovní pohled. Zobrazovat skutečné dokončené fáze a porovnávané kandidáty. Návrh má mít u důležitých dílů ověřitelné důvody, jednu relevantní alternativu, rozdíl ceny a známá omezení; důvody musí vycházet ze skutečného výběrového algoritmu nebo doložených porovnání. Oddělit navrženou a použitou sestavu a umožnit úpravu či vrácení změn. Nevkládat umělé prodlevy ani předstírané postupné vybírání, pokud celý návrh vznikl v jednom výpočtu. Není potřeba zobrazovat interní uvažování modelu, ale podklady a výsledky rozhodnutí.

`read_shop`, společný report všech dílů, index SKU, menší odpovědi a atomické nastavení parametrů návrhu dávají smysl i v produkci. WebMCP nemusí napodobovat jednotlivá kliknutí. I návrh celé sestavy jedním nástrojem je legitimní, pokud je to skutečná doménová služba. Vlastní algoritmus zde existuje; nejde pouze o pevně vrácenou sestavu pro jeden prompt.

Nástroje běžně používají stejný katalog, výpočty a controller jako UI. `read_shop` má seznam povolených čtení, nikoli obecné spouštění libovolných zápisů. `recommend_build` neprovádí platbu ani zápis košíku. To jsou použitelné základy.

Naopak submilisekundové lokální výpočty neprokazují rychlost produkčního nákupu. `docs/webmcp-benchmark.md` férově vymezuje pouze doporučení a konfiguraci bez košíku, hlídačů a checkoutu. Uvádí 81 sekund a 15 volání a výslovně říká, že cíl pod minutu zatím nebyl prokázán. To není důkaz falšování výsledku.

Férové následné měření: stejný úkol a stejné obchodní kontroly pro UI i WebMCP; explicitně uvést stav cache, načítání, změny skladu/ceny, opakování volání, dokončení zápisu a screenshot. Oddělit úsporu komunikace s agentem od rychlosti doménových služeb. Pro nákup přidat ověření objednávky; nevydávat konfiguraci za dokončený nákup.

Ověření k 31. 8. 2026: původních **125 testů prošlo**. Pět dočasných cílených testů potvrdilo výše popsané současné chování, včetně překročení rozpočtu. Fixture používala skutečné metody controlleru s nahrazeným `setState`, ne živé React DOM. Dočasná fixture byla po auditu odstraněna; aplikační kód se neměnil.

Aktuální [specifikace WebMCP](https://webmachinelearning.github.io/webmcp/) popisuje klientské JavaScriptové nástroje a sdílený kontext s uživatelem; k datu auditu jde o Draft Community Group Report z 26. 8. 2026, nikoli hotový W3C standard. Samotný přímý přístup handleru k aplikační logice proto není produkční prohřešek. Rozhodující jsou pravdivá data, autoritativní obchodní kontroly a správné dokončení operací.
