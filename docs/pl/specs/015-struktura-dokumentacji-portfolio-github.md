# Specyfikacja 015 — Struktura dokumentacji portfolio na GitHubie

## Status

Wdrożone częściowo: angielska ścieżka portfolio, `docs/pl/` i dokumenty publiczne są przygotowane. Zrzuty ekranu, link demo, licencja i konfiguracja GitHub About pozostają świadomymi zadaniami zależnymi od właściciela repozytorium.

## Cel

Ułożyć repozytorium CreditScope tak, aby rekruter anglojęzyczny w mniej niż kilka minut mógł zrozumieć:

1. czym jest projekt;
2. jakie problemy techniczne i finansowe rozwiązuje;
3. jak go uruchomić;
4. jakie są granice metodologii;
5. gdzie znaleźć szczegóły bez przeszukiwania historycznych notatek.

Angielska dokumentacja ma być główną ścieżką publiczną. Polskie dokumenty mogą pozostać jako archiwum, ale nie mogą konkurować z angielskim opisem na stronie głównej repozytorium.

## Docelowa struktura

```text
CreditScope/
├── README.md                         # English — główna strona projektu na GitHubie
├── .env.example                      # English comments — bez sekretów
├── LICENSE                           # opcjonalnie, po decyzji właściciela licencji
├── docs/
│   ├── ARCHITECTURE.md               # English — architektura i przepływ danych
│   ├── METHODOLOGY.md                # English — model finansowy, ograniczenia, pojęcia
│   ├── SETUP.md                      # English — uruchomienie, testy, opcjonalny Supabase
│   ├── PORTFOLIO.md                  # English — zakres projektu, osiągnięcia, demo/screenshots
│   ├── assets/
│   │   ├── calculator-en.png         # zatwierdzony zrzut ekranu, jeśli dostępny
│   │   ├── schedule-en.png
│   │   └── advanced-simulation-en.png
│   └── pl/                           # opcjonalne polskie archiwum; nie jest główną ścieżką
│       ├── metodologia-obliczen-kredytowych.md
│       ├── uruchomienie-pelnej-aplikacji-na-nowym-urzadzeniu.md
│       └── specs/
│           ├── 001-...md
│           └── 013a-...md
└── src/
```

Nie należy tworzyć drugiego katalogu kodu, np. `en/src/`, ani drugiego repozytorium tylko dla tłumaczeń. Kod pozostaje jeden; zmienia się wyłącznie dokumentacja i język interfejsu.

## Zasady widoczności

### 1. `README.md` — obowiązkowy, angielski

To jedyny dokument, który GitHub pokazuje odwiedzającemu automatycznie. Musi być krótki, aktualny i zawierać:

- jednozdaniowy opis projektu;
- 4–6 najważniejszych funkcji faktycznie dostępnych w aplikacji;
- stack technologiczny;
- zastrzeżenie edukacyjne i granice modelu finansowego;
- krótkie uruchomienie lokalne;
- linki względne do `ARCHITECTURE.md`, `METHODOLOGY.md`, `SETUP.md` i `PORTFOLIO.md`;
- opcjonalnie odnośnik do działającego demo oraz 1–3 prawdziwe zrzuty ekranu.

Nie należy umieszczać w README pełnej historii specyfikacji, dużych fragmentów metodologii, prywatnych danych, kluczy ani deklaracji o funkcjach, których aplikacja nie posiada.

### 2. `docs/PORTFOLIO.md` — obowiązkowy dla portfolio

Dokument ma służyć rekruterowi, a nie zastępować README. Powinien opisywać:

- problem i grupę użytkowników;
- najważniejsze decyzje techniczne: precyzja finansowa, walidacja, testy, i18n, opcjonalna integracja Supabase;
- przepływ: formularz → kalkulacja → harmonogram → scenariusze/nadpłaty → eksport;
- listę demonstracyjną funkcji;
- ograniczenia i uczciwe rozgraniczenie od bankowego scoringu lub decyzji kredytowej;
- link do demo tylko wtedy, gdy jest aktywne i publiczne.

