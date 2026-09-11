# Specyfikacja 001 — Inicjalizacja i konfiguracja projektu

## Status

Zaimplementowano 14.07.2026. Zweryfikowano komendami `build`, `lint`, `format:check` i `test`.

## Cel

Przygotować powtarzalną, lokalną bazę aplikacji **CreditScope**: responsywnego, edukacyjnego kalkulatora kredytowego działającego w całości w przeglądarce. Po zakończeniu etapu zespół ma móc bez przebudowy fundamentów dodawać model danych, walidację, silnik obliczeń, formularz, wyniki oraz harmonogram spłat.

Ten etap nie implementuje jeszcze kalkulatora ani nie zapisuje danych użytkownika.

## Kontekst produktu

CreditScope pozwoli symulować kredyt z ratami równymi i pokazywać orientacyjny wpływ raty wraz z istniejącymi zobowiązaniami na miesięczny dochód netto. Aplikacja ma charakter wyłącznie edukacyjny i informacyjny — nie może sugerować decyzji kredytowej, rekomendacji finansowej ani oferty bankowej.

Pierwsze MVP będzie aplikacją kliencką bez API, kont, bazy danych i trwałego zapisu symulacji. Granica ta ma pozostać czytelna w strukturze projektu, aby przyszłe dodanie `localStorage`, eksportu lub backendu nie wymagało mieszania ich z logiką finansową.

## Zakres

### W zakresie

- Projekt Vite z Reactem i TypeScriptem.
- Tailwind CSS jako wspólny system stylowania.
- ESLint i Prettier wraz ze zgodną konfiguracją i skryptami kontroli jakości.
- Vitest oraz podstawowe środowisko do testów komponentów z React Testing Library.
- Struktura katalogów gotowa na podział według funkcji oraz izolowanie logiki finansowej od UI.
- Globalne style, tokeny wizualne i responsywny szkielet strony.
- Jedno źródło stałych oraz funkcji formatowania kwot i procentów dla lokalizacji `pl-PL`.
- Widoczne, stałe zastrzeżenie edukacyjne w układzie aplikacji.

### Poza zakresem

- Pola formularza, Zod i React Hook Form.
- Typy domenowe kredytu, wzory, `decimal.js`, obliczenia i harmonogram.
- Karty wyników, wykresy, tabela rat, eksport oraz `localStorage`.
- Backend, uwierzytelnianie, baza danych, analityka i integracje z bankami.
- Ocena zdolności kredytowej lub jakakolwiek kategoryzacja użytkownika jako „kwalifikującego się” do kredytu.

## Decyzje architektoniczne

| Obszar | Decyzja | Uzasadnienie |
| --- | --- | --- |
| Uruchamianie | SPA Vite + React + TypeScript, bez serwera aplikacyjnego | MVP nie potrzebuje danych trwałych ani obliczeń po stronie serwera. |
| Logika biznesowa | Przyszłe obliczenia należą do `src/lib/finance`, bez zależności od Reacta | Ułatwia niezależne testy i chroni precyzję obliczeń przed szczegółami widoku. |
| Organizacja UI | Funkcje produktu są grupowane w `src/features`, a elementy współdzielone w `src/components` | Formularz, wyniki i harmonogram będą mogły rozwijać się niezależnie. |
| Style | Tailwind CSS + minimalne style globalne | Zapewnia spójność i szybką pracę nad responsywnością. |
| Formatowanie | `Intl.NumberFormat`, skonfigurowany centralnie dla `pl-PL` i PLN | Zapis prezentacji jest jednolity; obliczenia nie zależą od formatu tekstowego. |
| Testy | Vitest dla modułów i React Testing Library dla komponentów | Testowane jest zachowanie użytkownika i czysta logika, a nie szczegóły implementacji. |
| Dostępność | Semantyczny HTML i obsługa klawiatury są wymaganiami bazowymi | Późniejsze formularze i tabela będą budowane na dostępnym fundamencie. |

## Docelowa struktura po tym etapie

```text
src/
├── app/
│   ├── App.tsx
│   └── styles.css
├── components/
│   └── layout/
│       ├── AppShell.tsx
│       ├── Header.tsx
│       └── EducationalDisclaimer.tsx
├── features/
│   ├── calculator/       # zarezerwowane na formularz i wyniki
│   └── schedule/         # zarezerwowane na harmonogram
├── lib/
│   ├── finance/          # zarezerwowane na obliczenia niezależne od Reacta
│   └── formatters.ts
├── types/                # zarezerwowane na typy domenowe
├── test/
│   └── setup.ts
└── main.tsx

tests/
└── unit/                 # przyszłe testy modułów bez Reacta
```

Puste katalogi mogą zostać utworzone dopiero z pierwszym plikiem, jeśli narzędzia projektu ich nie zachowują. Nie należy dodawać sztucznych komponentów biznesowych tylko po to, aby wypełnić strukturę.

## Wymagania funkcjonalne

1. `npm run dev` uruchamia aplikację lokalnie.
2. Strona główna zawiera semantyczny nagłówek, główny obszar treści i stopkę lub sekcję zastrzeżenia.
3. Nagłówek identyfikuje produkt jako CreditScope i krótko komunikuje jego funkcję: symulację kredytu oraz orientacyjnej analizy obciążenia budżetu.
4. Główna treść wyświetla neutralny stan startowy informujący, że kalkulator zostanie udostępniony w następnym etapie. Nie może zawierać pozornie działających pól ani fikcyjnych wyników.
5. Zastrzeżenie zawiera sens z README: wyniki są uproszczoną symulacją edukacyjną i nie są ofertą bankową, rekomendacją finansową ani rzeczywistą oceną zdolności kredytowej.
6. Układ jest czytelny od szerokości 320 px, bez poziomego przewijania; na większych ekranach ma ograniczoną szerokość treści i wygodne odstępy.
7. Wszystkie przyszłe wartości pieniężne i procentowe muszą korzystać z eksportów `formatCurrencyPLN` i `formatPercentagePL` z `src/lib/formatters.ts`; komponenty nie tworzą własnych formatterów `Intl`.

