# Specyfikacja 012 — Pełna metodologia kalkulatora i plan wdrożenia

## Status

Planowane. Specyfikacja nie oznacza wdrożenia zmian do obliczeń ani interfejsu.

## Cel

Przekształcić CreditScope z uproszczonej symulacji stałoprocentowej w pełny, nadal edukacyjny kalkulator oparty na metodologii opisanej w [metodologia-obliczen-kredytowych.md](../metodologia-obliczen-kredytowych.md). Docelowa wersja ma umożliwić:

- policzenie raty i harmonogramu na podstawie faktycznych parametrów umowy;
- rozróżnienie kapitału, odsetek, opłat oraz kosztów finansowanych;
- policzenie całkowitego kosztu, całkowitej kwoty do zapłaty i RRSO z przepływów oraz dat;
- porównanie rat równych i malejących, nadpłat oraz scenariuszy stopy;
- pokazanie transparentnej oceny **odporności budżetowej**, bez udawania bankowej decyzji kredytowej;
- zachowanie pełnej spójności liczbowej, testowalności i edukacyjnego charakteru produktu.

Nie jest celem stworzenie systemu bankowego, automatycznej decyzji kredytowej, scoringu bankowego, dostępu do BIK/BIG ani rekomendacji finansowej.

## Kontekst i stan wyjściowy

Obecna wersja poprawnie realizuje ograniczony model: jedna kwota kredytu, stałe nominalne oprocentowanie roczne, miesięczna stopa `r / 12`, okres wyrażony w pełnych latach, brak dodatkowych kosztów oraz bazowo raty równe. Obecne wyświetlenie „całkowitego kosztu kredytu” jest arytmetycznie równe sumie odsetek, ponieważ formularz nie zbiera prowizji, ubezpieczeń ani opłat.

W audycie metodologicznym stwierdzono następujące luki produktu:

| Obszar | Stan obecny | Docelowe działanie |
| --- | --- | --- |
| Koszty | tylko odsetki | rejestr kosztów obowiązkowych, opcjonalnych i finansowanych |
| Daty | numery miesięcy | data wypłaty, data pierwszej raty i rzeczywiste terminy przepływów |
| Oprocentowanie | jedna stała stopa nominalna | stopa stała, okresowo stała lub zmienna z harmonogramem zmian |
| Harmonogram | kapitał i odsetki | także daty, opłaty, nadpłata i pełna płatność konsumenta |
| RRSO | brak | numeryczne rozwiązanie równania wartości bieżącej przepływów |
| Suma do spłaty / koszt | poprawne tylko bez opłat | definicje zgodne z pełnym rejestrem przepływów |
| Ocena budżetu | proste DTI | DTI/DSTI, nadwyżka przed i po kosztach życia, jawny scenariusz stresowy |
| Ocena ryzyka | brak | edukacyjna klasyfikacja odporności, bez bankowego scoringu |
| Moduł rozszerzony | osobny kalkulator i osobny widok | jeden silnik scenariusza i jeden spójny widok wyników |

## Zasady bezwzględne

1. **Jedno źródło prawdy:** wszystkie warianty liczy jeden silnik domenowy; UI, eksport i zapis nie liczą ponownie rat ani kosztów.
2. **Przepływy przed sumami:** całkowity koszt, kwota do zapłaty i RRSO powstają z rejestru przepływów, a nie z prostego odejmowania pól podsumowania.
3. **Jawne założenia:** data, konwencja dni, finansowanie kosztu, wariant raty i sposób rozliczenia nadpłaty muszą być danymi modelu lub wyświetlonym założeniem domyślnym.
4. **Precyzja dziesiętna:** cała arytmetyka finansowa używa prywatnej instancji `decimal.js`; liczby `number` są tylko granicą UI/API.
5. **Brak fałszywej pewności:** DTI, scenariusz stresowy i klasyfikacja odporności są informacyjne. Interfejs nie może mówić „kredyt zostanie przyznany”, „zdolność pozytywna” ani podawać bankowej oceny ryzyka.
6. **Zgodność wsteczna:** zapisane analizy obecnej wersji pozostają czytelne jako scenariusz `basic-v1`; nie wolno interpretować ich automatycznie jako pełnych ofert z RRSO.
7. **Dane wrażliwe:** bez integracji z uprawnionymi źródłami nie wolno przedstawiać historii kredytowej jako zweryfikowanej. Dostęp do zewnętrznych baz jest poza zakresem tej specyfikacji.

