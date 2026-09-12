# Specyfikacja 011 — Usprawnione logowanie i rejestracja

## Status

Zaimplementowano i wdrożono 12.08.2026. Migracja `202608120001_username_availability.sql` działa w docelowym projekcie Supabase: funkcja zwraca wynik dostępności dla poprawnej nazwy oraz bezpiecznie odrzuca niepoprawny format.

## Cel

Usprawnić rejestrację i logowanie do CreditScope tak, aby użytkownik otrzymywał zrozumiałą, dostępną i szybką informację zwrotną. System ma weryfikować dostępność unikalnej nazwy użytkownika w trakcie wpisywania oraz zachowywać ochronę przed enumeracją kont po adresie e-mail i podczas logowania.

## Uzasadnienie i stan obecny

Obecna migracja tworzy tabelę `public.profiles` z kolumną `username`. Podczas rejestracji aplikacja przesyła `username` do `auth.users.raw_user_meta_data`, a trigger kopiuje go do `profiles.username`. Konflikt unikalnego `username` jest jednak wykrywany dopiero przez trigger podczas `signUp`, a interfejs pokazuje ogólny komunikat o błędzie.

Wzorzec rejestracji GitHub zawiera oddzielne pole nazwy użytkownika z jasno opisaną polityką formatu, a zajęta nazwa wymaga wybrania innej. [GitHub signup](https://github.com/signup), [GitHub Username Policy](https://docs.github.com/en/site-policy/other-site-policies/github-username-policy). Material i Fluent zalecają błąd przypisany do pola, opis sposobu naprawy oraz redundantne sygnały inne niż sam kolor. [Material text fields](https://m2.material.io/design/components/text-fields.html), [Fluent Field](https://fluent2.microsoft.design/components/web/react/core/field/usage).

## Decyzje projektowe

| Obszar | Decyzja |
| --- | --- |
| Unikalny identyfikator | `username` pozostaje unikalny, mały literowo-normalizowany identyfikator techniczny, używany np. w przyszłym profilu lub adresie `/u/<username>`. |
| Źródło prawdy | `username` jest przechowywany w `public.profiles`. `auth.users.raw_user_meta_data` może zawierać kopię przekazaną przy rejestracji, ale nie jest źródłem uprawnień. |
| Dostępność nazwy | Rejestracja sprawdza dostępność `username` asynchronicznie po wpisaniu; odpowiedź zawiera wyłącznie „dostępna” / „niedostępna”, nigdy dane właściciela. |
| E-mail | Brak sprawdzania dostępności e-maila w czasie rzeczywistym. Komunikaty rejestracji, resetu hasła i logowania pozostają celowo ogólne. |
| Ostateczna walidacja | Serwer/baza nadal stanowią ostateczne źródło prawdy. Zielony stan dostępności jest wskazówką UX, nie rezerwacją nazwy. |
| Potwierdzenie e-maila | Rejestracja kończy się ekranem „Sprawdź skrzynkę”; aplikacja oferuje ponowne wysłanie wiadomości po kontrolowanym czasie. |

## Przepływ rejestracji

### Pola

| Pole | Pomoc przed interakcją | Walidacja lokalna | Walidacja zdalna |
| --- | --- | --- | --- |
| Nazwa użytkownika | „3–50 znaków: litery, cyfry, `_`, `-`, `.`.” | Dozwolony format, bez spacji; małe litery są używane do kontroli unikalności. | Po poprawnej walidacji: dostępna / niedostępna. |
| E-mail | „Użyj adresu, do którego masz dostęp.” | Standardowy format e-mail. | Nie ujawnia, czy adres istnieje. |
| Hasło | „Minimum 12 znaków.” | Co najmniej 12 znaków, wskaźnik siły i opcja pokaż/ukryj hasło. | Supabase stosuje własne reguły bezpieczeństwa i może odrzucić hasło ujawnione w wycieku, jeśli ta ochrona jest włączona. |

### Zachowanie nazwy użytkownika w czasie rzeczywistym

1. Stan początkowy: tekst pomocniczy, bez zapytania do sieci.
2. W czasie wpisywania lokalny walidator od razu pokazuje błąd formatu, jeżeli jest błędny.
3. Dopiero po uzyskaniu lokalnie poprawnej wartości o długości co najmniej 3 znaków uruchamiany jest debounce `400–500 ms`.
4. W czasie zapytania widoczny jest neutralny wskaźnik „Sprawdzanie dostępności…”.
5. Po wyniku interfejs pokazuje:
   - ikonę sukcesu i tekst „Nazwa użytkownika jest dostępna”, albo
   - ikonę błędu i tekst „Ta nazwa użytkownika jest niedostępna. Wybierz inną.”
6. Stare odpowiedzi nie mogą nadpisywać nowszego wpisu (`AbortController` albo licznik żądań).
7. Przycisk utworzenia konta pozostaje nieaktywny, gdy nazwa jest lokalnie błędna, sprawdzana lub niedostępna. W przypadku chwilowego błędu sieci jest aktywny dopiero po ponowieniu weryfikacji; UI podaje przycisk „Sprawdź ponownie”.
8. Po wysłaniu formularza ostateczny konflikt jest obsługiwany jako: „Wybrana nazwa użytkownika stała się niedostępna. Wybierz inną.” — nawet gdy wcześniej była oznaczona jako dostępna. Eliminuje to problem równoczesnej rejestracji dwóch osób.

Wizualny stan nie może opierać się wyłącznie na zieleni/czerwieni: tekst, ikona, `aria-invalid`, opis skojarzony przez `aria-describedby` i komunikat `role="status"` są obowiązkowe. Błąd występuje po opuszczeniu pola albo po próbie wysłania, a znika natychmiast po naprawie wartości — zgodnie ze wzorcem komponentów formularza Material. [Material text fields](https://m1.material.io/components/text-fields.html)

### Kontrola dostępności po stronie Supabase

Nie wolno udostępniać anonimowym użytkownikom bezpośredniego `SELECT` na `profiles`. Zamiast tego należy utworzyć w migracji jedną, wąsko ograniczoną funkcję RPC:

```text
public.check_username_availability(p_username text)
→ { normalized_username: text, is_available: boolean }
```

Funkcja:

- normalizuje wartość tak samo jak formularz i ograniczenie bazy;
- zwraca `is_available: false` dla nieprawidłowego formatu, bez dodatkowych informacji;
- sprawdza jedynie istnienie pasującego `lower(username)`;
- nie zwraca UUID, adresu e-mail, daty utworzenia, wyświetlanej nazwy ani innych danych profilu;
- działa jako `SECURITY DEFINER` z jednoznacznym `search_path`, a wykonanie jest nadane tylko rolom `anon` i `authenticated`;
- nie tworzy rezerwacji nazwy.

Sprawdzenie dostępności nazwy jest świadomym kompromisem produktu: ujawnia, czy dana nazwa może zostać wybrana, podobnie jak w typowych serwisach z publicznymi identyfikatorami. Należy ograniczyć je do 10 sprawdzeń na minutę na IP/sesję w Edge Function lub na warstwie WAF, a przy nadużyciach wymagane jest CAPTCHA. Nie stosujemy analogicznego endpointu dla e-maila, ponieważ różnicowanie odpowiedzi uwierzytelniania może służyć enumeracji kont. [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Logowanie i obsługa stanów konta

### Widok logowania

- Nagłówek: „Zaloguj się do CreditScope”.
- Pola: e-mail i hasło; `autocomplete="email"` oraz `autocomplete="current-password"`.
- Przycisk pokaż/ukryj hasło z opisem dostępnym dla czytnika ekranu.
- Jeden bezpieczny komunikat błędu: „Nieprawidłowy adres e-mail lub hasło.” Ten sam tekst jest używany dla nieistniejącego konta, złego hasła i konta niepotwierdzonego, o ile Supabase nie wymaga odrębnego bezpiecznego przepływu potwierdzenia.
- Po sukcesie fokus przechodzi na komunikat „Zalogowano”, a nagłówek nadal pokazuje adres e-mail.
- Widoczny link „Nie pamiętasz hasła?” prowadzi do formularza resetu hasła. Odpowiedź resetu pozostaje ogólna: „Jeżeli konto istnieje, wysłaliśmy wiadomość.”

### Po rejestracji

- Nie pokazujemy formularza ponownie z ogólnym tekstem błędu.
- Pokazujemy stan sukcesu: „Sprawdź skrzynkę e-mail i potwierdź adres, aby się zalogować.”
- Dostępne są: zmiana wpisanego e-maila, powrót do logowania oraz przycisk ponowienia wysyłki po 60 sekundach.
- Nie wyświetlamy, czy adres należał do istniejącego konta.

### Komunikaty techniczne

Publiczny interfejs nie pokazuje surowych treści błędów Supabase. Aplikacja zapisuje techniczny kod błędu do narzędzia obserwowalności (bez hasła, tokenu i pełnego e-maila), a użytkownik otrzymuje komunikat z możliwą akcją. Przykładowe mapowanie:

| Sytuacja | Komunikat użytkownika | Działanie |
| --- | --- | --- |
| Niepoprawny format nazwy | „Użyj 3–50 liter, cyfr, `_`, `-` lub `.`.” | Popraw pole. |
| Nazwa zajęta | „Ta nazwa użytkownika jest niedostępna. Wybierz inną.” | Podaj nową nazwę. |
| Konflikt po wysłaniu | „Wybrana nazwa właśnie stała się niedostępna.” | Wróć do pola i wybierz inną. |
| Zbyt krótkie hasło | „Hasło musi mieć co najmniej 12 znaków.” | Użyj dłuższego hasła. |
| Błędne dane logowania | „Nieprawidłowy adres e-mail lub hasło.” | Spróbuj ponownie lub zresetuj hasło. |
| Brak sieci / timeout | „Nie udało się połączyć. Sprawdź internet i spróbuj ponownie.” | Ponów. |
| Niesklasyfikowany błąd rejestracji | „Nie udało się utworzyć konta. Spróbuj ponownie za chwilę.” | Ponów; kod jest dostępny wyłącznie w logach. |

## Zakres implementacji

### W zakresie

- migracja `011` dla funkcji sprawdzania dostępności nazwy;
- walidacja lokalna, stan ładowania i asynchroniczne sprawdzenie `username`;
- czytelne stany błędów oraz obsługa konfliktu przy wysłaniu;
- pokaż/ukryj hasło, wskaźnik wymagań i użycie właściwych `autocomplete`;
- stan „potwierdź e-mail” oraz bezpieczne ponowienie wysyłki;
- ekran resetu hasła i przepływ aktualizacji hasła przez Supabase Auth;
- testy jednostkowe, komponentowe i integracyjne z testowym projektem Supabase.

### Poza zakresem

- Google, Apple, GitHub i inne logowania społecznościowe;
- MFA, WebAuthn/passkeys, CAPTCHA oraz urządzenia zaufane — poza przygotowaniem punktów rozszerzeń;
- publiczne profile i wyszukiwanie użytkowników;
- zmiana adresu e-mail i nazwy użytkownika po rejestracji;
- role, zespoły, administratorzy i płatności.

## Testy

### Jednostkowe

- normalizacja i walidacja `username`;
- debounce, anulowanie poprzedniego żądania i ignorowanie spóźnionej odpowiedzi;
- mapowanie błędów Supabase na komunikaty użytkownika;
- stany hasła: krótsze niż 12 znaków, poprawne i widoczne/ukryte;
- brak ujawniania e-maila lub szczegółu technicznego w komunikatach logowania.

### Komponentowe

- komunikat pomocniczy zmienia się w błąd po `blur` lub wysłaniu formularza;
- zielony i czerwony stan nazwy mają tekst oraz właściwe atrybuty ARIA;
- przycisk rejestracji jest blokowany dla formatu błędnego, sprawdzania i nazwy zajętej;
- użytkownik może nadal poprawić wszystkie pola bez utraty danych;
- ekran po rejestracji wskazuje potwierdzenie e-maila i umożliwia ponowienie wysyłki po czasie;

### Integracyjne / E2E

- nowy użytkownik z dostępnym `username` otrzymuje profil z poprawną wartością `username`;
- dwa równoległe zgłoszenia tej samej nazwy kończą się jednym sukcesem i jednym kontrolowanym konfliktem;
- endpoint dostępności nie zwraca danych właściciela i jest ograniczany częstotliwościowo;
- niezalogowany użytkownik nie może odczytać tabeli `profiles` bezpośrednio;
- logowanie z błędnym e-mailem i błędnym hasłem prezentuje ten sam komunikat;
- użytkownik po potwierdzeniu e-maila może zalogować się, zapisać oraz odczytać wyłącznie własne analizy.

## Kryteria akceptacji

- [ ] Formularz rejestracji waliduje format w trakcie wpisywania i pokazuje zrozumiałe błędy przy polach.
- [ ] Po krótkim debounce poprawna nazwa jest sprawdzana asynchronicznie i otrzymuje tekstowy stan dostępności.
- [ ] Kolizja nazwy jest komunikowana przed wysłaniem, a kolizja wyścigowa po wysłaniu ma osobny, możliwy do naprawy komunikat.
- [ ] Aplikacja nie udostępnia API sprawdzającego istnienie e-maila i nie różnicuje błędów logowania po e-mailu/haśle.
- [ ] Widoki są dostępne z klawiatury i dla czytnika ekranu; kolor nie jest jedynym nośnikiem informacji.
- [ ] Po rejestracji użytkownik widzi jasny stan potwierdzenia e-maila oraz może bezpiecznie ponowić wysyłkę.
- [ ] Wszystkie opisane testy przechodzą na lokalnym środowisku i testowym projekcie Supabase.

## Zależności i ryzyka

- Funkcja triggera na `auth.users` jest częścią transakcji rejestracji; jej błąd może zablokować utworzenie konta. Każda zmiana triggera wymaga testu rejestracji w testowym projekcie Supabase. [Supabase User Management](https://supabase.com/docs/guides/auth/managing-user-data)
- Sprawdzenie dostępności nazwy poprawia UX, ale jest formą kontrolowanego ujawnienia zajętości publicznego identyfikatora. Jeśli `username` nie ma być publiczny, funkcję dostępności należy usunąć i zostawić wyłącznie walidację podczas wysłania.
- Wersja produkcyjna potrzebuje monitoringu błędów Auth i Postgres, aby diagnozować problemy triggera bez wyświetlania szczegółów użytkownikowi. [Supabase troubleshooting](https://supabase.com/docs/guides/troubleshooting/database-error-saving-new-user-RU_EwB)

## Źródła wzorców

- [GitHub — rejestracja](https://github.com/signup) i [polityka nazw użytkowników](https://docs.github.com/en/site-policy/other-site-policies/github-username-policy): osobny, ograniczony formatem identyfikator i konieczność wybrania innej zajętej nazwy.
- [Material Design — pola tekstowe](https://m2.material.io/design/components/text-fields.html): stany pomocnicze, błędy przy polu, ikony i brak polegania wyłącznie na kolorze.
- [Microsoft Fluent — Field](https://fluent2.microsoft.design/components/web/react/core/field/usage): wizualne stany walidacji i komunikaty pomocnicze.
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): ogólne komunikaty logowania i ochrona przed enumeracją kont.