## Kontrakt formatowania

Moduł `src/lib/formatters.ts` udostępnia co najmniej:

```ts
export function formatCurrencyPLN(value: number): string;
export function formatPercentagePL(value: number): string;
```

- `formatCurrencyPLN(1234.5)` zwraca wartość w formacie `pl-PL`, walucie PLN i z dwoma miejscami po przecinku.
- `formatPercentagePL(7.5)` interpretuje argument jako wartość procentową, a nie ułamek, i wyświetla `7,5%` (dopuszczalne są spacje typograficzne generowane przez `Intl`).
- Kontrakt ma charakter prezentacyjny. Po wprowadzeniu `decimal.js` w etapie 3 adapter wywołujący formatter otrzyma bezpiecznie skonwertowaną wartość wyświetlaną; formatter nie jest miejscem obliczeń ani zaokrągleń finansowych.

## Wymagania jakościowe

- TypeScript działa w trybie ścisłym; nie należy maskować błędów przez `any`.
- Kod źródłowy, komunikaty użytkownika i dokumentacja są po polsku; identyfikatory programistyczne są po angielsku.
- ESLint i Prettier nie zgłaszają konfliktów. Automatyczne formatowanie nie może ukrywać błędów lintowania.
- Testy działają w środowisku DOM i mają skonfigurowane matchery `@testing-library/jest-dom`.
- Aplikacja nie wykonuje żądań sieciowych dla działania ekranu startowego.
- Interaktywne elementy, jeśli pojawią się w szkielecie, są natywnymi kontrolkami HTML lub mają równoważną obsługę klawiatury i widoczny fokus.
- Tekst i elementy interfejsu zapewniają kontrast zgodny co najmniej z WCAG AA.

## Skrypty projektu

W `package.json` muszą być dostępne co najmniej:

| Skrypt | Oczekiwany rezultat |
| --- | --- |
| `dev` | uruchomienie lokalnego środowiska Vite |
| `build` | sprawdzenie typów i produkcyjna kompilacja aplikacji |
| `lint` | analiza statyczna kodu źródłowego |
| `format` | formatowanie plików przez Prettier |
| `format:check` | weryfikacja formatowania bez zapisu |
| `test` | jednorazowe uruchomienie wszystkich testów |

## Kryteria akceptacji

Etap jest ukończony, gdy:

- [ ] Projekt instaluje zależności i uruchamia się komendą opisną w README.
- [ ] `npm run build`, `npm run lint`, `npm run format:check` oraz `npm run test` kończą się powodzeniem.
- [ ] Ekran startowy ma nagłówek, główną treść i zastrzeżenie zgodne z celem edukacyjnym produktu.
- [ ] Widok jest użyteczny na szerokości 320 px oraz na ekranie desktopowym, bez poziomego scrolla strony.
- [ ] `formatCurrencyPLN` i `formatPercentagePL` mają testy jednostkowe potwierdzające polską lokalizację i semantykę procentu.
- [ ] Co najmniej jeden test komponentu potwierdza widoczność nazwy CreditScope oraz zastrzeżenia.
- [ ] Nie ma jeszcze kodu obliczeń, formularza, fałszywych wyników ani zależności od backendu.
- [ ] README opisuje uruchomienie projektu oraz jego edukacyjny charakter.

## Plan implementacji

1. Zainicjalizować Vite z szablonem React + TypeScript i usunąć demonstracyjne zasoby oraz przykładowy licznik.
2. Dodać i skonfigurować Tailwind CSS, ESLint, Prettier, Vitest oraz React Testing Library; utworzyć wymagane skrypty.
3. Utworzyć szkielet katalogów i skonfigurować punkt wejścia, style globalne oraz aliasy importów tylko wtedy, gdy są rzeczywiście wykorzystywane.
4. Dodać `AppShell`, nagłówek, neutralny stan startowy i zastrzeżenie edukacyjne.
5. Dodać centralne formatery oraz ich testy, mimo że UI nie prezentuje jeszcze obliczeń.
6. Uzupełnić README o wymagania środowiskowe i komendy projektu.
7. Uruchomić pełny zestaw kontroli z kryteriów akceptacji.

## Ryzyka i zasady na kolejne etapy

- JavaScriptowe `number` jest wystarczające jedynie dla formatterów i wartości demonstracyjnych. Od etapu silnika obliczeń wartości pieniężne i pośrednie obliczenia muszą przejść do `decimal.js`.
- Wskaźnik obciążenia dochodu ma być opisywany jako orientacyjna informacja, nigdy jako werdykt o zdolności kredytowej.
- Raty malejące, nadpłaty, wykresy i eksport są rozszerzeniami; struktura tego etapu nie może wymuszać ich implementacji ani ograniczać do rat równych poza warstwą przyszłej logiki domenowej.
- Przyszła persystencja może należeć do osobnej warstwy/adaptora. Komponenty nie powinny bezpośrednio odczytywać ani zapisywać `localStorage`.

## Zależności od kolejnych specyfikacji

- Specyfikacja 002 zdefiniuje typy danych wejściowych i wynikowych oraz schemat walidacji Zod.
- Specyfikacja 003 ustali reguły obliczeń, zaokrągleń i harmonogramu z użyciem `decimal.js`.
- Specyfikacja 004 rozszerzy testy o scenariusze finansowe, a specyfikacja 005 zastąpi stan startowy formularzem i wynikami.
