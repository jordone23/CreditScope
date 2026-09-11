# CreditScope

Responsywna aplikacja webowa do edukacyjnej symulacji kredytu oraz orientacyjnej analizy obciążenia domowego budżetu.

## Dane podawane przez użytkownika

Użytkownik może wprowadzić:

- kwotę kredytu,
- oprocentowanie nominalne,
- okres spłaty,
- miesięczny dochód netto,
- miesięczne zobowiązania finansowe.

## Wyniki obliczeń

System będzie prezentował:

- wysokość miesięcznej raty,
- całkowitą kwotę do spłaty,
- całkowity koszt kredytu,
- sumę zapłaconych odsetek,
- orientacyjny wskaźnik obciążenia dochodu,
- szczegółowy harmonogram spłat z podziałem na część kapitałową i odsetkową.

## Planowane rozszerzenia

W kolejnych etapach aplikacja może zostać rozbudowana o:

- porównanie rat równych i malejących,
- symulację wcześniejszej spłaty,
- symulację nadpłat cyklicznych i jednorazowych,
- porównanie kilku wariantów kredytu,
- wykres zmiany salda zadłużenia,
- wykres udziału kapitału i odsetek,
- eksport harmonogramu do pliku CSV lub PDF,
- zapisywanie przeprowadzonych symulacji.

## Cel edukacyjny

Projekt pozwoli przećwiczyć:

- implementację wzorów finansowych,
- precyzyjne operowanie wartościami pieniężnymi,
- walidację danych wejściowych,
- obsługę przypadków brzegowych,
- tworzenie testów jednostkowych,
- generowanie harmonogramów spłat,
- wizualizację danych finansowych,
- projektowanie czytelnego interfejsu aplikacji webowej.

## Wartość projektu w portfolio

Projekt będzie czytelnym przykładem połączenia kompetencji programistycznych, finansowych i analitycznych. Może być prezentowany jako aplikacja związana z bankowością detaliczną, fintechiem oraz analizą produktów kredytowych.

## Uruchomienie lokalne

Wymagany jest Node.js w wersji 20 lub nowszej oraz npm.

```bash
npm install
npm run dev
```

Po uruchomieniu Vite wyświetli lokalny adres aplikacji. Dostępne są też komendy jakościowe:

```bash
npm run build
npm run lint
npm run format:check
npm run test
```


## Zastrzeżenie

> Aplikacja ma charakter wyłącznie edukacyjny i informacyjny. Prezentowane wyniki są uproszczonymi symulacjami i nie stanowią oferty bankowej, rekomendacji finansowej ani rzeczywistej oceny zdolności kredytowej. Faktyczna decyzja kredytowa zależy od zasad, modeli ryzyka i procedur stosowanych przez konkretną instytucję finansową.