Nie powinien zawierać autobiografii, długich opisów nauki ani historii każdego commitu.

### 3. `docs/ARCHITECTURE.md`, `METHODOLOGY.md`, `SETUP.md` — obowiązkowe, angielskie

| Plik | Odbiorca | Maksymalny cel |
| --- | --- | --- |
| `ARCHITECTURE.md` | developer / rekruter techniczny | wyjaśnia granice komponentów, dane i przepływ obliczeń |
| `METHODOLOGY.md` | rekruter fintech / product | wyjaśnia wzory, wskaźniki i ograniczenia bez udawania oferty bankowej |
| `SETUP.md` | osoba uruchamiająca projekt | prowadzi od instalacji do testów i opcjonalnej konfiguracji Supabase |

Każdy z tych dokumentów powinien mieć angielski tytuł, wstęp, nagłówki, przykłady i komunikaty. Linki pomiędzy nimi muszą być względne, aby działały po sklonowaniu repozytorium.

### 4. `docs/assets/` — zalecany po przygotowaniu materiałów

W folderze mogą znajdować się wyłącznie prawdziwe, aktualne materiały demonstracyjne. Nazwy plików należy utrzymywać po angielsku. Minimalny zestaw:

- formularz i wynik w `EN`;
- harmonogram spłaty;
- rozszerzona symulacja z nadpłatą.

Nie dodawać automatycznie wygenerowanych zrzutów, które nie pokazują aktualnej wersji aplikacji.

## Polskie dokumenty

### Wariant rekomendowany: archiwum w `docs/pl/`

Istniejące polskie specyfikacje 001–013a, metodologia, instrukcja nowego urządzenia i `PLAN.md` należy zachować, jeśli są ważną historią projektu, ale przenieść do `docs/pl/`.

- polskie materiały zachowują oryginalne nazwy i treść;
- nie są linkowane z pierwszego ekranu README;
- `docs/pl/README.md` krótko wyjaśnia po polsku, że główna dokumentacja portfolio jest po angielsku;
- angielska dokumentacja nie może od nich zależeć, aby być zrozumiała.

### Wariant minimalny: pozostawienie w obecnych lokalizacjach

Jeżeli historia plików i ich ścieżek jest ważniejsza niż porządek, materiały mogą pozostać w obecnych lokalizacjach. W takim przypadku README nadal odsyła wyłącznie do angielskich dokumentów, a sekcja `Repository guide` wyjaśnia, że `docs/specs/` jest archiwum po polsku.

Nie należy usuwać polskich dokumentów z publicznego repozytorium bez osobnej, wyraźnej decyzji użytkownika.

## Mapowanie obecnych plików

| Obecny plik | Docelowe działanie | Język docelowy |
| --- | --- | --- |
| `README.md` | utrzymać jako punkt startowy | EN |
| `docs/ARCHITECTURE.md` | utrzymać | EN |
| `docs/METHODOLOGY.md` | utrzymać i rozbudować tylko o aktualny zakres | EN |
| `docs/SETUP.md` | utrzymać | EN |
| `docs/PORTFOLIO.md` | utworzyć | EN |
| `.env.example` | utrzymać komentarze bez sekretów | EN |
| `docs/specs/014-...md` | utrzymać jako angielską decyzję o portfolio | EN |
| `PLAN.md`, metodologia po polsku, instrukcja i specs 001–013a | zachować lub przenieść do `docs/pl/` | PL |

## Rozbudowanie angielskiej metodologii

### Cel `docs/METHODOLOGY.md`

Angielska metodologia ma być samodzielnym dokumentem dla rekrutera technicznego, osoby z obszaru fintech lub product managera. Nie może wymagać znajomości polskiej metodologii, aby zrozumieć model zaimplementowany w aplikacji.

