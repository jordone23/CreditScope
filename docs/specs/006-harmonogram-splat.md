# Specyfikacja 006 — Harmonogram spłat

## Status

Zaimplementowano 26.07.2026. Zweryfikowano komendami `build`, `lint`, `format:check` i `test`.

## Cel

Udostępnić szczegółowy harmonogram rat równych obliczony już przez etap 003. Po poprawnym obliczeniu symulacji użytkownik ma zobaczyć dostępny, czytelny i responsywny wykaz każdej raty z podziałem na kapitał, odsetki oraz pozostałe saldo.

Etap jest wyłącznie warstwą prezentacji `LoanCalculationResult.schedule`. Nie zmienia wzorów finansowych, walidacji formularza ani danych wejściowych.

## Kontekst i zależności

- Etap 002 dostarcza `LoanInput`, `RepaymentScheduleItem` i walidację danych.
- Etap 003 tworzy w `calculateLoan` miesięczny harmonogram z polami `installmentNumber`, `installmentAmount`, `principalAmount`, `interestAmount` i `remainingBalance`.
- Etap 004 obejmuje logikę finansową testami; nie należy jej duplikować w UI.
- Etap 005 udostępnia wynik tylko po poprawnym przesłaniu formularza i ukrywa go po zmianie danych. Harmonogram podlega dokładnie temu samemu cyklowi życia co karty wyniku.

## Zakres

### W zakresie

- Semantyczna tabela harmonogramu wyświetlana pod kartami wyniku.
- Pięć kolumn: numer raty, rata, część kapitałowa, część odsetkowa, saldo po racie.
- Użycie wyłącznie istniejącego `formatCurrencyPLN` dla wartości pieniężnych.
- Poziome przewijanie kontenera tabeli na małych ekranach, bez obcinania kolumn i bez łamania całego widoku.
- Opcjonalny filtr logicznego roku spłaty (raty 1–12 to rok 1, 13–24 to rok 2 itd.), który ogranicza liczbę widocznych wierszy przy długich harmonogramach.
- Testy komponentowe tabeli, formatowania, filtrowania i dostępności podstawowych elementów.

### Poza zakresem

- Zmiana obliczeń, zaokrągleń lub generowania `schedule`.
- Daty kalendarzowe, wybór daty pierwszej raty i obsługa świąt.
- Raty malejące, nadpłaty, prowizje, RRSO, wykresy, eksport oraz porównanie wariantów.
- Zapisywanie danych, `localStorage`, backend, API, analityka i rekomendacje finansowe.

## Decyzje architektoniczne

| Obszar | Decyzja | Uzasadnienie |
| --- | --- | --- |
| Źródło danych | Komponent otrzymuje `ReadonlyArray<RepaymentScheduleItem>` z gotowego wyniku. | UI nie ma własnego stanu finansowego ani nie wywołuje silnika obliczeń. |
| Komponent | Powstaje `RepaymentSchedule` obok komponentów kalkulatora. | Oddziela prezentację długiej tabeli od kart podsumowania. |
| Rok spłaty | To indeks prezentacyjny wyznaczony przez numer raty co 12 pozycji; nie jest datą ani nowym wynikiem finansowym. | Typ harmonogramu nie zawiera dat, a filtr ułatwia odczyt długiej listy. |
| Format | Wszystkie wartości pieniężne przekazuje się do `formatCurrencyPLN`. | Utrzymuje polską lokalizację i jedno źródło formatowania z etapu 001. |
| Mobilność | Nienaruszona tabela ma minimalną szerokość wewnątrz kontenera `overflow-x: auto`. | Zachowuje relacje nagłówków z danymi i umożliwia dotykowe przewijanie zamiast ukrywania informacji. |
| Dostępność | Natywne `table`, `caption`, `thead`, `tbody`, nagłówki z `scope="col"`, nazwany kontener przewijania i natywny `select`. | Tabela i filtr są dostępne dla czytników ekranu oraz klawiatury. |

## Interfejs i zachowanie

### Widoczność

`RepaymentSchedule` jest renderowany wewnątrz `CalculationResults`, po opisie edukacyjnym. Nie istnieje przed pierwszym poprawnym obliczeniem i znika razem z całym wynikiem po każdej zmianie wartości formularza.

### Filtr roku

Nad tabelą znajduje się pole `select` opisane etykietą „Pokaż raty z roku spłaty”. Domyślna opcja „Wszystkie raty” pokazuje kompletny harmonogram. Dostępne lata są tworzone wyłącznie z długości przekazanego harmonogramu; ostatni rok może zawierać mniej niż 12 rat. Wybranie roku pokazuje tylko jego raty i informację tekstową o liczbie widocznych pozycji.

