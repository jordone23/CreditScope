# Specyfikacja 002 — Model danych i walidacja

## Status

Zaimplementowano 24.07.2026. Zweryfikowano komendami `build`, `lint`, `format:check` i `test`.

## Cel

Zdefiniować jednoznaczny, niezależny od widoku kontrakt danych wejściowych symulacji kredytu oraz danych, które będą zwracane przez przyszły silnik obliczeń. Dodać walidację Zod dla danych wejściowych, aby formularz z etapu 005 i logika z etapu 003 korzystały z tych samych reguł, jednostek i komunikatów.

Etap nie tworzy jeszcze interfejsu formularza, nie wylicza rat ani nie generuje harmonogramu. Jego wynikiem są typy domenowe, schemat walidacji i testy tych kontraktów.

## Kontekst produktu

CreditScope jest edukacyjnym kalkulatorem kredytowym działającym lokalnie w przeglądarce. Użytkownik poda kwotę kredytu, roczne oprocentowanie nominalne, okres spłaty, miesięczny dochód netto i miesięczne zobowiązania. Na tej podstawie późniejsze etapy pokażą raty równe i orientacyjny wskaźnik obciążenia budżetu.

Walidacja ma wyłącznie stwierdzać, czy dane nadają się do symulacji. Nie może oceniać zdolności kredytowej, sugerować dostępności kredytu ani klasyfikować użytkownika.

## Zakres

### W zakresie

- Typ `LoanInput` opisujący komplet zwalidowanych danych wejściowych symulacji.
- Typy przyszłego wyniku obliczeń i pojedynczej pozycji harmonogramu, bez implementowania samych obliczeń.
- Jedno źródło schematu Zod `loanInputSchema` dla reguł walidacji danych wejściowych.
- Polskie komunikaty walidacyjne przydatne w przyszłym formularzu.
- Testy jednostkowe typowych, granicznych i błędnych danych.
- Dokumentacja jednostek, semantyki wartości `0` i granicy między danymi formularza a modelem domenowym.

### Poza zakresem

- React Hook Form, komponenty formularza, pola `<input>`, przycisk obliczenia i prezentacja błędów w UI.
- `decimal.js`, wzory rat, zaokrąglenia finansowe, harmonogram i wskaźnik obciążenia dochodu.
- Zapisywanie danych w `localStorage`, eksport, backend i wysyłanie danych po sieci.
- Weryfikowanie historii kredytowej, źródeł dochodu, wieku użytkownika lub jakiekolwiek decyzje kredytowe.

## Decyzje architektoniczne

| Obszar | Decyzja | Uzasadnienie |
| --- | --- | --- |
| Model domenowy | Zwalidowane dane wejściowe opisuje `LoanInput` w `src/types/loan.ts`. | Model jest dostępny dla UI, walidacji i przyszłej logiki, bez zależności od Reacta. |
| Walidacja | `loanInputSchema` znajduje się w `src/features/calculator/validation/loanInputSchema.ts`. | Reguły dotyczą funkcji kalkulatora, a nie globalnych komponentów lub silnika finansowego. |
| Źródło prawdy | Typ danych wejściowych jest wyprowadzany ze schematu Zod albo jest z nim sprawdzany statycznie. | Zapobiega rozchodzeniu się typów TypeScript i walidacji uruchamianej w przeglądarce. |
| Dane formularza | Schemat przyjmuje wartości typu `number`, nie konwertuje niejawnie tekstu na liczbę. | Pusty tekst nie może przypadkowo stać się zerem; przyszły adapter formularza jawnie przekaże liczbę lub błąd. |
| Precyzja | Etap 002 używa `number` wyłącznie jako granicy wejścia i kontraktu typów. | Etap 003 niezwłocznie przekaże poprawne wartości do `decimal.js` przed wykonaniem obliczeń. |
| Komunikaty | Komunikaty dla użytkownika są po polsku i opisują wymaganie, nie ocenę finansową. | Pozostają zrozumiałe i zachowują edukacyjny charakter produktu. |

## Docelowa struktura po tym etapie

