# Specyfikacja 007 — Responsywność i dopracowanie MVP

## Status

Zaimplementowano 26.07.2026. Zweryfikowano komendami `build`, `lint`, `format:check` i `test`.

## Cel

Domknąć wersję podstawową CreditScope po etapach 001–006: dopracować zachowanie aplikacji na telefonie, tablecie i desktopie, jednoznacznie pokazać stan początkowy, błąd oraz sukces obliczenia, a także potwierdzić edukacyjny charakter narzędzia.

Etap nie rozszerza kalkulatora o nowe produkty finansowe. Wzory, walidacja, dane i harmonogram pozostają kontraktami etapów 002–006.

## Zakres

### W zakresie

- Widoczny stan początkowy z krótką instrukcją przed pierwszym obliczeniem.
- Komunikat zbiorczy po niepoprawnym przesłaniu formularza, uzupełniający istniejące błędy przy polach.
- Zachowanie stanu po poprawnym obliczeniu oraz powrót do stanu początkowego po zmianie danych.
- Dopracowanie stylów dla szerokości 320 px, tabletowej i desktopowej, w tym ochronę tekstu przed poziomym przepełnieniem.
- Utrzymanie dostępności klawiaturowej, fokusu, semantyki formularza i tabeli.
- Kontrola obecności stałego zastrzeżenia edukacyjnego oraz testy stanów interfejsu.
- Powtórna walidacja liczbowych scenariuszy przez istniejące testy silnika i testy integracyjne UI.

### Poza zakresem

- Zmiany w `loanInputSchema`, typach danych, wzorach rat i zaokrągleniach.
- Nowe pola formularza, raty malejące, nadpłaty, wykresy, eksport, konta i historia symulacji.
- Persystencja, `localStorage`, backend, API, analityka i integracje bankowe.
- Ocena zdolności kredytowej, rekomendacja, klasyfikacja lub decyzja finansowa.

## Decyzje architektoniczne

| Obszar | Decyzja | Uzasadnienie |
| --- | --- | --- |
| Stan widoku | `LoanCalculator` przechowuje lokalnie wyłącznie stan prezentacyjny: początkowy, błąd przesłania albo obliczony wynik. | Nie miesza obsługi UI z formularzem, walidacją ani silnikiem finansowym. |
| Błąd | Formularz zachowuje szczegółowe komunikaty Zod przy polach; kalkulator dodaje krótki komunikat `role="alert"` po nieudanym przesłaniu. | Użytkownik otrzymuje zarówno podsumowanie, jak i wskazanie konkretnego pola. |
| Sukces | Po sukcesie nadal fokusuje się nagłówek wyniku. Stan instrukcji znika, aby nie dublować treści wyniku. | Zgodne z zachowaniem dostępności etapu 005. |
| Zmiana danych | Każda zmiana usuwa nieaktualny wynik i przywraca neutralną instrukcję. | Wynik nigdy nie jest przedstawiany jako zgodny z innymi widocznymi danymi. |
| Responsywność | Układy pozostają jednokolumnowe domyślnie, a dopiero istniejące media queries tworzą dwie kolumny. Długie treści mogą się łamać, a tabela przewija się wyłącznie we własnym kontenerze. | Główna strona mieści się od 320 px bez poziomego przewijania. |

## Stany interfejsu

| Stan | Warunek | Wymagane zachowanie |
| --- | --- | --- |
| Początkowy | Pierwsze wyświetlenie lub edycja danych po wyniku. | Widoczna neutralna instrukcja „Uzupełnij dane…”, brak kart wyniku i tabeli. |
| Błąd | Użytkownik próbuje przesłać niepoprawny formularz. | Widoczny komunikat podsumowujący z `role="alert"`, błędy Zod przy polach, fokus na pierwszym błędnym polu, brak wyniku. |
| Obliczony | Formularz jest poprawny i silnik zwraca wynik. | Widoczne pięć kart oraz harmonogram; fokus przechodzi do nagłówka wyniku; komunikat instrukcji znika. |

