# Specyfikacja 003 — Silnik obliczeń kredytowych

## Status

Zaimplementowano 25.07.2026. Zweryfikowano komendami `build`, `lint`, `format:check` i `test`.

## Cel

Zaimplementować niezależny od Reacta silnik edukacyjnej symulacji kredytu z ratami równymi. Silnik przyjmuje zwalidowany `LoanInput` z etapu 002 i zwraca pełny `LoanCalculationResult`: regularną ratę, sumy kosztów, orientacyjny wskaźnik obciążenia dochodu oraz miesięczny harmonogram.

Wszystkie działania finansowe i zaokrąglenia wykonuje `decimal.js`. Ten etap ustala jeden algorytm oraz jednoznaczną politykę zaokrągleń, aby suma rat, kapitału i odsetek pozostawała spójna także po przeliczeniu na grosze.

## Kontekst produktu

CreditScope działa wyłącznie edukacyjnie i lokalnie w przeglądarce. Wyniki przedstawiają uproszczoną symulację kredytu z ratami równymi — nie są ofertą bankową, rekomendacją finansową ani oceną zdolności kredytowej.

Model i walidacja z etapu 002 zdefiniowały jednostki danych: kwoty w PLN, roczne oprocentowanie nominalne jako wartość procentową, okres w pełnych latach oraz miesięczny harmonogram. Silnik nie parsuje tekstu, nie zbiera danych i nie formatuje ich dla użytkownika.

## Zakres

### W zakresie

- Dodanie `decimal.js` jako zależności produkcyjnej.
- Obliczanie raty równej dla dodatniego oprocentowania i kredytu z oprocentowaniem `0%`.
- Generowanie miesięcznego harmonogramu z numerem raty, ratą, kapitałem, odsetkami i saldem.
- Wyliczanie sumy do spłaty, całkowitego kosztu, sumy odsetek i orientacyjnego wskaźnika obciążenia dochodu.
- Konsekwentna polityka zaokrągleń do dwóch miejsc po przecinku i korekta ostatniej raty.
- Podstawowe testy jednostkowe publicznego kontraktu silnika.

### Poza zakresem

- Formularz, React Hook Form, komponenty wyników, karty, tabela harmonogramu i wykresy.
- Raty malejące, prowizje, ubezpieczenia, marże, RRSO, karencje, wakacje kredytowe i zmienne oprocentowanie.
- Nadpłaty, wcześniejsza spłata, refinansowanie, porównywanie ofert i eksport danych.
- Daty płatności: model wejściowy nie zawiera daty uruchomienia kredytu.
- Zmiana reguł Zod lub klasyfikowanie użytkownika pod względem zdolności kredytowej.
- Sieć, backend, persystencja i `localStorage`.

## Decyzje architektoniczne

| Obszar | Decyzja | Uzasadnienie |
| --- | --- | --- |
| Lokalizacja | Kod znajduje się w `src/lib/finance`. | Logika biznesowa pozostaje niezależna od komponentów i funkcji UI. |
| API | Głównym eksportem jest `calculateLoan(input: LoanInput): LoanCalculationResult`. | Wynik odpowiada typom domenowym już przygotowanym w etapie 002. |
| Precyzja | Obliczenia prowadzi izolowana instancja `Decimal.clone`, nie globalna konfiguracja `Decimal`. | Kod innego modułu nie może przypadkowo zmienić precyzji lub trybu zaokrąglenia silnika. |
| Konwersja | Wejściowe `number` są konwertowane przez ich zapis tekstowy do `Decimal`; publiczny wynik jest zamieniany na `number` dopiero po zaokrągleniu. | Ogranicza to wpływ binarnej reprezentacji `number` na obliczenia. |
| Harmonogram | Każdy wiersz jest księgowany do grosza, a ostatnia rata wyrównuje pozostały kapitał. | Suma części kapitałowych dokładnie pokrywa kwotę kredytu, a saldo końcowe wynosi `0.00`. |
| Walidacja | Silnik zakłada poprawny `LoanInput` z `loanInputSchema`; nie importuje Zod. | Walidacja wejścia jest odpowiedzialnością etapu 002 i przyszłego formularza. |
| Wskaźnik budżetu | Zwracana jest wyłącznie wartość procentowa `debtBurdenRatio`, bez progu, etykiety lub werdyktu. | Wskaźnik ma pozostać orientacyjną informacją edukacyjną. |

## Docelowa struktura po tym etapie

