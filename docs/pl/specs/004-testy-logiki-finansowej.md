# Specyfikacja 004 — Testy logiki finansowej

## Status

Zaimplementowano 25.07.2026. Zweryfikowano komendami `build`, `lint`, `format:check` i `test`.

## Cel

Rozszerzyć testy jednostkowe silnika kredytowego o niezależne wartości referencyjne, scenariusze graniczne i własności całego harmonogramu. Etap ma wykrywać regresje w formule rat równych, księgowaniu do grosza, korekcie ostatniej raty oraz wyliczaniu wskaźnika obciążenia dochodu.

Ten etap testuje kontrakt publiczny `calculateLoan` z etapu 003. Nie zmienia algorytmu, polityki `ROUND_HALF_UP`, modelu danych ani interfejsu użytkownika.

## Kontekst produktu

CreditScope jest edukacyjną, lokalną symulacją kredytu z ratami równymi. Etap 002 zapewnił poprawność danych wejściowych, a etap 003 zdefiniował ich obliczanie w `decimal.js`, miesięczny harmonogram i wartości zwracane przez `LoanCalculationResult`.

Testy finansowe mają potwierdzać arytmetykę i spójność danych, nie podejmować decyzji o zdolności kredytowej. Wskaźnik obciążenia dochodu pozostaje liczbą informacyjną, również gdy przekracza `100%`.

## Zakres

### W zakresie

- Testy wartości referencyjnych raty, odsetek, sum i wskaźnika obciążenia.
- Testy kredytu bez odsetek, najkrótszego obsługiwanego okresu, dużej kwoty i wysokiego oprocentowania.
- Testy własności harmonogramu: liczby rat, kolejności, groszy, sum kapitału i odsetek oraz salda końcowego.
- Testy polityki `ROUND_HALF_UP`, w tym korekty ostatniej raty.
- Dalsza weryfikacja zachowania walidacji Zod z etapu 002.
- Przejrzyste dane testowe i pomocniki, które nie duplikują produkcyjnego algorytmu.

### Poza zakresem

- Modyfikowanie wzoru rat, polityki zaokrągleń, typów `LoanInput` lub publicznego API `calculateLoan`.
- Dodawanie formularza, komponentów Reacta, tabeli harmonogramu, wykresów albo testów E2E.
- Raty malejące, nadpłaty, prowizje, RRSO, daty rat i zmienne oprocentowanie.
- Ustalanie progów „bezpiecznego” obciążenia dochodu lub ocena zdolności kredytowej.
- Backend, żądania sieciowe, `localStorage`, eksport i dane rzeczywistych klientów.

## Decyzje architektoniczne

| Obszar | Decyzja | Uzasadnienie |
| --- | --- | --- |
| Poziom testów | Vitest testuje wyłącznie publiczne `calculateLoan` i `loanInputSchema`. | Testy pozostają odporne na refaktoryzację prywatnych pomocników silnika. |
| Lokalizacja | Scenariusze silnika rozwijają `src/lib/finance/loanCalculator.test.ts`; walidacja pozostaje w `src/features/calculator/validation/loanInputSchema.test.ts`. | Testy są blisko kodu, którego dotyczą, bez mieszania warstwy finansowej z UI. |
| Wartości referencyjne | Oczekiwane liczby są zapisane jako literały i potwierdzone niezależnym arkuszem lub kalkulatorem wykorzystującym wzór z dokumentacji. | Test nie może wyprowadzać oczekiwanej raty przez wywołanie `calculateLoan` ani kopiować pełnego algorytmu produkcyjnego. |
| Spójność groszy | Sumy i równania wierszy są sprawdzane z `Decimal`, nie przez binarne dodawanie `number`. | Sam test nie może wprowadzać błędu zmiennoprzecinkowego podczas kontroli wyniku. |
| Porównania | Kwoty po zaokrągleniu do grosza są porównywane dokładnie; nie używa się tolerancji dla pieniędzy. | Etap 003 zdefiniował deterministyczne księgowanie `ROUND_HALF_UP`. |
| Zakres walidacji | Obecne testy Zod są utrzymywane i uzupełniane tylko o regresje związane z przekazaniem prawidłowych danych do silnika. | Obliczenia nadal zakładają uprzednio zwalidowany `LoanInput` i nie importują Zod. |