Zmiana filtra nie modyfikuje ani nie zapisuje symulacji. Po otrzymaniu nowego harmonogramu filtr wraca do „Wszystkie raty”, aby nie ukryć wyniku przez nieaktualny wybór.

### Tabela

Sekcja ma nagłówek „Harmonogram spłat”. Tabela otrzymuje `caption` wyjaśniające, że pokazuje miesięczny podział rat. Nagłówki kolumn brzmią:

1. `Nr raty`
2. `Rata`
3. `Kapitał`
4. `Odsetki`
5. `Saldo po racie`

Numer raty jest liczbą całkowitą. Cztery pozostałe wartości są formatowane przez `formatCurrencyPLN`. Element UI nie sumuje, nie zaokrągla ani nie interpretuje wartości finansowych. Nie stosuje się kolorów ani tekstów oceniających sytuację użytkownika.

### Responsywność

- Przy 320 px tabela pozostaje kompletna wewnątrz osobnego kontenera z poziomym przewijaniem; główna strona nie uzyskuje poziomego paska przewijania.
- Tabela ma czytelne odstępy i minimalną szerokość, która chroni nagłówki oraz kwoty przed zgnieceniem.
- Na szerszych ekranach wykorzystuje szerokość karty wyników.
- Kontener przewijania ma widoczny fokus, może otrzymać fokus klawiaturą i ma opis „Przewijany poziomo harmonogram spłat”.

## Wymagania funkcjonalne

1. Poprawne obliczenie pokazuje wszystkie pozycje zwrócone w `result.schedule`.
2. Każdy wiersz zachowuje właściwe powiązanie danych z kolumnami i kolejność numerów rat.
3. Kwoty w tabeli są formatowane wyłącznie przez `formatCurrencyPLN`.
4. Harmonogram jest dostępny jako prawdziwa tabela z podpisem i nagłówkami kolumn.
5. Dla długich harmonogramów użytkownik może ograniczyć widok do logicznego roku spłaty, bez zmiany wyniku obliczeń.
6. Tabela jest przewijalna poziomo na małych ekranach.
7. Harmonogram nie pojawia się dla błędnego formularza, przed obliczeniem ani po zmianie danych formularza.

## Testy

Testy React Testing Library muszą pokrywać co najmniej:

- brak harmonogramu przed pierwszym poprawnym przesłaniem;
- tabelę, podpis oraz pięć nagłówków po poprawnym obliczeniu;
- poprawne formatowanie kwoty raty, kapitału, odsetek i salda;
- obecność wszystkich rat dla domyślnego widoku;
- ograniczenie widoku do wybranego roku bez modyfikacji wartości rat;
- dostępne etykiety filtra i przewijanego kontenera;
- zniknięcie harmonogramu po zmianie danych formularza.

Testy silnika z etapów 003–004 nadal są źródłem weryfikacji wartości liczbowych. Testy komponentu nie powielają wzorów finansowych.

## Kryteria akceptacji

- [x] Istnieje osobny komponent prezentujący harmonogram z `LoanCalculationResult.schedule`.
- [x] Harmonogram jest prawdziwą, opisaną tabelą z pięcioma wymaganymi kolumnami.
- [x] Wszystkie kwoty używają wyłącznie `formatCurrencyPLN`.
- [x] Widok domyślny prezentuje wszystkie raty w kolejności.
- [x] Dostępny filtr roku ogranicza wyłącznie widoczne raty i resetuje się dla nowego wyniku.
- [x] Na małym ekranie tabela przewija się poziomo we własnym kontenerze.
- [x] Harmonogram jest widoczny tylko dla aktualnego, poprawnego wyniku.
- [x] Istnieją testy komponentowe tabeli, filtrowania, formatowania i dostępności.
- [x] Nie dodano persystencji, sieci, nowych obliczeń finansowych ani funkcji spoza zakresu.
- [x] `npm run build`, `npm run lint`, `npm run format:check` i `npm run test` kończą się powodzeniem.

## Plan implementacji

1. Utworzyć `RepaymentSchedule` przyjmujący harmonogram jako dane wejściowe.
2. Dodać semantyczną tabelę, filtr roku i wyłącznie centralne formatowanie walut.
3. Osadzić komponent pod aktualnymi kartami wyników.
4. Uzupełnić responsywne style przewijalnego kontenera oraz tabeli.
5. Rozszerzyć testy zachowań kalkulatora i uruchomić pełny zestaw kontroli jakości.