## Zakres

### W zakresie

- Refaktoryzacja typów i silnika do modelu opartego na umowie oraz przepływach.
- Raty równe, malejące, karencja odsetkowa i rata balonowa jako jawne warianty.
- Wypłata jednorazowa oraz transze.
- Prowizja, ubezpieczenie i opłaty: płatne z góry, w racie, finansowane lub płatne osobno.
- Stała, okresowo stała i scenariuszowa zmienna stopa; konwencja miesięczna oraz dzienna.
- Datowany harmonogram oraz pełne podsumowania kosztów.
- RRSO obliczane z datowanych przepływów.
- Nadpłaty ze skróceniem okresu albo obniżeniem raty.
- Moduł odporności budżetowej wykorzystujący wyłącznie jawnie podane dane.
- Przebudowa formularza, wyników, eksportów, zapisów i testów.

### Poza zakresem

- Zautomatyzowane decyzje kredytowe, bankowa polityka akceptacji i prawdziwy score klienta.
- Integracja z BIK, BIG, kontem bankowym, pracodawcą, wyceną nieruchomości lub systemem bankowym.
- Kredyty indeksowane/denominowane walutą obcą w pierwszym wydaniu pełnej wersji. Dla nich potrzebny jest osobny moduł kursów oraz umownych zasad przeliczenia.
- Obsługa opóźnień, windykacji, restrukturyzacji i naliczania sankcji. Są to zdarzenia po naruszeniu umowy, nie standardowy koszt terminowej spłaty.
- Porada prawna, podatkowa lub finansowa.

## Docelowa architektura

### Struktura katalogów

```text
src/
├── features/
│   └── calculator/
│       ├── components/
│       │   ├── CreditScenarioForm.tsx
│       │   ├── ContractCostsFields.tsx
│       │   ├── RateScheduleFields.tsx
│       │   ├── BudgetResiliencePanel.tsx
│       │   ├── ScenarioResults.tsx
│       │   └── RepaymentSchedule.tsx
│       ├── validation/
│       │   └── creditScenarioSchema.ts
│       └── view-models/
│           └── scenarioResultsViewModel.ts
├── lib/
│   └── finance/
│       ├── money.ts
│       ├── calendar.ts
│       ├── cashFlows.ts
│       ├── scheduleEngine.ts
│       ├── apr.ts
│       ├── budgetResilience.ts
│       ├── creditScenarioCalculator.ts
│       └── __tests__/
├── types/
│   └── creditScenario.ts
└── migrations/
    └── savedAnalysisV1ToV2.ts
```

Obecne `loanCalculator.ts` i `advancedLoanCalculator.ts` mają zostać zastąpione przez jeden moduł `creditScenarioCalculator.ts` po zakończeniu migracji testów i UI. Nie należy utrzymywać dwóch niezależnych implementacji tego samego wzoru.

### Typy domenowe

Poniższe nazwy są obowiązującym kierunkiem kontraktu; szczegóły pól można rozszerzać tylko bez utraty ich znaczenia.

```ts
type RepaymentVariant = 'annuity' | 'declining' | 'interest-only' | 'balloon';
type RateKind = 'fixed' | 'fixed-periods' | 'variable-scenario';
type DayCountConvention = 'monthly-12' | 'actual-365' | 'actual-360';
type CostTiming = 'upfront' | 'with-disbursement' | 'monthly' | 'on-installment' | 'final';
type CostFunding = 'paid-by-consumer' | 'financed';
type PrepaymentEffect = 'reduce-term' | 'reduce-installment';

interface CreditCostInput {
  id: string;
  name: string;
  amount: number;
  required: boolean;
  timing: CostTiming;
  funding: CostFunding;
  installmentNumber?: number;
  recurringCount?: number;
}

interface RatePeriodInput {
  startsOn: string; // ISO YYYY-MM-DD
  annualNominalRate: number;
  sourceLabel?: string; // np. „stopa stała”, „scenariusz +2 p.p.”
}

interface DisbursementInput {
  date: string;
  amount: number;
}

interface PrepaymentInput {
  date: string;
  amount: number;
  effect: PrepaymentEffect;
}

interface HouseholdBudgetInput {
  monthlyNetIncome: number;
  monthlyDebtObligations: number;
  monthlyEssentialCosts?: number;
  annualRateStressBuffer?: number;
}

interface CreditScenarioInput {
  version: 2;
  currency: 'PLN';
  totalCreditAmount: number;
  disbursements: DisbursementInput[];
  firstInstallmentDate: string;
  installmentCount: number;
  repaymentVariant: RepaymentVariant;
  rateKind: RateKind;
  ratePeriods: RatePeriodInput[];
  dayCountConvention: DayCountConvention;
  costs: CreditCostInput[];
  balloonAmount?: number;
  prepayments: PrepaymentInput[];
  budget: HouseholdBudgetInput;
}
```