## Stan wyjściowy i struktura po etapie

```text
src/
├── features/
│   └── calculator/
│       └── validation/
│           ├── loanInputSchema.ts
│           └── loanInputSchema.test.ts
├── lib/
│   └── finance/
│       ├── loanCalculator.ts
│       └── loanCalculator.test.ts
└── types/
    └── loan.ts
```

Nie tworzy się nowego modułu obliczeń ani nowego API tylko dla testów. Dopuszczalne są lokalne funkcje pomocnicze w pliku testowym, np. `sumMoney`, `expectScheduleIntegrity` i fabryka danych wejściowych. Nie eksportuje się ich do kodu produkcyjnego.

## Kontrakt objęty testami

```ts
export function calculateLoan(input: LoanInput): LoanCalculationResult;
```

Wszystkie scenariusze korzystają z prawidłowego `LoanInput`, chyba że testują konkretnie `loanInputSchema`. Funkcja `calculateLoan` nie jest drugim miejscem walidacji danych i nie należy w tym etapie dodawać do niej Zod.

Testy respektują poniższe ustalenia z etapu 003:

- okres to dodatnia, całkowita liczba lat, a liczba rat wynosi `termYears * 12`;
- `annualInterestRate: 7.5` oznacza `7,5%` nominalnie w skali roku;
- kwoty wejściowe są normalizowane do dwóch miejsc `ROUND_HALF_UP`;
- regularna rata jest zaokrąglona do grosza, a ostatnia rata może ją różnić o kilka groszy;
- kwoty wyniku są `number`, ale ich weryfikacja pieniężna w testach używa `Decimal`;
- `debtBurdenRatio` jest procentem, nie ułamkiem.

## Wartości referencyjne

Poniższe wartości są stałymi referencyjnymi do asercji. Zostały policzone niezależnie ze wzoru raty równej oraz z miesięcznego księgowania opisanego w specyfikacji 003, a następnie zaokrąglone do grosza metodą `ROUND_HALF_UP`.

| Scenariusz | Dane wejściowe | Oczekiwane wartości |
| --- | --- | --- |
| Typowy kredyt | `loanAmount: 120000`, `annualInterestRate: 6`, `termYears: 1`, `monthlyNetIncome: 10000`, `monthlyObligations: 1000` | Regularna rata `10327.97`; suma rat `123935.66`; odsetki i koszt `3935.66`; wskaźnik `113.28`; pierwsze odsetki `600.00`; ostatnia rata `10327.99`. |
| Brak odsetek | `loanAmount: 1200`, `annualInterestRate: 0`, `termYears: 1`, `monthlyNetIncome: 10000`, `monthlyObligations: 0` | Rata `100.00`; 12 rat; suma rat `1200.00`; koszt i odsetki `0.00`; każda część odsetkowa `0.00`. |
| Ułamek grosza | `loanAmount: 1000.005`, `annualInterestRate: 0`, `termYears: 1`, `monthlyNetIncome: 1000.005`, `monthlyObligations: 0.005` | Wewnętrzna kwota kredytu `1000.01`; regularna rata `83.33`; ostatnia rata `83.38`; suma rat `1000.01`; wskaźnik `8.33`. |

Wartości referencyjne są celowo zapisane bez formatowania `pl-PL`; formatowanie należy do warstwy UI z etapu 005. W teście nie należy tworzyć oczekiwań przez wyliczenie formuły tą samą sekwencją działań co w `loanCalculator.ts`.

## Scenariusze graniczne

### Najkrótszy obsługiwany okres

Aktualny `LoanInput.termYears` wymaga dodatniej liczby całkowitej lat. Najkrótszy prawidłowy okres ma więc `1` rok, czyli `12` rat. Test potwierdza dokładnie 12 pozycji, numery od 1 do 12 oraz saldo końcowe `0`.

Plan projektu wspomina o „pojedynczej racie”, lecz obecny kontrakt nie pozwala wyrazić jednego miesiąca. Etap 004 nie obchodzi tej granicy przez nieprawidłowe dane ani zmianę typu. Prawdziwy test jednej raty może zostać dodany dopiero po świadomym rozszerzeniu modelu o okres w miesiącach i aktualizacji wcześniejszych specyfikacji.

### Duża kwota i wysokie oprocentowanie

