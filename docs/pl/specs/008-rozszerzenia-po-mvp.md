# Specyfikacja 008 — Rozszerzenia po MVP

## Status

Zaimplementowano 26.07.2026. Zweryfikowano komendami `build`, `lint`, `format:check` i `test`.

## Cel

Rozbudować lokalną, edukacyjną symulację o raty malejące, nadpłaty skracające spłatę, porównanie wariantów, wykresy, eksport i lokalne zapisywanie symulacji. Backend pozostaje poza zakresem.

## Zakres

- `calculateAdvancedLoan` oblicza harmonogram rat równych albo malejących, z nadpłatą jednorazową i cykliczną.
- Nadpłaty zmniejszają saldo i mogą skrócić faktyczny okres spłaty.
- Widok porównuje pierwszą ratę oraz koszt wariantu równego i malejącego.
- Wykres liniowy prezentuje saldo, a kołowy proporcję kapitału i odsetek.
- CSV wykorzystuje Papa Parse, a PDF jsPDF; eksport odbywa się wyłącznie lokalnie.
- Przycisk zapisuje maksymalnie 10 ostatnich wejść w `localStorage` pod wersjonowanym kluczem.

## Poza zakresem

- Backend, konto użytkownika, synchronizacja, API bankowe, oferta lub rekomendacja finansowa.
- Zmiana istniejącego silnika rat równych, walidacji bazowego formularza oraz kontraktów etapów 002–007.
- Nadpłata zmniejszająca ratę, zmienne oprocentowanie, prowizje, RRSO i daty kalendarzowe.

## Zasady

- Nowy silnik używa `decimal.js`, zwraca ten sam kształt harmonogramu i jest niezależny od Reacta.
- Rata malejąca ma stałą bazową część kapitałową i malejące odsetki.
- Nadpłata jest ograniczona do pozostałego salda; po spłacie pętla harmonogramu kończy się.
- Zapis, eksport i wykresy nigdy nie wysyłają danych po sieci.
- Komunikaty pozostają edukacyjne i nie oceniają zdolności kredytowej.

## Testy

- Test silnika potwierdza malejące odsetki oraz saldo zero dla rat malejących.
- Test nadpłat potwierdza krótszy okres i niższe odsetki względem wariantu bez nadpłat.
- Dotychczasowe testy formularza, harmonogramu i obliczeń pozostają zielone.

## Kryteria akceptacji

- [x] Dostępne są raty malejące i porównanie z ratami równymi.
- [x] Jednorazowa i cykliczna nadpłata skracają symulowany okres spłaty.
- [x] Dostępne są wykres salda oraz struktury kapitału i odsetek.
- [x] Harmonogram można wyeksportować lokalnie do CSV i PDF.
- [x] Symulacje są zapisywane lokalnie w ograniczonej historii `localStorage`.
- [x] Backend nie został dodany.
- [x] `npm run build`, `npm run lint`, `npm run format:check` i `npm run test` kończą się powodzeniem.