```text
src/
├── features/
│   └── calculator/
│       └── validation/
│           ├── loanInputSchema.ts
│           └── loanInputSchema.test.ts
├── lib/
│   ├── finance/
│   │   ├── loanCalculator.ts
│   │   └── loanCalculator.test.ts
│   └── formatters.ts
└── types/
    └── loan.ts
```

Moduł finansowy może zawierać nieeksportowane funkcje pomocnicze, np. do normalizacji kwot, zaokrąglania i tworzenia pozycji harmonogramu. Nie należy tworzyć komponentów, kontekstów Reacta ani adapterów `localStorage`.

## Kontrakt publiczny

Plik `src/lib/finance/loanCalculator.ts` eksportuje co najmniej:

```ts
import type { LoanCalculationResult, LoanInput } from '../../types/loan';

export function calculateLoan(input: LoanInput): LoanCalculationResult;
```

Funkcja nie mutuje `input`, nie odczytuje bieżącej daty ani nie wykonuje efektów ubocznych. Te same dane wejściowe zawsze zwracają ten sam wynik.

Wynik zachowuje typy z etapu 002:

```ts
interface LoanCalculationResult {
  monthlyInstallment: number;
  totalRepaymentAmount: number;
  totalCreditCost: number;
  totalInterestAmount: number;
  debtBurdenRatio: number;
  schedule: RepaymentScheduleItem[];
}
```

- Wszystkie kwoty w wyniku mają najwyżej dwa miejsca po przecinku.
- `monthlyInstallment` jest regularną ratą miesięczną przed techniczną korektą ostatniej raty.
- `schedule` ma dokładnie `termYears * 12` elementów. `installmentNumber` zaczyna się od `1`.
- `debtBurdenRatio` jest wartością procentową, np. `42.5` oznacza `42,5%`, a nie ułamek `0.425`.
- Wszystkie pola pieniężne i procentowe są zwracane jako skończone `number`. Jeżeli technicznie nie da się przedstawić wyniku jako skończonego `number`, funkcja przerywa działanie błędem zakresu zamiast zwrócić `Infinity` lub `NaN`.

## Konwersja i zaokrąglanie

### Instancja Decimal

Implementacja tworzy prywatną instancję, przykładowo:

```ts
const FinancialDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});
```

Nie wolno wywoływać globalnego `Decimal.set`. Liczby z `LoanInput` przekazuje się do tej instancji jako `value.toString()`.

### Normalizacja wejścia

Przed obliczeniami silnik normalizuje wartości pieniężne `loanAmount`, `monthlyNetIncome` i `monthlyObligations` do dwóch miejsc po przecinku metodą `ROUND_HALF_UP`. Dzięki temu dopuszczona przez etap 002 wartość, np. `1000.005`, staje się wewnętrznie `1000.01 PLN` i nie tworzy ułamków grosza w harmonogramie.

`annualInterestRate` pozostaje wartością dziesiętną bez zaokrąglenia prezentacyjnego. Miesięczna stopa jest obliczana dokładnie jako:

```text
monthlyRate = annualInterestRate / 100 / 12
```

### Zasada zaokrąglania

Każdą kwotę zapisywaną w harmonogramie oraz każdą kwotę zwracaną w `LoanCalculationResult` zaokrągla się do dwóch miejsc metodą „połówka w górę” (`ROUND_HALF_UP`). Wartość wskaźnika `debtBurdenRatio` zaokrągla się tą samą metodą do dwóch miejsc po przecinku, lecz nie dodaje znaku `%`.

`Intl.NumberFormat` z `src/lib/formatters.ts` służy wyłącznie do późniejszej prezentacji gotowych `number`; nie wolno używać go do obliczeń ani do ustalania reguł zaokrągleń.

## Algorytm rat równych

Niech:

- `P` — znormalizowana kwota kredytu,
- `i` — miesięczna stopa procentowa,
- `n` — liczba rat równa `termYears * 12`.

### Regularna rata

Gdy `i > 0`, niezaokrąglona rata równa wynosi:

```text
A = P × (i × (1 + i)^n) / ((1 + i)^n − 1)
```

Gdy `i = 0`, rata wynosi:

```text
A = P / n
```

`monthlyInstallment` jest `A` zaokrąglonym do dwóch miejsc po przecinku. Brak oprocentowania jest poprawnym scenariuszem, a nie błędem ani wyjątkiem.

### Harmonogram