Należy dodać dwa niezależne scenariusze, np.:

- duża kwota: `10000000 PLN`, `12.5%`, `30 lat`, dodatni dochód i zobowiązania;
- wysokie oprocentowanie: `250000 PLN`, `48%`, `5 lat`, dodatni dochód i zobowiązania.

W tych testach wymagane są własności, a nie ręcznie wpisana cała lista rat: skończone wyniki, prawidłowa liczba rat, kwoty do grosza, brak ujemnego salda, zgodność sum i końcowe saldo `0`. Scenariusze mają wykryć przepełnienie, regresje w potęgowaniu i błędy kolejnych miesięcy bez wprowadzania arbitralnych limitów biznesowych.

### Dodatkowe przypadki zaokrągleń

Testy obejmują co najmniej:

- wejściową wartość kończącą się na `...005`, zaokrąglaną w górę;
- kwotę niepodzielną równo przez 12 przy `0%`, z korektą ostatniej raty;
- przypadek z dodatnim oprocentowaniem, w którym ostatnia rata różni się od regularnej wskutek księgowania do grosza;
- brak `-0` w dowolnym polu wyniku i harmonogramu.

## Własności harmonogramu

Każdy scenariusz z dodatnim okresem i poprawnymi danymi finansowymi musi spełniać poniższe własności:

1. `schedule.length === termYears * 12`.
2. `installmentNumber` ma kolejno wartości od `1` do długości harmonogramu.
3. Wszystkie wartości liczbowe wyniku są skończone.
4. Każda kwota pieniężna ma nie więcej niż dwa miejsca po przecinku; test sprawdza to przez `Decimal.decimalPlaces()`.
5. W każdym wierszu `installmentAmount = principalAmount + interestAmount` dokładnie do grosza.
6. `remainingBalance` nigdy nie jest ujemne i po ostatniej racie wynosi dokładnie `0`.
7. Suma `principalAmount` jest równa znormalizowanej kwocie kredytu.
8. Suma `interestAmount` jest równa `totalInterestAmount`, a suma `installmentAmount` jest równa `totalRepaymentAmount`.
9. `totalCreditCost = totalInterestAmount` w obecnym MVP bez dodatkowych opłat.
10. Dla stałej dodatniej stopy część odsetkowa nie rośnie między kolejnymi ratami, a saldo nie rośnie. Równe wartości po zaokrągleniu są dopuszczalne.
11. Żaden wynik nie jest `-0`.

Własności 4–9 są kontrolowane przez dokładne operacje `Decimal`. Nie stosuje się `toBeCloseTo` ani tolerancji centowej.

## Wskaźnik obciążenia dochodu

Należy jawnie testować wzór:

```text
((monthlyInstallment + monthlyObligations) / monthlyNetIncome) × 100
```

Test powinien potwierdzić, że:

- stosowana jest regularna rata, a nie skorygowana ostatnia rata;
- wartość `113.28` z przykładu referencyjnego nie jest ograniczana do `100`;
- wynik jest wartością procentową, dlatego `113.28` nie może być zapisywane jako `1.1328`;
- zwiększenie zobowiązań przy pozostałych danych powoduje wzrost wskaźnika;
- testy nie dodają żadnej etykiety, progu ani oceny użytkownika.

## Regresje walidacji

Testy z etapu 002 pozostają obowiązkowe. Etap 004 utrzymuje co najmniej następujące reguły:

- dodatnia kwota kredytu i dochód netto;
- nieujemne oprocentowanie i miesięczne zobowiązania;
- dodatni okres jako pełna liczba lat;
- akceptacja `0%`, `0 zł` zobowiązań i wartości dziesiętnych;
- odrzucanie `NaN`, nieskończoności, tekstu, `null`, `undefined` oraz brakujących pól;
- polskie komunikaty walidacyjne.

Nie należy testować błędnych danych przez `calculateLoan`, ponieważ to zmieniłoby granicę odpowiedzialności uzgodnioną w etapie 002. Testy walidacji nadal wywołują `loanInputSchema.safeParse`.

## Wymagania jakościowe