`totalCreditAmount` oznacza ustawową całkowitą kwotę kredytu, a nie saldo po doliczeniu finansowanej prowizji. Silnik oblicza `openingBalance` z wypłat, finansowanych kosztów i kolejności zdarzeń.

## Plan wdrożenia

### Etap 0 — Korekty obecnej wersji i zamrożenie kontraktu

**Cel:** uczynić aktualny kalkulator jednoznacznym przed migracją.

1. W `CalculationResults.tsx` zmienić etykiety:
   - „Miesięczna rata” → „Miesięczna rata w symulacji”.
   - „Suma do spłaty” → „Suma rat w symulacji”.
   - „Całkowity koszt kredytu” → „Koszt odsetkowy w symulacji”.
2. Przy formularzu dodać opis: „Model zakłada stałą nominalną stopę, miesięczne raty i brak opłat dodatkowych.”
3. W wynikach dodać „Nadwyżkę przed kosztami życia” równą `dochód netto − zobowiązania − regularna rata` oraz opis ograniczenia.
4. W `AdvancedSimulation.tsx` walidować numer raty nadpłaty jako liczbę całkowitą w dozwolonym zakresie, zanim wywołany zostanie silnik.
5. Wyraźnie rozdzielić wynik bazowy od rozszerzonego. Po zmianie wariantu lub nadpłat pokazywać podsumowanie i harmonogram **tego samego** aktywnego scenariusza, zamiast pozostawiać obok siebie niespójne wyniki.
6. Dodać testy regresji dla tych etykiet, walidacji i spójności widoku.

**Kryterium akceptacji:** obecna wersja nie sugeruje pełnego CKK, RRSO ani decyzji kredytowej; nie może zostać przerwana przez niecałkowity numer raty nadpłaty.

### Etap 1 — Model danych, walidacja i migracja zapisów

**Cel:** zastąpić `LoanInput` przez wersjonowany `CreditScenarioInput` bez zmiany wyniku dla scenariusza bazowego.

1. Utworzyć `src/types/creditScenario.ts` z kontraktami domenowymi i typami wyniku.
2. Dodać Zod `creditScenarioSchema.ts`; walidować kwoty, chronologię dat, monotoniczność okresów stopy, brak nakładających się zdarzeń, poprawność liczby rat i zasad finansowania kosztów.
3. Zaprojektować adapter `basicLoanInputToScenarioV2`, który mapuje dzisiejszy formularz na:
   - jedną wypłatę;
   - `monthly-12`;
   - stopę `fixed`;
   - wariant `annuity`;
   - pustą listę kosztów i nadpłat.
4. W `savedAnalysis.ts` i schemacie Supabase dodać `scenario_version` oraz serializowany pełny scenariusz. Stare rekordy oznaczyć `basic-v1` i odczytywać przez adapter tylko do wyświetlenia historycznego.
5. Nie nadpisywać istniejących zapisów ani nie zmieniać ich liczbowych wyników w migracji.

**Kryterium akceptacji:** scenariusz v2 z pustymi kosztami i stałą stopą daje identyczne wyniki bazowe co aktualny kalkulator, w granicy istniejącej polityki groszowej.

### Etap 2 — Kalendarz, zdarzenia i rejestr przepływów

**Cel:** uczynić daty i koszt widoczną częścią modelu.

