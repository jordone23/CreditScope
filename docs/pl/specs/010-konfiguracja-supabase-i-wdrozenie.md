# Specyfikacja 010 — Konfiguracja Supabase i wdrożenie połączenia

## Status

Zaimplementowano dla środowiska lokalnego. `.env.local` zawiera adres projektu i klucz publikowalny, połączenie z Supabase Auth odpowiada poprawnie, a podstawowa migracja jest widoczna przez Data API. Aktualizacja 13.08.2026 dodaje migrację `202608130001_open_saved_analyses_and_unique_titles.sql`, którą należy wykonać w docelowym projekcie przed użyciem unikalnych nazw analiz.

## Cel

Skonfigurować jeden projekt Supabase tak, aby aplikacja CreditScope uruchomiona lokalnie oraz po wdrożeniu na hostingu automatycznie łączyła się z tą samą bazą danych. Użytkownik ma móc zarejestrować konto, zalogować się i zapisać własną analizę.

## Zakres

### W zakresie

- utworzenie projektu Supabase i wybranie regionu;
- jednorazowe wykonanie migracji schematu, funkcji SQL i polityk RLS;
- skonfigurowanie uwierzytelniania e-mail/hasło;
- dodanie publicznego adresu projektu i klucza publikowalnego do zmiennych środowiskowych;
- konfiguracja dozwolonych adresów URL dla środowiska lokalnego i produkcyjnego;
- weryfikacja rejestracji, logowania, zapisu, odczytu i usunięcia własnej analizy;
- kontrola, że dane jednego użytkownika nie są widoczne dla innego.

### Poza zakresem

- zmiana interfejsu, modelu obliczeń lub struktury tabel;
- własny serwer backendowy, Edge Functions i integracje z dostawcami logowania społecznościowego;
- mechanizm odzyskiwania hasła, MFA i zmiana e-maila;
- migracja danych z innego systemu;
- automatyczne zakładanie konta Supabase przez aplikację.

## Warunki wstępne

1. Właściciel projektu ma konto w Supabase i uprawnienia do tworzenia projektu.
2. Repozytorium zawiera migracje [202607270001_accounts_and_saved_analyses.sql](../../supabase/migrations/202607270001_accounts_and_saved_analyses.sql), [202608120001_username_availability.sql](../../supabase/migrations/202608120001_username_availability.sql) i [202608130001_open_saved_analyses_and_unique_titles.sql](../../supabase/migrations/202608130001_open_saved_analyses_and_unique_titles.sql).
3. Lokalnie jest dostępne Node.js 20+ i zależności projektu są zainstalowane.
4. Znany jest docelowy adres produkcyjny aplikacji. Jeżeli hosting nie został jeszcze wybrany, do czasu wdrożenia wystarczy adres lokalny.

## Dane konfiguracyjne

| Zmienna | Źródło | Poufność | Zastosowanie |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API | publiczna | Adres API projektu, np. `https://<project-ref>.supabase.co`. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings → API | publiczny klucz kliencki | Uwierzytelnione połączenie przeglądarki przy ochronie RLS. |
| `SUPABASE_SECRET_KEY` / `service_role` | Supabase Dashboard | tajna | **Nie jest używana przez Vite ani nie może być umieszczona w `.env.local` z prefiksem `VITE_`.** Jest poza zakresem tego etapu. |

Klucz publikowalny jest widoczny w kodzie przeglądarki z założenia. Jego bezpieczeństwo opiera się na prawidłowo włączonym RLS i politykach migracji, a nie na ukrywaniu klucza. Klucza tajnego nigdy nie wolno przekazywać do klienta ani zapisywać w repozytorium.

## Przebieg konfiguracji

### 1. Utworzenie projektu

1. Utwórz nowy projekt w Supabase.
2. Wybierz region najbliższy użytkownikom aplikacji; dla odbiorców w Polsce preferowany jest region UE.
3. Zapisz hasło bazy w menedżerze haseł. Nie będzie potrzebne aplikacji klienckiej.
4. Po przygotowaniu projektu przejdź do ustawień API i skopiuj `Project URL` oraz `Publishable key`.

### 2. Wykonanie migracji bazy

1. W Supabase Dashboard otwórz SQL Editor.
2. W świeżym projekcie uruchom migracje po kolei według nazwy: `202607270001_accounts_and_saved_analyses.sql`, `202608120001_username_availability.sql` i `202608130001_open_saved_analyses_and_unique_titles.sql`. W istniejącym projekcie, w którym działają wcześniejsze elementy, uruchom wyłącznie brakujące migracje.
3. Potwierdź powstanie tabel `profiles`, `saved_analysis` i `analysis_schedule_item` w schemacie `public`.
4. Potwierdź włączenie RLS dla wszystkich trzech tabel oraz obecność funkcji `save_analysis` i `soft_delete_analysis`.

Migracja tworzy profil użytkownika automatycznie po utworzeniu rekordu przez Supabase Auth. Tabela `auth.users` i dane haseł pozostają zarządzane przez Supabase.

### 3. Konfiguracja Auth

1. W Authentication → Providers włącz dostawcę e-mail/hasło.
2. Na etapie testów zalecane jest pozostawienie włączonego potwierdzania adresu e-mail, aby sprawdzić pełny przepływ rejestracji.
3. W Authentication → URL Configuration dodaj do `Site URL` adres środowiska produkcyjnego po jego utworzeniu.
4. Dodaj do listy Redirect URLs przynajmniej:

```text
http://localhost:5173
http://127.0.0.1:5173
https://<domena-produkcyjna>
```

Jeśli port lokalnego serwera Vite jest inny, należy dodać właściwy adres. Nie używać ogólnego wpisu dopuszczającego niekontrolowane domeny.

### 4. Konfiguracja lokalna

1. Skopiuj `.env.example` do nowego pliku `.env.local`.
2. Uzupełnij plik lokalny:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

3. Sprawdź, że `.env.local` nie jest śledzony przez Git.
4. Zatrzymaj i uruchom ponownie serwer Vite, ponieważ zmienne `VITE_*` są odczytywane podczas startu.
5. Otwórz aplikację. W nagłówku powinien pojawić się panel „Zaloguj się”. Jego brak oznacza brak lub błędną konfigurację zmiennych.

### 5. Konfiguracja hostingu

1. Dodaj te same dwie zmienne (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) w ustawieniach środowiskowych wybranego hostingu.
2. Nie dodawaj klucza tajnego Supabase do zmiennych klienta, artefaktu builda ani repozytorium.
3. Wykonaj nowy build i wdrożenie aplikacji.
4. Dopisz rzeczywisty adres produkcyjny do konfiguracji URL w Supabase.
5. Przetestuj rejestrację na adresie produkcyjnym w prywatnym oknie przeglądarki.

## Scenariusz testów odbiorowych

| Nr | Scenariusz | Oczekiwany rezultat |
| --- | --- | --- |
| 1 | Uruchomienie lokalne z poprawnym `.env.local` | Panel logowania jest widoczny, a kalkulator nadal działa. |
| 2 | Rejestracja unikalnym e-mailem, nazwą i hasłem 12+ znaków | W `auth.users` powstaje użytkownik, a w `profiles` profil z tą samą wartością UUID. |
| 3 | Logowanie po potwierdzeniu e-maila | Nagłówek wskazuje zalogowany adres i oferuje wylogowanie. |
| 4 | Obliczenie i zapis analizy | Powstaje rekord `saved_analysis` oraz komplet pozycji `analysis_schedule_item`. |
| 5 | Odświeżenie strony po zalogowaniu | Analiza jest widoczna na liście zapisanych analiz użytkownika. |
| 6 | Kliknięcie tytułu zapisanej analizy | Formularz jest automatycznie wypełniony, a zapisany wynik i harmonogram są pokazane bez ponownego liczenia. |
| 7 | Próba drugiego zapisu o tym samym tytule | Zapis jest odrzucony komunikatem „Istnieje już analiza o tej nazwie. Wybierz inną.” |
| 8 | Usunięcie analizy | Rekord znika z listy i otrzymuje `deleted_at`; harmonogram pozostaje powiązany do czasu trwałego usunięcia. |
| 9 | Próba dostępu drugim kontem | Drugie konto nie widzi, nie modyfikuje, nie otwiera ani nie usuwa analizy pierwszego konta. |
| 10 | Wyłączenie lub usunięcie zmiennych środowiskowych | Aplikacja nie wykonuje żądań do Supabase, a funkcje kont są ukryte; kalkulator działa lokalnie. |

## Kryteria akceptacji

- [ ] Projekt Supabase istnieje, a region i właściciel projektu są udokumentowane poza repozytorium.
- [ ] Migracja została wykonana bez błędu tylko raz w docelowym projekcie.
- [ ] Wszystkie tabele aplikacyjne mają aktywne RLS, a klucz tajny nie jest dostępny w aplikacji klienckiej.
- [ ] `.env.local` jest lokalny i ignorowany przez Git; `.env.example` zawiera wyłącznie puste nazwy zmiennych.
- [ ] Aplikacja lokalna automatycznie łączy się z Supabase po restarcie serwera i dodaniu poprawnych wartości środowiskowych.
- [ ] Rejestracja, logowanie, wylogowanie, zapis, odczyt i logiczne usunięcie działają dla właściciela analizy.
- [ ] Uruchomiono migrację unikalnych tytułów; właściciel może otworzyć zapisany snapshot analizy, a drugi aktywny zapis z tym samym tytułem jest odrzucany.
- [ ] Test z dwoma kontami potwierdza izolację danych.
- [ ] Aplikacja wdrożona na hostingu łączy się z tym samym projektem Supabase i ma skonfigurowany produkcyjny URL przekierowania.

## Ryzyka i zasady bezpieczeństwa

- Każdy adres i klucz z prefiksem `VITE_` staje się częścią aplikacji przeglądarkowej. Używamy tylko klucza publikowalnego, nigdy tajnego.
- Nie wolno wyłączać RLS tylko dlatego, że aplikacja nie może odczytać danych — należy poprawić konkretną politykę lub konfigurację sesji.
- Wartości wyników analizy są snapshotem edukacyjnej symulacji. Jeśli w przyszłości wynik miałby służyć decyzjom biznesowym, obliczenia i ich walidację należy przenieść do zaufanej warstwy serwerowej.
- Projekt Supabase powinien mieć skonfigurowaną politykę kopii zapasowych i retencji zgodnie z polityką prywatności produktu.
- Zmiana domeny hostingu wymaga uaktualnienia Redirect URLs w Supabase przed publikacją.

## Rezultat etapu

Po spełnieniu kryteriów aplikacja nie wymaga ręcznego „łączenia” z bazy z poziomu interfejsu: po starcie automatycznie używa zmiennych środowiskowych, a sesja Supabase decyduje o dostępie do konta i analiz.