```text
src/
├── app/
│   ├── App.tsx
│   └── styles.css
├── components/
│   └── layout/
│       ├── AppShell.tsx
│       ├── Header.tsx
│       └── EducationalDisclaimer.tsx
├── features/
│   └── calculator/
│       └── validation/
│           ├── loanInputSchema.ts
│           └── loanInputSchema.test.ts
├── lib/
│   ├── finance/                 # nadal zarezerwowane na etap 003
│   └── formatters.ts
├── types/
│   └── loan.ts
├── test/
│   └── setup.ts
└── main.tsx
```

Katalog `src/lib/finance` pozostaje pusty do rozpoczęcia etapu 003. Nie należy tworzyć atrap obliczeń ani komponentów formularza tylko po to, aby wypełnić strukturę.

## Kontrakt danych domenowych

W `src/types/loan.ts` mają znaleźć się co najmniej poniższe eksporty. Nazwy identyfikatorów pozostają angielskie, a komentarze wyjaśniające jednostki — po polsku.

```ts
export interface LoanInput {
  /** Kwota kredytu w PLN; musi być większa od zera. */
  loanAmount: number;
  /** Nominalne oprocentowanie roczne w procentach, np. 7.5 oznacza 7,5%. */
  annualInterestRate: number;
  /** Okres spłaty w pełnych latach. */
  termYears: number;
  /** Miesięczny dochód netto w PLN; musi być większy od zera. */
  monthlyNetIncome: number;
  /** Łączna kwota istniejących miesięcznych zobowiązań w PLN. */
  monthlyObligations: number;
}

export interface RepaymentScheduleItem {
  /** Kolejny miesiąc spłaty, numerowany od 1. */
  installmentNumber: number;
  /** Łączna rata w PLN. */
  installmentAmount: number;
  /** Kapitałowa część raty w PLN. */
  principalAmount: number;
  /** Odsetkowa część raty w PLN. */
  interestAmount: number;
  /** Saldo pozostałe po opłaceniu raty, w PLN. */
  remainingBalance: number;
}

export interface LoanCalculationResult {
  monthlyInstallment: number;
  totalRepaymentAmount: number;
  totalCreditCost: number;
  totalInterestAmount: number;
  /** Wartość procentowa, np. 42.5 oznacza 42,5%. */
  debtBurdenRatio: number;
  schedule: RepaymentScheduleItem[];
}
```

`RepaymentScheduleItem` nie zawiera daty płatności: etap 002 nie zbiera daty uruchomienia kredytu. W etapie 003 harmonogram jest miesięczny i korzysta z `installmentNumber`; data może zostać dodana w przyszłości wraz z osobnym, wymaganym polem wejściowym.

## Jednostki i niezmienniki

| Pole | Jednostka i przykład | Reguła |
| --- | --- | --- |
| `loanAmount` | PLN, np. `250000.5` | Skończona liczba większa od `0`; części groszowe są dopuszczalne. |
| `annualInterestRate` | procent w skali roku, np. `7.5` | Skończona liczba nie mniejsza od `0`; `7.5` nie oznacza ułamka `0.075`. |
| `termYears` | pełne lata, np. `25` | Skończona dodatnia liczba całkowita. Miesiące oblicza etap 003 jako `termYears * 12`. |
| `monthlyNetIncome` | PLN miesięcznie, np. `8000` | Skończona liczba większa od `0`; części groszowe są dopuszczalne. |
| `monthlyObligations` | PLN miesięcznie, np. `1250.75` | Skończona liczba nie mniejsza od `0`; `0` oznacza brak takich zobowiązań. |
| `debtBurdenRatio` | procent, np. `42.5` | Wynik przyszłego silnika; formatter otrzymuje wartość procentową, nie ułamek. |

Nie należy stosować mnożników prezentacyjnych ani formatować wartości w modelu. Teksty takie jak `250 000 zł`, `7,5%` i `25 lat` powstają dopiero na granicy UI przy użyciu formatterów z etapu 001 albo dedykowanego formatowania tekstu pola.

## Kontrakt walidacji

Moduł `src/features/calculator/validation/loanInputSchema.ts` eksportuje co najmniej:

```ts
export const loanInputSchema: z.ZodType<LoanInput>;
export type ValidatedLoanInput = z.infer<typeof loanInputSchema>;
```

Schemat waliduje cały obiekt i zwraca dane zgodne z `LoanInput`. Jeśli implementacja eksportuje typ `LoanInput` bezpośrednio ze schematu, nie należy tworzyć drugiej, niezależnej definicji o tych samych polach.

### Reguły pól

| Pole | Akceptowane wartości | Komunikat przy błędzie |
| --- | --- | --- |
| `loanAmount` | Skończona liczba `> 0` | „Podaj kwotę kredytu większą od 0 zł.” |
| `annualInterestRate` | Skończona liczba `>= 0` | „Podaj oprocentowanie równe lub większe od 0%.” |
| `termYears` | Skończona dodatnia liczba całkowita | „Podaj okres spłaty w pełnych latach, większy od 0.” |
| `monthlyNetIncome` | Skończona liczba `> 0` | „Podaj miesięczny dochód netto większy od 0 zł.” |
| `monthlyObligations` | Skończona liczba `>= 0` | „Podaj miesięczne zobowiązania równe lub większe od 0 zł.” |

Schemat odrzuca również brak pola, `NaN`, `Infinity`, `-Infinity`, tekst, `null` i `undefined`. Nie wprowadza arbitralnych limitów maksymalnej kwoty, dochodu, oprocentowania ani okresu — ich ustalenie wymagałoby osobnej reguły produktu, której obecnie nie ma.

### Granica formularza

W etapie 005 elementy formularza przekażą do schematu wartości liczbowe. Puste pole, tekst niebędący liczbą oraz separator dziesiętny użyty w nieobsługiwanym formacie są błędami warstwy wejścia i nie mogą zostać niejawnie zamienione na `0`.

Jeśli formularz będzie wymagał obsługi polskiego zapisu `7,5`, adapter interfejsu może jawnie przekształcić ten zapis na `7.5` przed walidacją. Ta konwersja nie należy do `LoanInput` ani do przyszłego silnika finansowego i musi mieć własne testy komponentowe.

## Wymagania funkcjonalne

1. Kod z etapu 002 eksportuje `LoanInput`, `RepaymentScheduleItem`, `LoanCalculationResult` i `loanInputSchema` z lokalizacji opisanych w tej specyfikacji.
2. Poprawne dane z oprocentowaniem `0` i zobowiązaniami `0` przechodzą walidację.
3. Kwota kredytu i dochód netto równe `0` nie przechodzą walidacji.
4. Okres spłaty musi być dodatni i całkowity; `0`, wartości ujemne i `1.5` są odrzucane.
5. Kwoty oraz oprocentowanie mogą mieć część dziesiętną.
6. Walidacja nie wykonuje obliczeń, nie zaokrągla kwot ani nie formatuje tekstu dla użytkownika.
7. Ekran startowy z etapu 001 pozostaje bez formularza i bez wyników.

## Wymagania jakościowe

- TypeScript działa w trybie ścisłym, bez `any` i bez tłumienia błędów typów.
- Reguły walidacji są możliwe do uruchomienia bez Reacta i bez DOM.
- Wszystkie komunikaty dla użytkownika, komentarze dokumentujące jednostki i opisy testów są po polsku.
- Publiczny model nie importuje Reacta, Zod ani modułów UI.
- Kod nie wykonuje żądań sieciowych, nie odczytuje i nie zapisuje `localStorage`.
- Dane wejściowe pozostają zwykłymi liczbami aż do granicy silnika finansowego z etapu 003; nie dodaje się jeszcze `decimal.js`.

## Testy

Testy schematu znajdują się obok niego w `src/features/calculator/validation/loanInputSchema.test.ts` i uruchamiają się przez istniejące `npm run test`.

Co najmniej następujące scenariusze muszą być objęte testami:

- poprawny, typowy zestaw danych;
- oprocentowanie `0` i zobowiązania `0` jako poprawne wartości graniczne;
- dodatnie kwoty z częścią dziesiętną oraz oprocentowanie `7.5`;
- zerowa i ujemna kwota kredytu;
- ujemne oprocentowanie oraz ujemne zobowiązania;
- zerowy i ujemny dochód;
- zerowy, ujemny i niecałkowity okres;
- brakujące pole oraz wartości `NaN` i nieskończone;
- obecność polskiego komunikatu dla co najmniej jednego błędu każdego pola.

Testy nie powinny zależeć od dokładnej wewnętrznej reprezentacji błędów Zod poza publicznym wynikiem `safeParse` i treścią komunikatu. Nie tworzy się jeszcze testów obliczeń; należą do etapów 003 i 004.

## Kryteria akceptacji

Etap jest ukończony, gdy:

- [x] `src/types/loan.ts` zawiera komplet typów wejścia, wyniku i pozycji harmonogramu wraz z udokumentowanymi jednostkami.
- [x] `loanInputSchema` jest jedynym źródłem reguł walidacji danych wejściowych i jest niezależny od Reacta.
- [x] Schemat akceptuje `0%` oprocentowania oraz `0 zł` zobowiązań, a odrzuca niepoprawne wartości opisane w tabeli.
- [x] Wartości dziesiętne kwot i procentów są akceptowane, a okres spłaty pozostaje liczbą całkowitą w latach.
- [x] Walidacja zwraca polskie, zrozumiałe komunikaty bez języka oceniającego zdolność kredytową.
- [x] Istnieją testy jednostkowe poprawnych, granicznych i błędnych danych, w tym `NaN` oraz wartości nieskończonych.
- [x] `npm run build`, `npm run lint`, `npm run format:check` i `npm run test` kończą się powodzeniem.
- [x] Ekran startowy z etapu 001 nie zawiera jeszcze formularza, wyników ani kodu obliczeniowego.
- [x] Projekt nadal nie wykonuje żądań sieciowych i nie przechowuje danych użytkownika.

## Plan implementacji

1. Dodać `zod` jako zależność produkcyjną, bez dodawania React Hook Form przed etapem 005.
2. Utworzyć `src/types/loan.ts` i zapisać kontrakt typów wraz z komentarzami o jednostkach.
3. Utworzyć `loanInputSchema` w funkcji `calculator`; powiązać jego typ z `LoanInput`.
4. Dodać testy `safeParse` dla scenariuszy z tej specyfikacji i polskich komunikatów.
5. Nie zmieniać ekranu startowego poza ewentualnymi importami, które są konieczne dla kontroli typów — model nie jest jeszcze prezentowany.
6. Uruchomić pełny zestaw kontroli jakości z kryteriów akceptacji.

## Ryzyka i zasady na kolejne etapy

- Zod potwierdza poprawność danych wejściowych, ale nie zastępuje precyzyjnej arytmetyki. Od etapu 003 wszystkie obliczenia pieniężne wykonuje `decimal.js`.
- `number` przyjmuje zapis binarny liczb dziesiętnych. To nie stanowi problemu dla walidacji znaku, całkowitości i skończoności, lecz nie może być podstawą zaokrągleń finansowych.
- Wskaźnik `debtBurdenRatio` jest wyłącznie informacją orientacyjną. Typ wyniku nie może zostać rozszerzony o status typu „zdolny” lub „niezdolny”.
- Dodanie daty pierwszej raty wymaga osobnego pola wejściowego, walidacji i decyzji o zasadach kalendarzowych; nie należy jej domyślać w harmonogramie.
- Granice maksymalnych wartości biznesowych mogą zostać dodane wyłącznie po opisaniu uzasadnionej reguły produktu oraz jej testów.

## Zależności od kolejnych specyfikacji

- Specyfikacja 003 wykorzysta `LoanInput`, przekonwertuje wartości do `decimal.js` i wypełni `LoanCalculationResult` oraz `RepaymentScheduleItem`.
- Specyfikacja 004 rozszerzy testy o wzory finansowe, zaokrąglenia i własności harmonogramu; utrzyma testy walidacji z tego etapu.
- Specyfikacja 005 połączy `loanInputSchema` z React Hook Form, doda dostępne pola i wyświetli błędy walidacji bez duplikowania reguł.