Dokument nie zastępuje pełnej dokumentacji prawnej produktu kredytowego i nie może sugerować, że CreditScope oblicza ofertę bankową lub podejmuje decyzję kredytową.

### Docelowa struktura dokumentu

```text
1. Purpose and scope
2. Input data used by the application
3. Core assumptions of the basic scenario
4. Annuity instalments
5. Declining instalments and prepayments
6. Repayment schedule construction and rounding
7. Presented metrics
   - monthly instalment
   - total repayment
   - interest cost
   - indicative debt-service ratio
   - surplus before living costs
8. APR / RRSO boundary
9. Credit-risk and affordability boundary
10. Validation and test evidence
11. Terminology glossary
12. Sources and further reading
```

### Wymagana zawartość

#### 1. Purpose and scope

- jasno nazwać aplikację edukacyjnym kalkulatorem scenariuszy kredytowych;
- wyjaśnić, że model podstawowy nie jest ofertą, poradą finansową ani decyzją kredytową;
- wskazać walutę `PLN` i miesięczną częstotliwość modelu.

#### 2. Input data and basic assumptions

Należy wymienić faktycznie używane pola: loan amount, annual nominal interest rate, repayment term, monthly net income i existing monthly obligations. Trzeba jednoznacznie wskazać założenia modelu podstawowego:

- pojedyncza wypłata kapitału na początku;
- stała nominalna stopa roczna przeliczona jako `annual rate / 12`;
- płatności miesięczne na końcu okresu;
- brak prowizji, obowiązkowego ubezpieczenia, opłat okresowych, kosztów windykacji i naliczania dziennego;
- brak gwarancji zgodności z polityką zaokrągleń konkretnego banku.

#### 3. Formuły i harmonogram

Dokument powinien podać równanie raty annuitetowej wraz z przypadkiem `i = 0`, a następnie kolejne kroki harmonogramu: interest, principal i remaining balance. Musi wyjaśniać, dlaczego udział odsetek jest większy na początku okresu.

Dla wariantu malejącego należy podać stałą część kapitałową, zmniejszającą się część odsetkową i konsekwencję w postaci wyższej pierwszej raty. Dla nadpłat należy opisać aktualnie zaimplementowaną zasadę: dodatkowa spłata kapitału skraca okres scenariusza; rzeczywisty bank może zastosować inne rozliczenie.

#### 4. Metryki widoczne w interfejsie

Każda metryka musi zawierać wzór lub opis obliczenia oraz uczciwą interpretację:

| Metryka EN | Znaczenie |
| --- | --- |
| Monthly instalment | rata w modelu podstawowym albo pierwsza rata w wariancie malejącym |
| Total repayment | suma rat z harmonogramu scenariusza |
| Interest cost | suma odsetek; w modelu bez dodatkowych kosztów jest równa kosztowi scenariusza |
| Indicative debt-service ratio | `(new instalment + existing obligations) / net income × 100` |
| Surplus before living costs | `net income − existing obligations − new instalment` |

Należy podkreślić, że surplus nie obejmuje kosztów życia, a debt-service ratio nie jest bankowym scoringiem.

#### 5. APR / RRSO boundary

Należy rozróżnić polskie RRSO od angielskiego APR (Annual Percentage Rate). Sekcja ma wyjaśniać, że wiarygodne APR/RRSO wymaga wszystkich obowiązkowych, datowanych przepływów pieniężnych — w tym prowizji, ubezpieczeń i kosztów pobranych poza ratą. Basic form nie zbiera pełnego zestawu tych danych, więc nie może wyświetlać faktycznego APR/RRSO oferty.

#### 6. Risk and affordability boundary

Należy opisać, czego aplikacja nie oblicza: PD, LGD, EAD, historii kredytowej, stabilności dochodu, LTV, kosztów gospodarstwa domowego i polityki ryzyka banku. Można opisać debt-service ratio jako prostą miarę edukacyjną, ale nie wolno nazywać jej credit score, probability of approval ani low-risk rating.

