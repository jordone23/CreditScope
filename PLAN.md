# Plan realizacji projektu CreditScope

## Proponowany stack

| Obszar | Technologia | Uzasadnienie |
| --- | --- | --- |
| Aplikacja webowa | React + TypeScript + Vite | Szybkie środowisko pracy, komponentowa budowa interfejsu i bezpieczeństwo typów. |
| Stylowanie | Tailwind CSS | Sprawne tworzenie responsywnego, spójnego interfejsu. |
| Formularze i walidacja | React Hook Form + Zod | Wygodna obsługa formularza oraz czytelna walidacja danych wejściowych. |
| Obliczenia | Własny moduł TypeScript | Przejrzysta implementacja wzorów finansowych, łatwa do testowania niezależnie od UI. |
| Pieniądze i precyzja | decimal.js | Ograniczenie błędów zaokrągleń charakterystycznych dla liczb zmiennoprzecinkowych JavaScript. |
| Wykresy | Recharts | Wykres salda i struktury rat w planowanych rozszerzeniach. |
| Testy jednostkowe | Vitest | Testowanie logiki obliczeń i przypadków brzegowych. |
| Testy komponentów | React Testing Library | Weryfikacja zachowania formularza i prezentacji wyników. |
| Jakość kodu | ESLint + Prettier | Spójny styl i podstawowa kontrola jakości. |
| Eksport danych (później) | Papa Parse oraz jsPDF | Eksport harmonogramu odpowiednio do CSV i PDF. |

Na pierwszym etapie aplikacja nie wymaga serwera ani bazy danych: symulacja może działać w całości w przeglądarce. Backend warto dodać dopiero dla zapisywania symulacji, kont użytkowników lub współdzielenia danych.

## Etapy realizacji

### 1. Inicjalizacja i konfiguracja

- Utworzyć projekt Vite z Reactem i TypeScriptem.
- Skonfigurować Tailwind CSS, ESLint, Prettier i Vitest.
- Zdefiniować strukturę katalogów, np. `components`, `features`, `lib`, `types` i `tests`.
- Przygotować podstawowy, responsywny układ strony oraz stałe formatowania walut i procentów dla języka polskiego.

### 2. Model danych i walidacja

- Zdefiniować typy danych wejściowych, wyników i pojedynczej pozycji harmonogramu.
- Utworzyć schemat Zod walidujący dodatnią kwotę kredytu, nieujemne oprocentowanie i zobowiązania, dodatni okres oraz dochód.
- Ustalić jednostki: okres spłaty w latach, oprocentowanie nominalne w skali roku, harmonogram miesięczny.
- Obsłużyć przypadki brzegowe, w tym oprocentowanie równe `0%`, bardzo krótki okres oraz wartości dziesiętne.

### 3. Silnik obliczeń kredytowych

- Zaimplementować wyliczanie miesięcznej raty równej.
- Wyliczać całkowitą kwotę do spłaty, koszt kredytu i sumę odsetek.
- Generować harmonogram spłat: numer raty, data lub miesiąc, rata, część kapitałowa, część odsetkowa i pozostałe saldo.
- Stosować `decimal.js` oraz konsekwentne zaokrąglenia do dwóch miejsc po przecinku.
- Wyliczać orientacyjny wskaźnik obciążenia dochodu: `(rata + miesięczne zobowiązania) / dochód netto × 100%`.

### 4. Testy logiki finansowej

- Napisać testy raty dla typowych parametrów i porównać je z niezależnie zweryfikowanymi wartościami referencyjnymi.
- Przetestować kredyt bez odsetek, pojedynczą ratę, duże kwoty i wysokie oprocentowanie.
- Sprawdzić, czy suma części kapitałowych pokrywa kwotę kredytu oraz czy końcowe saldo wynosi zero po dopuszczalnym zaokrągleniu.
- Zweryfikować zachowanie walidacji dla błędnych danych.

### 5. Interfejs formularza i wyników

- Zbudować formularz z opisami pól, walidacją w trakcie wpisywania i czytelnymi komunikatami błędów.
- Dodać karty podsumowania: rata, suma do spłaty, koszt kredytu, odsetki i wskaźnik obciążenia dochodu.
- Zastosować formatowanie kwot w PLN oraz procentów zgodne z polską lokalizacją.
- Wyświetlić informacyjny opis wskaźnika obciążenia bez sugerowania decyzji kredytowej.
- Zapewnić dostępność: etykiety pól, obsługę klawiatury, właściwy kontrast i semantyczne elementy HTML.

### 6. Harmonogram spłat

- Wyświetlić tabelę harmonogramu z podziałem na kapitał i odsetki.
- Umożliwić przewijanie tabeli na małych ekranach.
- Dodać opcjonalne podsumowanie roczne lub filtrowanie widocznych rat, jeśli tabela okaże się zbyt długa.

### 7. Responsywność i dopracowanie

- Sprawdzić widoki mobilne, tabletowe i desktopowe.
- Dodać stan początkowy, stan błędu i stan po obliczeniu.
- Umieścić widoczne zastrzeżenie, że wyniki są wyłącznie symulacją edukacyjną i nie stanowią oferty bankowej ani oceny zdolności kredytowej.
- Przeprowadzić ręczną kontrolę obliczeń na kilku scenariuszach.

### 8. Rozszerzenia po wersji podstawowej

- Dodać raty malejące i porównanie wariantów.
- Dodać jednorazowe oraz cykliczne nadpłaty i symulację wcześniejszej spłaty.
- Zintegrować wykres salda zadłużenia oraz wykres proporcji kapitału i odsetek.
- Dodać eksport CSV/PDF.
- Zapisywać symulacje lokalnie w `localStorage`, a w późniejszym etapie rozważyć backend i bazę danych.

## Definicja gotowości wersji podstawowej (MVP)

Wersja podstawowa jest gotowa, gdy użytkownik może wprowadzić wszystkie wymagane dane, otrzymać zwalidowane wyniki i pełny harmonogram rat równych, a obliczenia są objęte testami jednostkowymi. Interfejs działa poprawnie na telefonie i komputerze oraz zawiera wymagane zastrzeżenie edukacyjne.
