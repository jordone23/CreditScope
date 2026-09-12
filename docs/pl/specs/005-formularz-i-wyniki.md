# Specyfikacja 005 — Formularz i wyniki symulacji

## Status

Zaimplementowano 25.07.2026. Zweryfikowano komendami `build`, `lint`, `format:check` i `test`.

## Cel

Zastąpić ekran „Kalkulator jest w przygotowaniu” dostępnym formularzem symulacji kredytu oraz czytelnym podsumowaniem wyników. Formularz wykorzystuje istniejącą walidację z etapu 002, a po poprawnym przesłaniu wywołuje przetestowany silnik `calculateLoan` z etapu 003.

Etap udostępnia użytkownikowi ratę równą, sumy kosztów i orientacyjny wskaźnik obciążenia dochodu. Nie wyświetla jeszcze tabeli harmonogramu — będzie ona osobnym, responsywnym widokiem w etapie 006.

## Kontekst produktu

CreditScope jest lokalnym, edukacyjnym kalkulatorem kredytowym. Użytkownik podaje dane do symulacji, a aplikacja pokazuje wynik bez wysyłania danych po sieci, bez zapisywania historii i bez podejmowania decyzji kredytowych.

Walidacja (`loanInputSchema`), typy (`LoanInput`, `LoanCalculationResult`) i obliczenia (`calculateLoan`) są już gotowe oraz objęte testami. UI tego etapu jest wyłącznie adapterem tych kontraktów: nie zawiera wzorów finansowych, własnych formatterów `Intl` ani alternatywnych reguł walidacji.

## Zakres

### W zakresie

- React Hook Form do zarządzania stanem i walidacją formularza.
- Pięć pól danych z `LoanInput` wraz z etykietami, jednostkami, podpowiedziami i komunikatami błędów.
- Adapter tekstu formularza do liczb, obsługujący polski separator dziesiętny `,`.
- Użycie istniejącego `loanInputSchema` jako jedynego źródła reguł walidacji.
- Wywołanie `calculateLoan` tylko dla poprawnych danych.
- Karty wyników: rata, suma do spłaty, całkowity koszt, odsetki i wskaźnik obciążenia dochodu.
- Wyłącznie istniejące `formatCurrencyPLN` i `formatPercentagePL` do prezentacji wyników.
- Dostępny, responsywny widok oraz testy komponentowe kluczowych zachowań.

### Poza zakresem

- Tabela i wizualizacja `schedule`; etap 006 wykorzysta już zwrócony harmonogram.
- Raty malejące, nadpłaty, prowizje, RRSO, zmienna stopa i porównywanie wariantów.
- Zapisywanie formularza, wyników lub historii w `localStorage`, pliku, bazie danych albo API.
- Backend, konta, analityka, reklamy i integracje bankowe.
- Rekomendacja finansowa, kwalifikowanie użytkownika, próg „bezpiecznego” wskaźnika lub decyzja o kredycie.

## Decyzje architektoniczne

| Obszar | Decyzja | Uzasadnienie |
| --- | --- | --- |
| Stan formularza | `react-hook-form` obsługuje pola, dotknięcie, błędy i przesłanie formularza. | Upraszcza dostępny formularz bez mieszania stanu pól z obliczeniami. |
| Dane surowe | Formularz przechowuje tekstowe `LoanFormValues`; adapter tworzy `LoanInput`. | Użytkownik może wpisywać `7,5`, a puste pole nie jest mylone z `0`. |
| Separator dziesiętny | Adapter akceptuje pojedynczy `,` lub `.` jako separator i przekazuje skończony `number`. | Interfejs jest naturalny dla `pl-PL`, przy zachowaniu liczbowego kontraktu Zod. |
| Walidacja | Własny resolver formularza najpierw adaptuje tekst, a następnie wywołuje `loanInputSchema.safeParse`. | Reguły wartości, komunikaty i typy nadal mają jedno źródło prawdy. |
| Wynik | Poprawne przesłanie wywołuje `calculateLoan` i zapisuje `LoanCalculationResult` wyłącznie w stanie komponentu. | Wyniki są aktualne, lokalne i nie wymagają persystencji. |
| Formatowanie | Komponent wyników wywołuje tylko `formatCurrencyPLN` oraz `formatPercentagePL`. | Prezentacja pozostaje spójna z etapem 001. |
| Dostępność | Natywny `<form>`, `<label>`, `<button>` i opisane błędy; po przesłaniu fokus przechodzi do wyników lub pierwszego błędnego pola. | Formularz jest dostępny z klawiatury i dla czytników ekranu. |

## Zależności

Etap dodaje jako zależności produkcyjne:

```text
react-hook-form
```