1. Utworzyć `calendar.ts` z funkcjami dodawania miesięcy, walidacji dat ISO i obliczania liczby dni między zdarzeniami; żadna funkcja finansowa nie może używać bieżącej daty systemowej.
2. Utworzyć `cashFlows.ts`, który buduje niezmienny rejestr zdarzeń z perspektywy konsumenta: wypłaty, opłaty z góry, raty, opłaty okresowe, nadpłaty i płatność końcowa.
3. Zdefiniować kolejność zdarzeń przypadających na tę samą datę i udokumentować ją w kodzie oraz UI: wypłata → finansowany koszt → naliczenie odsetek → rata → nadpłata. Jeżeli umowa wymaga innej kolejności, scenariusz musi ją wskazać.
4. Dodać konwencje `monthly-12`, `actual-365`, `actual-360`. Dla pierwszej wersji ukryć dzienne konwencje, dopóki formularz nie zbiera dat wszystkich potrzebnych zdarzeń.
5. Rozszerzyć pozycję harmonogramu o: datę, saldo przed ratą, stopę, liczbę dni, ratę kapitałowo-odsetkową, inne koszty, nadpłatę, pełną płatność i saldo po płatności.

**Kryterium akceptacji:** każde podsumowanie da się odtworzyć przez zsumowanie datowanych przepływów; harmonogram pokazuje pełną płatność konsumenta, nie tylko kapitał i odsetki.

### Etap 3 — Jeden silnik harmonogramu

**Cel:** obliczać każdy wspierany wariant według wspólnej pętli zdarzeń.

1. Utworzyć `scheduleEngine.ts` przyjmujący zwalidowany scenariusz i zwracający harmonogram oraz rejestr przepływów bez formatowania.
2. Zaimplementować raty równe:
   - stopa stała: wzór annuitetowy;
   - zmiana stopy: przeliczenie raty na pozostałe saldo i liczbę rat, jeśli scenariusz wskazuje zachowanie terminu;
   - zero procent: osobna ścieżka bez dzielenia przez stopę.
3. Zaimplementować raty malejące ze stałą częścią kapitałową, skorygowaną w ostatniej racie.
4. Zaimplementować karencję odsetkową i ratę balonową tylko wtedy, gdy UI wprost pokazuje saldo/płatność końcową.
5. Zaimplementować transze: odsetki są naliczane tylko od uruchomionego salda.
6. Zaimplementować nadpłaty jako osobne zdarzenia i dwa skutki:
   - `reduce-term`: pozostawia ratę planową, skraca okres;
   - `reduce-installment`: zachowuje termin, przelicza ratę od nowego salda.
7. Polityka groszowa: liczyć z wysoką precyzją, księgować i prezentować zgodnie z jedną, udokumentowaną regułą; ostatnia płatność wyrównuje saldo do zera.
8. Usunąć duplikację z `advancedLoanCalculator.ts` dopiero po przełączeniu wszystkich konsumentów na nowy silnik.

**Kryterium akceptacji:** dla każdego wspieranego wariantu suma części kapitałowych równa się spłaconemu saldu, saldo końcowe wynosi zero, a pełna płatność równa się sumie komponentów wiersza.

### Etap 4 — Koszty, całkowity koszt i całkowita kwota do zapłaty

**Cel:** implementować ustawowe pojęcia na podstawie danych, które użytkownik podaje.

1. Dodać do formularza sekcję „Koszty i usługi obowiązkowe” z tabelą dodawania pozycji: nazwa, kwota, obowiązkowość, termin oraz sposób finansowania.
2. Rozdzielić koszty na:
   - wymagane i znane — uwzględniane w CKK, CKZ oraz RRSO;
   - opcjonalne — widoczne osobno, domyślnie poza CKK/RRSO;
   - koszty wynikające z opóźnienia — poza standardową symulacją.
3. Dla kosztu finansowanego zwiększać saldo harmonogramu, ale nie `totalCreditAmount`.
4. Dla kosztu pobranego z góry dodać ujemny przepływ konsumenta w dacie wypłaty; nie może zniknąć z CKK tylko dlatego, że nie jest częścią raty.
5. Liczyć:

   ```text
   CKK = suma obowiązkowych kosztów ponoszonych przez konsumenta
   CKZ = totalCreditAmount + CKK
   pełny wypływ konsumenta = suma wszystkich jego wymaganych płatności
   ```