#### 7. Validation and evidence

Sekcja powinna wymienić istotne testy: przypadek oprocentowania 0%, saldo końcowe, podział raty na kapitał i odsetki, harmonogram, nadpłaty, lokalizację formatowania i walidację danych. Ma prowadzić linkiem względnym do odpowiednich testów lub `ARCHITECTURE.md`, bez wklejania całych raportów testowych.

#### 8. Terminology and sources

Należy utrzymać spójne nazwy: `annuity instalment`, `declining instalment`, `principal`, `interest`, `prepayment`, `total cost of credit`, `total amount payable`, `debt-service ratio` oraz `APR`.

Źródła powinny być krótką listą bezpośrednich, wiarygodnych materiałów: oficjalne akty prawne, KNF, EBA i dokumentacja techniczna bibliotek użytych do obliczeń. Źródło musi wspierać konkretną tezę; nie należy kopiować długich fragmentów ani mieszać źródeł prawnych z opisem implementacji.

### Kryteria akceptacji metodologii

- [ ] Całość dokumentu jest po angielsku i można ją przeczytać bez polskiego archiwum.
- [ ] Wszystkie wzory odpowiadają aktualnej implementacji albo są jasno oznaczone jako ograniczenie/przyszły wariant.
- [ ] Terminologia jest zgodna w README, interfejsie i `METHODOLOGY.md`.
- [ ] APR/RRSO, risk i affordability nie są przedstawiane jako wynik bankowy.
- [ ] Każde źródło jest bezpośrednio związane z opisaną tezą.
- [ ] Dokument linkuje względnie do architektury, setupu i — jeśli zostaną dodane — testów lub zasobów demonstracyjnych.

## Co nie powinno znaleźć się w portfolio

- `.env`, `.env.local`, klucze Supabase, dane użytkowników i eksporty prywatnych symulacji;
- logi Vite, `dist/`, `node_modules/`, raporty pokrycia testów;
- automatycznie tłumaczone, niezweryfikowane dokumenty finansowe;
- stare wersje kodu aplikacji przechowywane wyłącznie „na wszelki wypadek”;
- opis funkcji nieobecnych w aktualnym `main`.

## Plan wdrożenia

1. Zatwierdzić wariant polskich dokumentów: `docs/pl/` (rekomendowany) albo pozostawienie obecnych ścieżek.
2. Utworzyć `docs/PORTFOLIO.md` po angielsku.
3. Sprawdzić i uzupełnić angielskie README o aktualny link demo oraz prawdziwe zrzuty ekranu, jeśli są dostępne.
4. Opcjonalnie dodać `LICENSE` po podaniu przez właściciela wybranej licencji i danych autora.
5. Ustawić w GitHub About angielski opis oraz tematy: `react`, `typescript`, `vite`, `fintech`, `loan-calculator`, `i18n`, `supabase`, `vitest`.
6. Przejść README jak osoba z zewnątrz: każdy główny link ma działać, a uruchomienie ma być możliwe bez wiedzy o historii projektu.

## Kryteria akceptacji

- [ ] Root `README.md` jest w pełni angielski i wystarcza do pierwszego zrozumienia projektu.
- [ ] Istnieje angielski `docs/PORTFOLIO.md` z rzeczywistymi osiągnięciami i ograniczeniami projektu.
- [ ] `ARCHITECTURE.md`, `METHODOLOGY.md` i `SETUP.md` są aktualne, angielskie i linkują się względnie.
- [ ] Polskie dokumenty są zachowane zgodnie z wybranym wariantem, ale nie zasłaniają ścieżki angielskiej.
- [ ] Repozytorium nie zawiera sekretów, artefaktów builda, logów ani zbędnej kopii kodu.
- [ ] Tekst w About i topics na GitHubie odpowiada aktualnemu projektowi.