`zod`, `decimal.js`, React i React Testing Library są już obecne. Jeśli do realistycznych testów interakcji nie ma jeszcze dostępnego `@testing-library/user-event`, należy dodać go jako zależność deweloperską. Nie dodaje się drugiego pakietu walidacyjnego ani biblioteki formularzy.

## Docelowa struktura po tym etapie

```text
src/
├── app/
│   ├── App.tsx
│   ├── App.test.tsx
│   └── styles.css
├── components/
│   └── layout/
│       ├── AppShell.tsx
│       ├── EducationalDisclaimer.tsx
│       └── Header.tsx
├── features/
│   └── calculator/
│       ├── components/
│       │   ├── CalculationResults.tsx
│       │   ├── LoanCalculator.tsx
│       │   └── LoanForm.tsx
│       ├── loanFormResolver.ts
│       ├── loanFormResolver.test.ts
│       ├── LoanCalculator.test.tsx
│       └── validation/
│           ├── loanInputSchema.ts
│           └── loanInputSchema.test.ts
├── lib/
│   ├── finance/
│   │   └── loanCalculator.ts
│   └── formatters.ts
└── types/
    └── loan.ts
```

Nazwy komponentów mogą zostać scalone, jeżeli pozostanie czytelny podział odpowiedzialności: adapter formularza, uruchamianie obliczeń i prezentacja wyników nie mogą dublować logiki finansowej. `App.tsx` składa layout z jednym komponentem funkcji `LoanCalculator`.

## Dane formularza i adapter

### Surowe wartości

UI używa lokalnego typu odpowiadającego pięciu polom, lecz zapisującego je jako tekst:

```ts
interface LoanFormValues {
  loanAmount: string;
  annualInterestRate: string;
  termYears: string;
  monthlyNetIncome: string;
  monthlyObligations: string;
}
```

Domyślne wartości są puste. Aplikacja nie pokazuje przykładowych liczb, pozornie działających wyników ani automatycznie obliczonej symulacji przed przesłaniem formularza.

### Normalizacja liczby

Adapter każdej wartości:

1. usuwa białe znaki z początku i końca;
2. akceptuje liczby zapisane z jednym separatorem dziesiętnym `,` albo `.`;
3. zamienia pojedynczy przecinek na kropkę;
4. odrzuca pusty tekst, wielokrotne separatory, separatory tysięcy, tekst i wartości nieskończone;
5. zwraca `NaN` dla niepoprawnego tekstu, aby istniejący `loanInputSchema` zwrócił właściwy polski komunikat pola.

Przykłady: `"7,5"` i `"7.5"` przekazują `7.5`; `" 1200,50 "` przekazuje `1200.5`; `"1 200"`, `"1,2,3"` i pusty tekst są niepoprawne. Adapter nie zaokrągla wartości i nie wykonuje obliczeń finansowych.

### Resolver

Resolver React Hook Form:

1. konwertuje `LoanFormValues` do obiektu o kluczach `LoanInput`;
2. wywołuje `loanInputSchema.safeParse`;
3. przy sukcesie zwraca znormalizowany `LoanInput` jako dane przesłania;
4. przy błędzie mapuje `issues` Zod na błędy odpowiednich pól z polskim `message`;
5. nie dodaje własnych reguł znaku, zakresów, całkowitości ani komunikatów biznesowych.

Typy formularza muszą pozostać ścisłe. Dozwolone jest użycie trzeciego parametru `useForm<LoanFormValues, undefined, LoanInput>`, aby rozdzielić surowe wartości pól od zwalidowanych danych przekazanych do `onSubmit`.

## Formularz

Formularz jest oznaczony semantycznym `<form>` i ma nagłówek „Dane do symulacji”. Pola są natywnymi kontrolkami tekstowymi z odpowiednim `inputMode`; nie używa się zastępczych elementów z rolami formularza.

| Pole i klucz | Etykieta | Pomoc i kontrolka |
| --- | --- | --- |
| `loanAmount` | Kwota kredytu | `PLN`; `inputMode="decimal"`; podpowiedź „Np. 250000 lub 250000,50”. |
| `annualInterestRate` | Oprocentowanie nominalne w skali roku | `%`; `inputMode="decimal"`; `0` jest dozwolone. |
| `termYears` | Okres spłaty | `lat`; `inputMode="numeric"`; pełne lata. |
| `monthlyNetIncome` | Miesięczny dochód netto | `PLN`; `inputMode="decimal"`. |
| `monthlyObligations` | Miesięczne zobowiązania | `PLN`; `inputMode="decimal"`; `0` oznacza brak zobowiązań. |