6. Dodać kontrolę zgodności `CKZ` z rejestrem przepływów oraz wyjaśnienie, gdy koszt jest finansowany albo pobrany z góry.

**Kryterium akceptacji:** ta sama prowizja płatna z góry i kredytowana daje różne harmonogramy oraz RRSO, lecz w obu przypadkach jest ujęta jako koszt zgodnie z jej sposobem rozliczenia.

### Etap 5 — RRSO

**Cel:** policzyć RRSO z faktycznych dat i pełnych przepływów, a nie z oprocentowania nominalnego.

1. Utworzyć `src/lib/finance/apr.ts` z funkcją `calculateApr(cashFlows): AprResult`.
2. Przepływy z perspektywy konsumenta kodować konsekwentnie: otrzymane środki dodatnie, raty i koszty ujemne.
3. Zdefiniować funkcję wartości bieżącej:

   ```text
   f(X) = Σ cashFlow_k / (1 + X) ^ yearFraction_k
   ```

   gdzie `X` jest RRSO, a `yearFraction_k` wynika z dat i wybranej, udokumentowanej konwencji dla obliczenia RRSO.
4. Znajdować rozwiązanie metodą bisekcji w bezpiecznym przedziale, z walidacją zmiany znaku i limitem iteracji. Opcjonalna metoda Newtona może tylko przyspieszać algorytm, nigdy zastępować stabilnej ścieżki.
5. Zwracać: wartość RRSO, błąd końcowy, liczbę iteracji, zastosowane daty i listę przepływów użytych do obliczenia.
6. Gdy brak kosztów lub dat wymaganych do rzetelnego obliczenia, nie pokazywać pozornego wyniku; komunikować brak danych.
7. W UI obok RRSO wyświetlać „założenia obliczenia” i link/odniesienie do listy kosztów. Nie interpretować RRSO jako sumy stopy i prowizji.

**Kryterium akceptacji:** wynik RRSO spełnia równanie wartości bieżącej w ustalonej tolerancji, a testy obejmują wypłatę jednorazową, prowizję z góry, prowizję finansowaną, opłatę miesięczną i raty o różnych datach.

### Etap 6 — Oprocentowanie i scenariusze

**Cel:** prawidłowo komunikować, co jest obliczeniem umownym, a co scenariuszem.

1. Dodać wybór rodzaju stopy: „stała przez cały okres”, „stała przez określony czas”, „scenariusz zmiennej stopy”.
2. Dla okresowo stałej i scenariuszowej stopy dodać tabelę okresów: data początku, roczna stopa nominalna, opis źródła/założenia.
3. Po zmianie stopy udokumentować w UI regułę: „zachowaj termin i przelicz ratę” albo „zachowaj ratę i przelicz termin”. Pierwsza wersja obsługuje tylko pierwszą regułę.
4. Używać nazwy „scenariusz stopy”, nie „prognoza stopy”, gdy dane zostały wpisane ręcznie.
5. W podsumowaniu rozdzielić ratę bieżącą, ratę maksymalną scenariusza i sumę płatności scenariusza.

**Kryterium akceptacji:** przy zmiennej stopie każdy wiersz harmonogramu zawiera obowiązującą stopę, a użytkownik widzi, kiedy oraz dlaczego rata się zmieniła.

### Etap 7 — Odporność budżetowa i edukacyjna klasyfikacja ryzyka

**Cel:** uzupełnić DTI o rzetelne, ograniczone do danych użytkownika miary budżetowe.

1. Rozszerzyć formularz o opcjonalne „Miesięczne koszty podstawowe gospodarstwa domowego” oraz „Bufor stopy w scenariuszu stresowym”.
2. Wyliczać:

   ```text
   DTI / DSTI = (pełna wymagalna płatność + obecne zobowiązania) / dochód netto × 100
   nadwyżka bieżąca = dochód − obecne zobowiązania − pełna płatność − koszty podstawowe
   DSTI stresowe = (rata przy stopie stresowej + obecne zobowiązania) / dochód × 100
   nadwyżka stresowa = dochód − obecne zobowiązania − rata stresowa − koszty podstawowe
   ```

