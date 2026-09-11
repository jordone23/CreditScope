# Uruchomienie pełnej aplikacji CreditScope na nowym urządzeniu

Ta instrukcja pozwala odtworzyć aplikację z repozytorium GitHub. Podstawowy kalkulator działa lokalnie bez usługi Supabase. Konfiguracja Supabase jest potrzebna wyłącznie dla kont użytkowników i zapisywania analiz.

## 1. Wymagania

- Git,
- Node.js 20 lub nowszy,
- npm,
- opcjonalnie: własny projekt Supabase, jeżeli mają działać konta i zapisane analizy.

## 2. Pobranie i uruchomienie kalkulatora

```bash
git clone https://github.com/jordone23/CreditScope.git
cd CreditScope
npm ci
npm run dev
```

Po uruchomieniu terminal pokaże lokalny adres aplikacji, zwykle `http://localhost:5173`.

Polecenie `npm ci` instaluje dokładne wersje zależności zapisane w `package-lock.json`, dzięki czemu środowisko jest powtarzalne.

## 3. Sprawdzenie instalacji

Przed wdrożeniem lub dalszą pracą można uruchomić:

```bash
npm run test
npm run lint
npm run build
```

`npm run build` tworzy produkcyjną wersję statycznej aplikacji w katalogu `dist`.

## 4. Opcjonalnie: pełna wersja z kontami i zapisanymi analizami

### Utwórz projekt Supabase

W panelu Supabase utwórz nowy projekt. W sekcji ustawień API skopiuj:

- adres projektu (`Project URL`),
- klucz `Publishable` albo, w starszych projektach, `anon`.

Nie używaj w aplikacji przeglądarkowej klucza `service_role`.

### Utwórz lokalny plik środowiskowy

Skopiuj szablon `.env.example` jako `.env.local` i uzupełnij wartości:

```env
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=twoj_klucz_publishable_lub_anon
```

Plik `.env.local` jest ignorowany przez Git i nie może zostać wysłany do repozytorium.

### Zastosuj migracje bazy danych

Migracje w katalogu `supabase/migrations/` tworzą tabele profili, zapisanych analiz i pozycji harmonogramu, a także reguły RLS oraz automatyczne tworzenie profilu po rejestracji.

W nowym projekcie Supabase wykonaj pliki SQL kolejno według ich nazw:

1. `202607270001_accounts_and_saved_analyses.sql`
2. `202608120001_username_availability.sql`
3. `202608130001_open_saved_analyses_and_unique_titles.sql`

Można wkleić ich zawartość po kolei do **SQL Editor** w panelu Supabase albo zastosować je przez Supabase CLI. Jeśli korzystasz z projektu Supabase, na którym te migracje zostały już zastosowane, nie uruchamiaj ich drugi raz.

Po zmianie `.env.local` zatrzymaj i uruchom ponownie serwer poleceniem `npm run dev`.

## 5. Co będzie działać bez Supabase

Bez konfiguracji Supabase nadal dostępne są obliczenia kredytowe, harmonogram spłat i symulacje. Niedostępne będą tylko funkcje zależne od konta: rejestracja, logowanie i trwałe zapisywanie analiz.

## 6. Co trafia do GitHub

Repozytorium zawiera kod źródłowy, testy, konfigurację, migracje i dokumentację. Nie zawiera zależności `node_modules`, wyników budowania, logów ani lokalnych danych środowiskowych.