- Testy są deterministyczne, lokalne i nie wymagają sieci, zegara systemowego ani DOM.
- Dane wejściowe nie są mutowane; co najmniej jeden test porównuje obiekt przed i po wywołaniu silnika.
- Nazwy scenariuszy i komentarze są po polsku, a identyfikatory techniczne po angielsku.
- Testy nie importują prywatnych funkcji silnika, nie używają `any` i nie wyciszają błędów TypeScript.
- Asercje weryfikują zarówno wartości referencyjne, jak i własności całego harmonogramu; samo pokrycie linii nie jest kryterium wystarczającym.
- Ekran startowy pozostaje bez formularza i wyników; etap 004 nie dodaje testów komponentowych finansów.

## Kryteria akceptacji

Etap jest ukończony, gdy:

- [x] `loanCalculator.test.ts` zawiera literalne wartości referencyjne dla typowego kredytu, `0%` i ułamka grosza.
- [x] Referencje potwierdzają ratę, sumę rat, koszt, odsetki, wskaźnik oraz wybrane pozycje harmonogramu.
- [x] Są testy najkrótszego obsługiwanego okresu (12 rat), dużej kwoty i wysokiego oprocentowania.
- [x] Każdy główny scenariusz sprawdza własności harmonogramu: liczbę i kolejność rat, sumy, saldo końcowe, brak wartości ujemnych i grosze.
- [x] Testy dokładnie weryfikują `ROUND_HALF_UP` oraz techniczną korektę ostatniej raty.
- [x] Wskaźnik obciążenia jest testowany jako procent bez limitowania i bez oceny użytkownika.
- [x] Testy walidacji z etapu 002 nadal przechodzą i obejmują wszystkie pola oraz wartości graniczne.
- [x] Nie ma nowych zależności, UI, kodu sieciowego, persystencji ani zmiany publicznego API silnika.
- [x] `npm run build`, `npm run lint`, `npm run format:check` oraz `npm run test` kończą się powodzeniem.

## Plan implementacji

1. Uporządkować dane testowe i pomocniki `Decimal` w `loanCalculator.test.ts` bez eksportowania ich do kodu produkcyjnego.
2. Zastąpić lub rozszerzyć podstawowe asercje etapem referencyjnym dla typowego kredytu, porównując literalne wartości z tabeli.
3. Dodać testy `0%`, ułamka grosza i korekty ostatniej raty.
4. Dodać pomocnik sprawdzający własności całego harmonogramu i zastosować go do typowych oraz skrajnych scenariuszy.
5. Dodać scenariusze dużej kwoty i wysokiej stopy, które potwierdzają skończone wyniki oraz niezmienniki bez duplikowania formuły produkcyjnej.
6. Zachować i w razie potrzeby rozszerzyć testy `loanInputSchema` bez przenoszenia walidacji do silnika.
7. Uruchomić `npm run build`, `npm run lint`, `npm run format:check` i `npm run test`.

## Ryzyka i zasady na kolejne etapy

- Wartości referencyjne muszą pochodzić z niezależnego obliczenia. Skopiowanie wyniku wygenerowanego przez testowaną funkcję nie chroni przed błędem wspólnym.
- Test nie powinien kopiować pełnej pętli harmonogramu produkcyjnego, bo ta sama wada mogłaby wystąpić po obu stronach asercji. Własności i literały są bardziej odporne na takie regresje.
- Zmiana polityki zaokrągleń, kolejności naliczania odsetek lub korekty ostatniej raty jest zmianą kontraktu produktu; wymaga aktualizacji specyfikacji 003, referencji i testów.
- Wspomniana w planie „pojedyncza rata” jest obecnie niewyrażalna przez `termYears`. Nie należy zaniżać jakości testów przez obchodzenie walidacji; zmianę modelu trzeba najpierw zaprojektować.
- Testy finansowe potwierdzają symulację według uzgodnionego algorytmu, nie zgodność z każdym produktem bankowym ani rzeczywistą ofertą.

## Zależności od kolejnych specyfikacji

- Specyfikacja 005 wykorzysta przetestowane `loanInputSchema` i `calculateLoan` w formularzu oraz kartach wyników, bez powielania wzorów w komponentach.
- Specyfikacja 006 wykorzysta przetestowane własności `schedule` do prezentacji dostępnej tabeli harmonogramu.
- Przyszłe rozszerzenia, takie jak raty malejące lub nadpłaty, wymagają osobnych zestawów referencji i własności; nie należy dopasowywać ich do testów rat równych.
