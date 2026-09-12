# Specyfikacja 013a — Pełne tłumaczenie stanów runtime

## Status

Wdrożone jako uzupełnienie specyfikacji [013](013-internacjonalizacja-pl-en.md).

## Problem

Podstawowe tłumaczenie nagłówka i formularza nie wystarcza, jeśli po uruchomieniu symulacji, otwarciu panelu konta lub wyświetleniu błędu nadal pojawiają się teksty w poprzednim języku. Jest to defekt funkcjonalny interfejsu dwujęzycznego.

## Zasada

Po wybraniu `PL` albo `EN` wszystkie teksty generowane przez aplikację w aktywnym widoku oraz widokach otwieranych później są renderowane w wybranym języku. Wyjątkiem są dane własne użytkownika, np. wcześniej nadany tytuł analizy.

## Zakres obowiązkowy

### Formularz i walidacja

- etykiety, jednostki, podpowiedzi i komunikaty walidacji;
- komunikaty stanu i atrybuty `aria-*`;
- błędy prezentowane w formularzu bez twardo wpisanych polskich tekstów.

### Wyniki i harmonogram

- nagłówki wyników, nazwy metryk, zastrzeżenia i harmonogram;
- filtr roku, licznik rat, podpis tabeli, nazwy kolumn oraz opis przewijanego obszaru;
- wartości formatowane w `pl-PL` lub `en-GB` bez ponownego liczenia scenariusza.

### Rozszerzona symulacja i eksporty

- warianty rat, nadpłaty, komunikaty walidacji, wykresy i status lokalnego zapisu;
- przyciski CSV/PDF, nazwy kolumn, nazwy pobieranych plików i tekst PDF.

### Konto i zapisane analizy

- logowanie, rejestracja, reset hasła, potwierdzenie e-maila i widok zalogowany;
- stany ładowania, sukcesu i błędu;
- komunikaty Supabase mapowane na kontrolowane klucze słownika, bez surowych błędów dostawcy;
- zapis, lista, otwarcie i usunięcie analizy.

## Kontrola jakości

- [x] Test struktury słowników `pl` i `en`.
- [x] Test przełącznika języka, locale dokumentu i zachowania danych formularza.
- [x] Testy formularza, harmonogramu, konta i kalkulatora.
- [x] Lintowanie oraz kompilacja produkcyjna.