Przycisk przesłania ma tekst „Oblicz symulację”. Walidacja działa przy zmianie pola oraz przy przesłaniu. Błąd jest widoczny bezpośrednio pod właściwym polem; kontrolka ma `aria-invalid="true"` i `aria-describedby` wskazujące podpowiedź oraz błąd, gdy istnieje.

Po niepoprawnym przesłaniu fokus trafia do pierwszego pola z błędem. Po poprawnym przesłaniu wynik jest obliczany synchronicznie, sekcja wyników dostaje fokus przez element nagłówka z `tabIndex={-1}`, a jej zawartość jest komunikowana w `aria-live="polite"`.

Jeśli użytkownik zmieni dowolne pole po poprawnym obliczeniu, poprzedni wynik zostaje ukryty do kolejnego poprawnego przesłania. Dzięki temu UI nie pokazuje wyniku niezgodnego z aktualnie widocznymi danymi.

## Wyniki

Po poprawnym przesłaniu pojawia się sekcja `aria-labelledby="results-heading"` z nagłówkiem „Wynik symulacji”. Wynik jest prezentowany jako semantyczna lista definicji lub lista kart — nazwa miary i wartość muszą pozostawać jednoznacznie powiązane dla czytników ekranu.

Wyświetlane są dokładnie:

| Wartość z `LoanCalculationResult` | Etykieta w UI | Format |
| --- | --- | --- |
| `monthlyInstallment` | Miesięczna rata | `formatCurrencyPLN` |
| `totalRepaymentAmount` | Suma do spłaty | `formatCurrencyPLN` |
| `totalCreditCost` | Całkowity koszt kredytu | `formatCurrencyPLN` |
| `totalInterestAmount` | Suma odsetek | `formatCurrencyPLN` |
| `debtBurdenRatio` | Orientacyjny wskaźnik obciążenia dochodu | `formatPercentagePL` |

Pod kartami wyniku widnieje neutralna informacja:

> Wskaźnik pokazuje udział raty i podanych zobowiązań w miesięcznym dochodzie netto. To wyłącznie informacja edukacyjna — nie stanowi oceny zdolności kredytowej ani rekomendacji finansowej.

Sekcja zawiera również krótką zapowiedź: „Szczegółowy harmonogram spłat zostanie udostępniony w kolejnym etapie.” Nie dodaje się jeszcze tabeli, przycisku rozwijania ani fałszywego podglądu rat.

## Układ, responsywność i dostępność

- Przy szerokości 320 px formularz i karty wyników są jednokolumnowe, z widocznymi etykietami i bez poziomego przewijania.
- Od szerokości tabletowej pola formularza i karty mogą układać się w dwie kolumny; treść pozostaje w istniejącym `content-container`.
- Każde pole ma widoczny fokus zgodny z globalnym stylem, minimalnie wystarczający obszar interakcji i kontrast WCAG AA.
- Kolor nie jest jedynym nośnikiem błędu: komunikat tekstowy i `aria-invalid` są obowiązkowe.
- Komunikat edukacyjny stopki z etapu 001 pozostaje stale widoczny, niezależnie od stanu formularza i wyników.
- Nie używa się dynamicznego `Intl.NumberFormat` w komponentach ani tekstów odnoszących się do „akceptacji”, „odmowy” lub „zdolności”.

## Wymagania funkcjonalne

1. Ekran startowy pokazuje gotowy formularz zamiast komunikatu o przygotowaniu kalkulatora.
2. Poprawne dane po przesłaniu są walidowane przez `loanInputSchema`, a następnie przekazywane do `calculateLoan`.
3. Niepoprawne dane nie uruchamiają obliczeń i pokazują polskie błędy przypisane do pól.
4. `0%` oprocentowania i `0` zobowiązań są poprawne w UI.
5. Użytkownik może wpisać wartość dziesiętną z przecinkiem lub kropką.
6. Wynik pokazuje pięć miar opisanych w tabeli, zawsze z centralnych formatterów.
7. Zmiana danych po obliczeniu ukrywa nieaktualny wynik do następnego prawidłowego przesłania.
8. Aplikacja nie zapisuje danych, nie komunikuje się z siecią i nie wyświetla harmonogramu jako tabeli.

## Testy

Testy komponentów używają React Testing Library, `@testing-library/user-event` oraz publicznego zachowania komponentów. Nie testują prywatnego stanu React Hook Form ani implementacyjnych szczegółów resolvera.

Co najmniej następujące scenariusze muszą być objęte testami:

- początkowy widok pokazuje wszystkie etykiety pól i przycisk, a nie pokazuje kart wyników;
- próba przesłania pustego formularza pokazuje polskie błędy, ustawia `aria-invalid` i nie pokazuje wyników;
- poprawne przesłanie typowych danych pokazuje pięć formatowanych wyników oraz edukacyjny opis wskaźnika;
- `0%` oprocentowania i `0` zobowiązań przechodzą przez formularz i zwracają brak odsetek;
- wpisanie `7,5` jest przekazywane jako `7.5`, bez duplikowania reguł Zod;
- zmiana pola po poprawnym obliczeniu ukrywa poprzedni wynik;
- po błędnym przesłaniu fokus trafia do pierwszego błędnego pola, a po sukcesie do nagłówka wyników;
- test jednostkowy adaptera sprawdza przecinek, kropkę, pustą wartość oraz nieprawidłowy zapis tekstowy.

Testy z etapów 001–004 pozostają bez zmian i nadal przechodzą. Testy etapu 005 nie powinny powielać scenariuszy numerycznych silnika z etapu 004.

## Kryteria akceptacji

Etap jest ukończony, gdy:

- [x] `react-hook-form` jest dodany jako zależność produkcyjna, a dane formularza nie są przechowywane globalnie ani trwale.
- [x] Formularz zawiera pięć poprawnie opisanych, dostępnych pól i natywny przycisk przesłania.
- [x] Tekstowy adapter obsługuje `,` i `.` oraz przekazuje wyniki wyłącznie do `loanInputSchema`.
- [x] Błędy Zod są widoczne przy polach, dostępne dla czytników ekranu i blokują obliczenia.
- [x] Prawidłowe dane uruchamiają `calculateLoan` i pokazują pięć wymaganych miar.
- [x] Kwoty oraz procent używają wyłącznie `formatCurrencyPLN` i `formatPercentagePL`.
- [x] Wskaźnik jest opisany neutralnie, bez progu lub oceny użytkownika.
- [x] Wynik nie jest pokazywany przed sukcesem ani po zmianie danych wymagającej ponownego obliczenia.
- [x] Widok jest użyteczny przy 320 px i na desktopie, bez poziomego przewijania.
- [x] Istnieją testy komponentowe formularza, błędów, poprawnego wyniku, `0%`, przecinka dziesiętnego i zarządzania fokusem.
- [x] Ekran nie zawiera jeszcze tabeli harmonogramu, persystencji, kodu sieciowego ani logiki finansowej w komponentach.
- [x] `npm run build`, `npm run lint`, `npm run format:check` i `npm run test` kończą się powodzeniem.

## Plan implementacji

1. Dodać `react-hook-form` oraz, w razie potrzeby dla testów interakcji, `@testing-library/user-event`.
2. Utworzyć adapter i resolver `LoanFormValues → LoanInput`, wywołujący istniejący `loanInputSchema`.
3. Zbudować dostępny `LoanForm` z pięcioma polami, jednostkami, podpowiedziami i komunikatami błędów.
4. Utworzyć `LoanCalculator`, który na sukcesie wywołuje `calculateLoan`, obsługuje ukrywanie nieaktualnego wyniku i fokus.
5. Utworzyć `CalculationResults`, używający wyłącznie centralnych formatterów oraz neutralnego opisu wskaźnika.
6. Zastąpić stan przygotowania w `App.tsx` komponentem kalkulatora i dodać responsywne style.
7. Dodać testy adaptera i komponentów oraz uruchomić pełny zestaw kontroli jakości.

## Ryzyka i zasady na kolejne etapy

- Różne przeglądarki różnie traktują przecinek w `<input type="number">`; dlatego pola dziesiętne pozostają tekstowe z `inputMode="decimal"` i jednoznacznym adapterem.
- Parser formularza nie może cicho zamienić błędnego tekstu lub pustej wartości na `0`.
- Wartości wyników są symulacją. Karty nie mogą otrzymać kolorów, ikon ani komunikatów sugerujących dobrą lub złą sytuację finansową.
- Harmonogram jest już obliczany, ale nie powinien być ukrytym stanem UI ani częściową tabelą w tym etapie. Etap 006 odpowiada za jego prezentację i mobilne przewijanie.
- W przyszłości persystencja musi zostać osobnym adapterem; komponenty formularza nie powinny bezpośrednio odczytywać ani zapisywać `localStorage`.

## Zależności od kolejnych specyfikacji

- Specyfikacja 006 wykorzysta wynik `schedule` z `LoanCalculationResult` i doda dostępny, przewijalny na małych ekranach widok tabeli.
- Specyfikacja 007 może rozszerzyć stany ładowania, błędów i responsywność, ale nie może zmieniać semantyki obliczeń ani walidacji w komponentach.
- Raty malejące, nadpłaty i eksport wymagają własnych kontraktów, formularzy oraz testów; nie należą do obecnego formularza rat równych.
