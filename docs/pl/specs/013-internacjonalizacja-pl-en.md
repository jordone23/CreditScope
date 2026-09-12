# Specyfikacja 013 — Internacjonalizacja interfejsu PL / EN

## Status

Wdrożone w aplikacji. Interfejs obsługuje polski (`pl-PL`) i angielski (`en-GB`), a wybór użytkownika jest zapamiętywany.

## Cel

Udostępnić przełącznik języka `PL | EN` w nagłówku oraz kontrolowaną wersję angielską CreditScope. Zmiana języka ma modyfikować wyłącznie prezentację, bez zmiany danych scenariusza finansowego, harmonogramu lub zapisanej analizy.

## Założenia

- Teksty są przechowywane lokalnie w słownikach i18next; aplikacja nie wysyła treści ani danych użytkownika do zewnętrznego API tłumaczeniowego.
- Angielski jest językiem pierwszej wizyty, a wybór w `localStorage` ma pierwszeństwo przy kolejnych uruchomieniach.
- Kontrolka używa dokładnie oznaczeń `PL` i `EN`, bez flag, jako dostępna grupa natywnych przycisków.
- `document.documentElement.lang` przyjmuje odpowiednio `pl-PL` lub `en-GB`.
- Formatowanie kwot i procentów stosuje aktywne locale, przy zachowaniu waluty `PLN` i niezmienionych wartości liczbowych.

## Zakres

1. Nagłówek, opis marki, zastrzeżenie edukacyjne i przełącznik języka.
2. Formularz symulacji: etykiety, podpowiedzi, walidacja, stany błędu i przycisk obliczenia.
3. Wyniki, harmonogram spłat, opisy dostępności i formatowanie wartości.
4. Rozszerzona symulacja, wykresy, nadpłaty i eksporty.
5. Uwierzytelnianie, zapisane analizy oraz komunikaty usługowe.

## Architektura

```text
src/i18n/config.ts       konfiguracja i18next oraz zapis wybranego języka
src/i18n/resources.ts    równoległe słowniki pl/en
LanguageSwitcher.tsx     kontrolka PL | EN
formatters.ts            formatowanie zależne od aktywnego locale
```

Słowniki obu języków muszą mieć identyczny, niepusty zestaw kluczy. Test regresji porównuje ich strukturę.

## Kryteria akceptacji

- [x] Zmiana PL/EN nie resetuje danych formularza ani wyniku.
- [x] Wybór języka jest zachowywany lokalnie.
- [x] Teksty, etykiety dostępności i formatowanie wartości są zależne od locale.
- [x] Brak automatycznego tłumaczenia w runtime i brak klucza API tłumaczenia w kliencie.