Harmonogram jest generowany od raty `1` do `n` i nie zawiera dat. Dla każdej raty przed ostatnią:

1. `interestAmount = round(balance × i)`.
2. `installmentAmount = monthlyInstallment`.
3. `principalAmount = round(installmentAmount − interestAmount)`.
4. `remainingBalance = round(balance − principalAmount)`.

W ostatniej racie:

1. `interestAmount = round(balance × i)`.
2. `principalAmount = balance`.
3. `installmentAmount = round(principalAmount + interestAmount)`.
4. `remainingBalance = 0.00`.

`round` oznacza zaokrąglenie do dwóch miejsc `ROUND_HALF_UP`. Ostatnia rata może różnić się o kilka groszy od `monthlyInstallment`; jest to wymagana korekta, a nie błąd. Dla `0%` wszystkie `interestAmount` wynoszą `0.00`; ostatnia rata wyrównuje ewentualną różnicę wynikającą z podziału kwoty przez liczbę rat.

Implementacja musi zapewnić, że przed ostatnią ratą saldo nie jest ujemne. W ostatniej pozycji nie wolno używać salda ujemnego ani zwracać wartości `-0`.

## Sumy i wskaźnik obciążenia dochodu

Po utworzeniu harmonogramu:

```text
totalRepaymentAmount = suma schedule.installmentAmount
totalInterestAmount = suma schedule.interestAmount
totalCreditCost = totalRepaymentAmount − loanAmount
debtBurdenRatio = ((monthlyInstallment + monthlyObligations) / monthlyNetIncome) × 100
```

Wszystkie powyższe wartości są zaokrąglone zgodnie z polityką tego etapu. `totalCreditCost` musi być równy `totalInterestAmount` dla zakresu obecnego MVP, ponieważ nie uwzględniamy prowizji ani dodatkowych opłat.

Wskaźnik korzysta z regularnej raty `monthlyInstallment`, a nie z technicznie skorygowanej ostatniej raty. Nie jest ograniczany do `100%`: wartość ponad `100%` jest poprawną informacją arytmetyczną i nie stanowi decyzji finansowej.

## Wymagania funkcjonalne

1. `calculateLoan` przyjmuje zwalidowany `LoanInput` i zwraca kompletny `LoanCalculationResult`.
2. Silnik obsługuje raty równe dla dodatniego oprocentowania oraz dla `0%`.
3. Liczba pozycji harmonogramu odpowiada liczbie miesięcy spłaty, a numery rat są kolejne od `1`.
4. Każda pozycja harmonogramu zawiera ratę, część kapitałową, odsetkową i saldo w PLN z dokładnością do grosza.
5. Suma kapitału z harmonogramu równa się znormalizowanej kwocie kredytu, a saldo ostatniej raty wynosi dokładnie `0`.
6. Suma rat, koszt i suma odsetek są obliczane z harmonogramu, nie z niezależnie zaokrąglonych wzorów.
7. Wskaźnik obciążenia dochodu używa wzoru z planu projektu i ma charakter wyłącznie informacyjny.
8. Silnik nie zmienia UI z etapu 001, nie wywołuje Zod ani nie wykonuje żądań sieciowych.

## Wymagania jakościowe

- Cała arytmetyka finansowa po wejściu do silnika używa `decimal.js`; JavaScriptowe operatory liczbowe nie służą do liczenia pieniędzy, stóp, salda ani sum.
- Kod jest czysty, deterministyczny, bez Reacta, DOM, daty systemowej i efektów ubocznych.
- Publiczne API nie zwraca instancji `Decimal` ani tekstów sformatowanych do wyświetlenia.
- TypeScript działa w trybie ścisłym, bez `any` i bez ukrywania błędów typów.
- Identyfikatory techniczne są po angielsku, a komentarze, opisy testów i komunikaty błędów po polsku.
- Silnik nie zawiera progów oceny klienta ani słów sugerujących udzielenie, odmowę lub dostępność kredytu.

## Testy

Podstawowe testy publicznego kontraktu silnika znajdują się w `src/lib/finance/loanCalculator.test.ts` i uruchamiają się przez `npm run test`. Etap 004 rozszerzy je o niezależne wartości referencyjne i pełną matrycę przypadków finansowych.

Etap 003 obejmuje co najmniej:

- typowy kredyt z dodatnim oprocentowaniem i harmonogramem o prawidłowej długości;
- kredyt z `0%`, którego odsetki i koszt wynoszą `0`;
- pojedynczy rok kredytu, aby potwierdzić `12` rat i kolejne numery;
- zgodność sum: suma kapitału z kwotą kredytu, suma odsetek z kosztem oraz ostatnie saldo `0`;
- wartość wskaźnika obciążenia dochodu obliczoną z regularnej raty i zobowiązań;
- wartości wejściowe z ułamkiem grosza, które normalizują się metodą `ROUND_HALF_UP`;
- brak mutacji obiektu wejściowego.

Testy etapu 003 nie używają React Testing Library ani UI. Nie zastępują testów walidacji z etapu 002.

## Kryteria akceptacji

Etap jest ukończony, gdy:

- [x] `decimal.js` jest zależnością produkcyjną, a kod finansowy korzysta z prywatnej instancji `Decimal.clone`.
- [x] `calculateLoan` przyjmuje `LoanInput` i zwraca pełny `LoanCalculationResult` bez zależności od Reacta, Zod lub DOM.
- [x] Rata równa jest poprawnie obliczana dla oprocentowania dodatniego oraz `0%`.
- [x] Harmonogram ma `termYears * 12` pozycji, kolejne numery rat i saldo końcowe `0`.
- [x] Wszystkie kwoty są księgowane do grosza metodą `ROUND_HALF_UP`, a ostatnia rata wyrównuje saldo.
- [x] Suma kapitału jest równa kwocie kredytu, a całkowity koszt jest równy sumie odsetek w obecnym zakresie MVP.
- [x] `debtBurdenRatio` korzysta z `(rata + zobowiązania) / dochód × 100` i nie jest przekształcany w ocenę zdolności kredytowej.
- [x] Istnieją podstawowe testy jednostkowe harmonogramu, `0%`, sum i zaokrągleń; pełne scenariusze referencyjne pozostają w etapie 004.
- [x] Ekran startowy nadal nie zawiera formularza, wyników ani tabeli harmonogramu.
- [x] `npm run build`, `npm run lint`, `npm run format:check` i `npm run test` kończą się powodzeniem.

## Plan implementacji

1. Dodać `decimal.js` jako zależność produkcyjną.
2. Utworzyć `src/lib/finance/loanCalculator.ts`, skonfigurować prywatną instancję `Decimal.clone` i funkcje do normalizacji wartości pieniężnych.
3. Zaimplementować wyliczenie miesięcznej stopy, regularnej raty i osobną ścieżkę dla `0%`.
4. Wygenerować harmonogram zgodnie z regułą księgowania do grosza oraz korektą ostatniej raty.
5. Wyprowadzić sumy i orientacyjny wskaźnik obciążenia dochodu wyłącznie z ustalonych danych.
6. Dodać podstawowe testy jednostkowe kontraktu silnika bez UI.
7. Uruchomić pełny zestaw kontroli jakości z kryteriów akceptacji.

## Ryzyka i zasady na kolejne etapy

- Raty i harmonogram są uproszczoną symulacją. Banki mogą stosować inne konwencje dni, dodatkowe opłaty, inny moment naliczania odsetek lub odmienną politykę zaokrągleń.
- Polityka `ROUND_HALF_UP` i korekta ostatniej raty są częścią kontraktu produktu. Nie należy ich zmieniać bez aktualizacji testów referencyjnych i dokumentacji.
- Raty malejące, nadpłaty i zmienna stopa wymagają osobnych algorytmów; nie należy ukrywać ich jako warunków w obecnym kalkulatorze rat równych.
- Jeżeli przyszłe wymagania dodadzą daty, harmonogram musi otrzymać nowy parametr domenowy oraz jasno opisaną konwencję kalendarzową.
- Skrajne, ale formalnie poprawne wartości `number` mogą dać wynik niewyrażalny jako `number`. Silnik ma wtedy zgłosić błąd technicznego zakresu, a przyszły UI przedstawi go neutralnie, bez interpretacji finansowej.

## Zależności od kolejnych specyfikacji

- Specyfikacja 004 rozbuduje testy o wartości referencyjne, skrajne scenariusze i własności harmonogramu; nie zmieni uzgodnionej tu polityki obliczeń i zaokrągleń.
- Specyfikacja 005 połączy `loanInputSchema` oraz `calculateLoan` z formularzem i kartami wyników, korzystając z `formatCurrencyPLN` i `formatPercentagePL` do prezentacji.
- Specyfikacja 006 wyświetli zwrócony już harmonogram w dostępnej, przewijalnej na małych ekranach tabeli.