3. W przypadku rat malejących lub scenariusza stóp pokazywać ratę maksymalną i maksymalne DSTI, nie wyłącznie pierwszą lub średnią ratę.
4. Dodać wyłącznie transparentne statusy:
   - „brak danych do oceny odporności”,
   - „ujemna nadwyżka w scenariuszu”,
   - „wynik wymaga dalszej analizy”.
5. Nigdy nie wyświetlać „niska ryzykowność”, „pozytywna zdolność” ani numerycznego scoringu bankowego.
6. Przy każdej wartości pokazać wzór, przyjęty bufor oraz pełne zastrzeżenie o zakresie danych.

**Kryterium akceptacji:** użytkownik rozumie, które dane tworzą wynik; zmiana kosztów życia lub bufora aktualizuje wynik deterministycznie, bez sugerowania decyzji kredytowej.

### Etap 8 — Interfejs i doświadczenie użytkownika

**Cel:** udostępnić pełną metodologię bez przeciążenia formularza.

1. Podzielić formularz na sekcje z progresywnym ujawnianiem:
   - „Podstawowe parametry” — wymagane;
   - „Oprocentowanie i terminy” — wymagane dla pełnej wersji;
   - „Koszty obowiązkowe” — opcjonalne, ale wymagane do pełnego CKK/RRSO;
   - „Nadpłaty i wariant spłaty” — opcjonalne;
   - „Budżet i odporność” — część minimalna wymagana, koszty życia/bufor opcjonalne.
2. Wprowadzić widoczne znaczniki: „wymagane do RRSO”, „opcjonalne”, „wpływa na harmonogram”, „nie jest używane do decyzji kredytowej”.
3. Podsumowanie wyników podzielić na cztery grupy:
   - rata i harmonogram;
   - koszty i całkowita kwota do zapłaty;
   - RRSO i założenia;
   - obciążenie budżetu i odporność.
4. Harmonogram wyświetlać dla aktywnego scenariusza; eksport CSV/PDF musi zawierać te same kolumny i metadane.
5. Zachować dostępność: semantyczne pola, obsługę klawiatury, komunikaty błędów przy polach, opisy wykresów i brak przekazywania znaczenia wyłącznie kolorem.

**Kryterium akceptacji:** użytkownik może odróżnić dane faktycznie podane od założeń modelu oraz koszt odsetkowy od pełnego CKK.

### Etap 9 — Eksport, zapisy i historia

**Cel:** zapisana lub wyeksportowana analiza jest odtwarzalna.

1. CSV zawiera: wersję scenariusza, wszystkie wejścia, daty, konwencję dni, każdy przepływ oraz wszystkie kolumny harmonogramu.
2. PDF zawiera skrót założeń, pełne podsumowanie, RRSO z listą założeń, ograniczenia oraz harmonogram; nie ograniczać eksportu do pierwszych 40 rat bez informacji o pominięciu.
3. Zapis Supabase przechowuje surowe wejście v2, wynik i wersję algorytmu. Nie rekonstruować historycznych wyników nowym silnikiem bez zaznaczenia wersji.
4. W widoku zapisanej analizy wyświetlać etykietę „model podstawowy v1” albo „pełny scenariusz v2”.

**Kryterium akceptacji:** użytkownik może odtworzyć każdy zapisany wynik z jego własnych danych i wersji algorytmu.

### Etap 10 — Testy, walidacja referencyjna i wydanie

**Cel:** potwierdzić poprawność metodologiczną przed włączeniem pełnej wersji.

1. Dodać testy jednostkowe dla `money`, kalendarza, przepływów, harmonogramu, kosztów, RRSO i odporności budżetowej.
2. Utrzymać testy właściwości:
   - suma kapitału = saldo początkowe skorygowane o transze/finansowane koszty;
   - saldo nie staje się ujemne;
   - suma komponentów = pełna płatność każdego wiersza;
   - suma przepływów konsumenta jest zgodna z podsumowaniem;
   - RRSO zeruje funkcję NPV w tolerancji;
   - nadpłata nie zwiększa salda ani nie zwiększa odsetek przy niezmienionych innych założeniach.