Komunikaty są neutralne: nie oceniają sytuacji finansowej użytkownika i nie zawierają słów o akceptacji, odmowie ani zdolności kredytowej.

## Responsywność i dostępność

- Przy 320 px treść formularza, komunikat stanu i karty wyników są jednokolumnowe; elementy nie wymuszają poziomego przewijania strony.
- Przewijanie poziome pozostaje celowe wyłącznie dla tabeli harmonogramu w jej nazwanym, fokusowalnym kontenerze.
- Od 48rem pola i karty mogą układać się w dwie kolumny, a od 64rem formularz oraz wyniki mogą występować obok siebie.
- Długie teksty instrukcji i zastrzeżeń mogą się łamać w obrębie kontenera.
- Widoczny fokus, etykiety, tekstowe błędy i semantyka z etapów 005–006 pozostają bez regresji.
- Stopka ze zastrzeżeniem edukacyjnym pozostaje obecna w każdym stanie aplikacji.

## Kontrola scenariuszy obliczeń

W ramach odbioru należy uruchomić istniejące testy silnika i UI dla następujących grup:

1. typowy kredyt oprocentowany z dochodem i zobowiązaniami;
2. kredyt z oprocentowaniem `0%` i zerowymi zobowiązaniami;
3. pojedyncza rata, wysokie oprocentowanie oraz duża kwota — objęte testami etapu 004;
4. błędne, puste oraz dziesiętne wartości formularza — objęte etapami 002 i 005.

Nie dodaje się niezależnych wzorów ani ręcznych przeliczeń do komponentów UI.

## Testy

Testy komponentowe muszą potwierdzać:

- instrukcję i brak wyniku w stanie początkowym;
- `role="alert"`, błędy pól i fokus po nieudanym przesłaniu;
- zniknięcie instrukcji oraz widoczność wyniku i harmonogramu po sukcesie;
- powrót do instrukcji oraz ukrycie wyniku i harmonogramu po zmianie danych;
- obecność zastrzeżenia edukacyjnego w renderze aplikacji.

Ponadto `npm run build`, `npm run lint`, `npm run format:check` oraz `npm run test` muszą zakończyć się powodzeniem.

## Kryteria akceptacji

- [x] Istnieją neutralne i dostępne stany: początkowy, błąd oraz obliczony wynik.
- [x] Błędne przesłanie pokazuje komunikat `role="alert"`, błędy Zod i przenosi fokus do pierwszego błędnego pola.
- [x] Sukces pokazuje aktualne wyniki i harmonogram oraz zachowuje zarządzanie fokusem.
- [x] Edycja danych ukrywa wynik i harmonogram, po czym przywraca instrukcję.
- [x] Widok nie wymusza poziomego przewijania strony przy 320 px; wyjątkiem jest świadomie przewijana tabela.
- [x] Widoki tabletowy i desktopowy zachowują czytelny układ wielokolumnowy.
- [x] Zastrzeżenie edukacyjne jest obecne niezależnie od stanu kalkulatora.
- [x] Nie dodano persystencji, sieci, nowej logiki finansowej ani funkcji spoza zakresu.
- [x] Testy stanów UI i dotychczasowe testy obliczeń przechodzą.
- [x] `npm run build`, `npm run lint`, `npm run format:check` i `npm run test` kończą się powodzeniem.

## Plan implementacji

1. Dodać prezentacyjny komponent stanu i lokalny stan widoku w `LoanCalculator`.
2. Przekazać do formularza obsługę błędnego przesłania bez duplikowania walidacji Zod.
3. Dodać style instrukcji, alertu i zabezpieczenia długich tekstów na wąskich ekranach.
4. Rozszerzyć testy kalkulatora i aplikacji o wszystkie trzy stany oraz zastrzeżenie.
5. Wykonać kontrolę źródeł, testów, formatowania, lintowania i buildu.