3. Dodać przypadki referencyjne wyliczone niezależnie od implementacji: 0%, rata równa, malejąca, prowizja z góry, prowizja finansowana, miesięczna opłata, zmiana stopy, nadpłata z dwoma skutkami, transze oraz nietypowe odstępy dat.
4. Testować walidację: niepełne dane RRSO, data raty przed wypłatą, ujemne koszty, konflikt transz, nadpłata po zamknięciu salda i niecałkowity numer raty.
5. Testować UI: sekcje formularza, informację o założeniach, brak RRSO przy niepełnych danych, aktywny scenariusz, eksport i zapisaną analizę v1/v2.
6. Przed wydaniem uruchomić `npm run build`, `npm run lint`, `npm run format:check` oraz `npm run test`; dodatkowo przeprowadzić ręczną kontrolę z co najmniej trzema rzeczywistymi, zanonimizowanymi formularzami informacyjnymi.

**Kryterium akceptacji:** każdy ważny wynik ma test referencyjny lub własność matematyczną, a rozbieżność z dokumentem umowy jest prezentowana jako różnica założeń, nie ukrywana przez zaokrąglenie.

## Kolejność wydań

| Wydanie | Zawartość | Warunek rozpoczęcia kolejnego |
| --- | --- | --- |
| 12.0 | Etap 0: doprecyzowanie aktualnego modelu i usunięcie niespójności widoku | testy regresji zielone |
| 12.1 | Etapy 1–3: scenariusz v2, datowany wspólny silnik, raty i nadpłaty | zgodność bazowa v1/v2 |
| 12.2 | Etapy 4–5: koszty, CKZ/CKK, RRSO | referencyjne testy RRSO zielone |
| 12.3 | Etapy 6–8: stopy scenariuszowe, odporność budżetu, pełny UI | audyt dostępności i języka edukacyjnego |
| 12.4 | Etapy 9–10: eksport, migracja zapisów, wydanie | wszystkie kontrole jakości i ręczna walidacja |

Nie należy wdrażać częściowego RRSO przed datowanym rejestrem przepływów. Nie należy wdrażać oceny ryzyka jako pojedynczej liczby przed dodaniem kosztów życia, założeń stresu i jasnego zastrzeżenia.

## Kryteria akceptacji pełnej wersji

- [ ] Jeden silnik wyznacza wyniki bazowe, rozszerzone, eksportowane i zapisane.
- [ ] Model odróżnia całkowitą kwotę kredytu od finansowanych kosztów i salda początkowego.
- [ ] Każdy koszt ma obowiązkowość, termin oraz sposób finansowania.
- [ ] Harmonogram jest datowany i pokazuje pełną płatność, kapitał, odsetki, koszty, nadpłatę oraz saldo.
- [ ] CKK i CKZ powstają z pełnego rejestru kosztów oraz przepływów, a nie tylko z odsetek.
- [ ] RRSO jest obliczane numerycznie z datowanych przepływów i pokazuje założenia.
- [ ] Zmiana stopy, transza oraz nadpłata mają jawne, przetestowane reguły rozliczenia.
- [ ] DTI/DSTI i nadwyżka są opisane jako edukacyjna analiza budżetu; brak bankowego scoringu i decyzji.
- [ ] Eksport oraz zapis odtwarzają dokładnie ten sam scenariusz i wersję algorytmu.
- [ ] Pełna macierz testów finansowych, walidacyjnych i UI przechodzi przed wydaniem.

## Źródła metodologiczne

Źródłem szczegółowych definicji, wzorów, ograniczeń i bibliografii jest [metodologia-obliczen-kredytowych.md](../metodologia-obliczen-kredytowych.md), w szczególności sekcje 8–16. Dokument zawiera odwołania do:

- ustawy o kredycie konsumenckim (w tym definicji całkowitego kosztu, całkowitej kwoty do zapłaty i obowiązku oceny zdolności);
- Prawa bankowego, art. 70 i 70a;
- Rekomendacji T KNF;
- wytycznych EBA dotyczących udzielania i monitorowania kredytów;
- dyrektyw UE dotyczących RRSO i równania wartości bieżącej.

Specyfikacja ma charakter techniczno-produktowy. W razie konfliktu definicje prawne i metodologia źródłowa mają pierwszeństwo przed skrótową nazwą pola w interfejsie.
