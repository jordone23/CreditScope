# Specyfikacja 009 — Konta użytkowników i zapisane analizy

## Status

Zaimplementowano w wariancie Supabase. Migracja została uruchomiona w docelowym projekcie Supabase i zweryfikowana 12.08.2026: tabele `profiles`, `saved_analysis` oraz `analysis_schedule_item` istnieją, a niezalogowany dostęp do każdej z nich jest odrzucany.

Aktualizacja 13.08.2026: aplikacja obsługuje otwarcie własnej zapisanej analizy oraz przygotowano migrację `202608130001_open_saved_analyses_and_unique_titles.sql`. Jej uruchomienie w docelowej bazie jest wymagane przed produkcyjnym użyciem unikalnych tytułów.

> **Wdrożona architektura zastępuje opis własnej tabeli `app_user`:** adres e-mail, hash hasła, weryfikacja e-maila i sesje są przechowywane wyłącznie w zarządzanym schemacie `auth.users` Supabase. Aplikacja nie tworzy ani nie przechowuje `password_hash`. W `public.profiles` znajduje się tylko nazwa użytkownika powiązana z `auth.users.id`; `saved_analysis.user_id` także wskazuje na `auth.users.id`.

## Cel

Umożliwić użytkownikowi utworzenie konta, bezpieczne logowanie oraz zapis i późniejszy odczyt własnych analiz kredytowych. Dane każdej analizy muszą być dostępne wyłącznie dla właściciela konta.

## Zakres

### W zakresie

- przechowywanie adresu e-mail, nazwy użytkownika i bezpiecznego skrótu hasła;
- przechowywanie metadanych konta potrzebnych do uwierzytelniania i audytu bezpieczeństwa;
- zapis kompletnego, niezmiennego wyniku analizy wraz z danymi wejściowymi;
- przypisanie analiz do użytkownika oraz możliwość ich uporządkowania i wyszukania;
- własność danych, ograniczenia integralności, indeksy i zasady retencji.

### Poza zakresem

- ekran rejestracji, logowania, listy analiz i edycji profilu;
- API, wybór dostawcy backendu, mechanizm sesji i wysyłka e-maili;
- odzyskiwanie hasła, logowanie społecznościowe i weryfikacja adresu e-mail;
- wspólne analizy, udostępnianie linkiem, eksport oraz płatności;
- podejmowanie decyzji kredytowych lub ocena zdolności kredytowej.

## Decyzje projektowe

| Obszar | Decyzja |
| --- | --- |
| Silnik bazy | PostgreSQL 16+ jako relacyjna baza danych. |
| Identyfikatory | UUID v4 generowane po stronie bazy lub warstwy backendu. |
| Uwierzytelnianie | Supabase Auth zarządza e-mailem, hashem hasła, weryfikacją i sesją w `auth.users`; aplikacja nie otrzymuje ani nie zapisuje hasha hasła. |
| E-mail | Wartość jest normalizowana (`trim`, małe litery) przed zapisem i jest unikalna bez rozróżniania wielkości liter. |
| Analizy | Każdy zapis stanowi niezmienny snapshot danych wejściowych i wyników w chwili obliczenia. Zmiana analizy tworzy nowy zapis lub jawną funkcję aktualizacji tytułu — nie przelicza historii w tle. |
| Kwoty | Kwoty zapisywane są jako `numeric(14,2)` w PLN, nigdy jako `float`/`double precision`. |
| Harmonogram | Pozycje harmonogramu są przechowywane w osobnej tabeli, aby można było je wydajnie odczytywać, walidować i eksportować. |
| Izolacja | Każde zapytanie dotyczące analizy jest ograniczone przez Row-Level Security i `auth.uid()`. Zapis i logiczne usunięcie odbywają się przez funkcje SQL sprawdzające właściciela. |

## Diagram relacji

```text
auth.users 1 ─────────── 1 profiles
     │
     └──────────────────< saved_analysis 1 ───────────< analysis_schedule_item
```

- Jedno konto może mieć zero lub wiele zapisanych analiz.
- Jedna analiza należy dokładnie do jednego konta.
- Jedna analiza może mieć zero lub wiele pozycji harmonogramu. Zero jest dopuszczalne dla zapisu roboczego; zapisana, ukończona analiza powinna mieć harmonogram zgodny z okresem kredytowania.

## Struktura danych

### `app_user`

Tabela przechowująca dane konta. Nazwa `app_user` celowo omija potencjalną kolizję ze słowem kluczowym `user` w SQL.

| Kolumna | Typ PostgreSQL | Wymagane | Zasada / znaczenie |
| --- | --- | --- | --- |
| `id` | `uuid` | tak | Klucz główny konta. |
| `email` | `citext` lub `varchar(254)` | tak | Znormalizowany adres e-mail; unikalny bez względu na wielkość liter. |
| `username` | `varchar(50)` | tak | Publiczna nazwa użytkownika; unikalna bez względu na wielkość liter. |
| `password_hash` | `varchar(255)` | tak | Pełny, zakodowany wynik Argon2id zawierający parametry i sól; nigdy hasło jawne. |
| `email_verified_at` | `timestamptz` | nie | Data potwierdzenia adresu e-mail; `NULL` przed weryfikacją. |
| `last_login_at` | `timestamptz` | nie | Data ostatniego udanego logowania. |
| `created_at` | `timestamptz` | tak | Czas utworzenia konta, domyślnie czas bazy. |
| `updated_at` | `timestamptz` | tak | Czas ostatniej zmiany rekordu. |
| `deleted_at` | `timestamptz` | nie | Opcjonalne miękkie usunięcie konta; do czasu anonimizacji blokuje logowanie. |

Ograniczenia:

- `PRIMARY KEY (id)`;
- unikalność `email` i `username` przy użyciu indeksów wyrażeń `lower(...)`, jeśli nie zostanie użyty typ `citext`;
- `email` ma długość od 3 do 254 znaków po normalizacji;
- `username` ma 3–50 znaków; dozwolone są litery, cyfry, `_`, `-` i `.`; nie może zaczynać się ani kończyć spacją;
- `password_hash` nie może być pusty;
- `updated_at >= created_at`.

W bazie nie wolno przechowywać kolumn `password`, `plain_password`, `password_salt` ani odpowiedzi na pytania pomocnicze. Sól i parametry są częścią standardowego zakodowanego hasha Argon2id.

### `saved_analysis`

Tabela przechowująca podsumowanie i dane wejściowe pojedynczej analizy. Jest samowystarczalnym snapshotem: późniejsza zmiana kalkulatora nie modyfikuje historycznego zapisu.

| Kolumna | Typ PostgreSQL | Wymagane | Zasada / znaczenie |
| --- | --- | --- | --- |
| `id` | `uuid` | tak | Klucz główny analizy. |
| `user_id` | `uuid` | tak | Klucz obcy do `app_user.id`; właściciel analizy. |
| `title` | `varchar(120)` | tak | Tytuł nadany przez użytkownika; domyślnie może być generowany przez aplikację. |
| `status` | `varchar(16)` | tak | `completed` albo `draft`; domyślnie `completed`. |
| `calculation_version` | `varchar(32)` | tak | Wersja algorytmu użytego przy zapisie, np. `1.0.0`. |
| `currency_code` | `char(3)` | tak | Kod ISO 4217; dla obecnej aplikacji wyłącznie `PLN`. |
| `loan_amount` | `numeric(14,2)` | tak | Kwota kredytu w PLN, większa od zera. |
| `annual_interest_rate` | `numeric(7,4)` | tak | Nominalne oprocentowanie roczne w procentach, np. `7.5000`; nieujemne. |
| `term_years` | `smallint` | tak | Pełne lata spłaty; wartość dodatnia. |
| `monthly_net_income` | `numeric(14,2)` | tak | Miesięczny dochód netto w PLN, większy od zera. |
| `monthly_obligations` | `numeric(14,2)` | tak | Łączna wartość miesięcznych zobowiązań w PLN; nieujemna. |
| `monthly_installment` | `numeric(14,2)` | tak dla `completed` | Miesięczna rata w PLN. |
| `total_repayment_amount` | `numeric(14,2)` | tak dla `completed` | Łączna kwota do spłaty w PLN. |
| `total_credit_cost` | `numeric(14,2)` | tak dla `completed` | Całkowity koszt kredytu w PLN. |
| `total_interest_amount` | `numeric(14,2)` | tak dla `completed` | Suma odsetek w PLN. |
| `debt_burden_ratio` | `numeric(7,4)` | tak dla `completed` | Wskaźnik obciążenia dochodu w procentach, nie ułamek. |
| `created_at` | `timestamptz` | tak | Czas zapisu analizy. |
| `updated_at` | `timestamptz` | tak | Czas zmiany tytułu lub statusu. |
| `deleted_at` | `timestamptz` | nie | Opcjonalne miękkie usunięcie przez użytkownika. |

Ograniczenia:

- `FOREIGN KEY (user_id) REFERENCES app_user(id)`; przy trwałym usuwaniu konta zależne analizy są usuwane kaskadowo;
- `CHECK (status IN ('draft', 'completed'))`;
- `CHECK (currency_code = 'PLN')` w pierwszej wersji;
- dodatniość `loan_amount`, `term_years` i `monthly_net_income` oraz nieujemność `annual_interest_rate` i `monthly_obligations`;
- dla `completed`: wszystkie pola wyniku są obecne, `total_repayment_amount >= loan_amount`, a `total_credit_cost = total_repayment_amount - loan_amount` z tolerancją wynikającą z zaokrągleń do grosza;
- dla `draft` pola wyników mogą być `NULL`, ale dane wejściowe nadal muszą przejść walidację;
- rekordy z `deleted_at IS NOT NULL` nie są zwracane w zwykłej liście analiz.
- Tytuł jest unikalny dla aktywnych analiz tego samego użytkownika po normalizacji `lower(btrim(title))`. Ten sam tytuł może istnieć u innego użytkownika lub zostać ponownie użyty po logicznym usunięciu poprzedniej analizy.

### `analysis_schedule_item`

Tabela przechowująca harmonogram rat analizy.

| Kolumna | Typ PostgreSQL | Wymagane | Zasada / znaczenie |
| --- | --- | --- | --- |
| `analysis_id` | `uuid` | tak | Klucz obcy do `saved_analysis.id`. |
| `installment_number` | `integer` | tak | Numer raty od `1`, unikalny w obrębie analizy. |
| `installment_amount` | `numeric(14,2)` | tak | Całkowita rata w PLN. |
| `principal_amount` | `numeric(14,2)` | tak | Część kapitałowa raty w PLN. |
| `interest_amount` | `numeric(14,2)` | tak | Część odsetkowa raty w PLN. |
| `remaining_balance` | `numeric(14,2)` | tak | Saldo po zapłaceniu raty; nieujemne. |

Klucz główny: `PRIMARY KEY (analysis_id, installment_number)`.

Ograniczenia:

- `FOREIGN KEY (analysis_id) REFERENCES saved_analysis(id) ON DELETE CASCADE`;
- `installment_number > 0`;
- wszystkie wartości kwotowe są nieujemne;
- `installment_amount = principal_amount + interest_amount` z tolerancją jednego grosza;
- dla ostatniej raty `remaining_balance = 0.00` po zastosowaniu zasad zaokrąglania kalkulatora.

## Indeksy

Minimalny zestaw indeksów:

| Tabela | Indeks | Cel |
| --- | --- | --- |
| `app_user` | unikalny na znormalizowanym `email` | Szybkie i jednoznaczne logowanie. |
| `app_user` | unikalny na znormalizowanym `username` | Brak duplikatów nazw użytkownika. |
| `saved_analysis` | `(user_id, created_at DESC)` z warunkiem `deleted_at IS NULL` | Lista ostatnich aktywnych analiz użytkownika. |
| `saved_analysis` | `(user_id, lower(title))` z warunkiem `deleted_at IS NULL` | Opcjonalne wyszukiwanie po tytule. |
| `saved_analysis` | unikalny `(user_id, lower(btrim(title)))` z warunkiem `deleted_at IS NULL` | Zapobiega zapisaniu dwóch aktywnych analiz właściciela o tej samej nazwie. |
| `analysis_schedule_item` | klucz główny `(analysis_id, installment_number)` | Odczyt harmonogramu we właściwej kolejności. |

## Zasady dostępu i bezpieczeństwa

1. Klient przeglądarkowy nie łączy się z bazą przy użyciu uprzywilejowanych poświadczeń. Dostęp odbywa się przez backend lub usługę uwierzytelniania z politykami dostępu.
2. Rejestracja przyjmuje hasło wyłącznie przez połączenie HTTPS. Przed zapisem serwer waliduje je, oblicza hash Argon2id i nie zapisuje ani nie loguje wersji jawnej.
3. Minimalna polityka hasła: co najmniej 12 znaków. Należy odrzucać hasła z listy najczęściej ujawnionych haseł; nie wymagać sztucznie konkretnego zestawu znaków, jeśli długość i kontrola wycieków są zapewnione.
4. Odpowiedzi przy logowaniu i rejestracji nie mogą ujawniać, czy konkretny e-mail istnieje, poza kontrolowanym komunikatem rejestracyjnym o zajętym adresie.
5. Wszelkie zapytania do `saved_analysis` i `analysis_schedule_item` są autoryzowane względem tożsamości sesji. Samo przekazanie identyfikatora analizy nie może dać dostępu do cudzego zapisu.
6. Jeśli baza jest dostępna bezpośrednio z warstwy aplikacji, należy włączyć RLS: właściciel może odczytać, utworzyć, zmienić tytuł i usunąć logicznie wyłącznie własne analizy. Harmonogram dziedziczy dostęp poprzez właściciela analizy.
7. Należy stosować ograniczanie liczby prób logowania oraz rejestrować zdarzenia bezpieczeństwa bez zapisu hasła, tokenów sesji i pełnej treści analiz.
8. Kopie zapasowe bazy muszą być szyfrowane i objęte tymi samymi zasadami retencji co baza produkcyjna.

## Prywatność i retencja

Analizy zawierają dane finansowe (dochód, zobowiązania, parametry kredytu), dlatego należy traktować je jako dane wrażliwe biznesowo, choć nie są szczególną kategorią danych osobowych w rozumieniu RODO.

- Zbieramy wyłącznie dane wymienione w tym dokumencie; nie dodajemy PESEL, adresu, historii kredytowej, danych rachunków ani dokumentów dochodowych.
- Użytkownik może usunąć pojedynczą analizę. Rekord jest oznaczany `deleted_at`, a następnie trwale usuwany zgodnie z ustalonym okresem retencji, np. po 30 dniach.
- Usunięcie konta inicjuje trwałe usunięcie lub anonimizację danych konta i wszystkich analiz po zakończeniu okresu ochronnego. Okres i podstawa prawna muszą zostać opisane w polityce prywatności.
- Logi aplikacyjne przechowują tylko identyfikatory techniczne i minimalne metadane potrzebne do diagnostyki.

## Kontrakt zapisu analizy

Przed utworzeniem analizy backend:

1. potwierdza aktywną sesję użytkownika;
2. waliduje dane wejściowe zgodnie z istniejącym kontraktem `LoanInput`;
3. wykonuje obliczenie po stronie zaufanej albo weryfikuje przekazane wyniki przy użyciu tej samej wersji algorytmu;
4. zapisuje rekord `saved_analysis` i wszystkie `analysis_schedule_item` w jednej transakcji;
5. zwraca wyłącznie rekord należący do zalogowanego użytkownika.

Pola finansowe nie mogą być traktowane jako zaufane tylko dlatego, że pochodzą z klienta. W szczególności `total_credit_cost`, `debt_burden_ratio` i harmonogram muszą być wyliczone lub ponownie sprawdzone po stronie serwera.

### Otwieranie zapisanej analizy

Lista zapisanych analiz zawiera interaktywny tytuł. Po jego wybraniu aplikacja pobiera wyłącznie rekord właściciela, komplet jego pozycji `analysis_schedule_item` oraz dane wejściowe i wyniki zapisane w `saved_analysis`. Następnie wypełnia formularz wartościami `LoanInput` i pokazuje historyczny snapshot wyniku oraz harmonogramu.

Otwieranie nie uruchamia ponownego obliczenia: dzięki temu prezentuje dokładnie zapisane wartości, także jeżeli algorytm kalkulatora zmieni się w przyszłości. RLS dla `saved_analysis` i `analysis_schedule_item` pozostaje obowiązkową ochroną przed otwarciem cudzego rekordu przez znany identyfikator.

## Minimalne przypadki testowe przy implementacji

- rejestracja tworzy konto z unikalnym, znormalizowanym e-mailem i nie zapisuje hasła jawnego;
- drugi zapis e-maila lub nazwy użytkownika, różniący się wyłącznie wielkością liter, jest odrzucony;
- użytkownik może utworzyć i odczytać własną ukończoną analizę wraz z harmonogramem;
- użytkownik po kliknięciu własnej analizy otrzymuje jej dane w formularzu oraz historyczny wynik i harmonogram;
- druga aktywna analiza tego samego użytkownika o tym samym tytule, różniącym się wyłącznie wielkością liter lub spacjami brzegowymi, jest odrzucona z komunikatem „Istnieje już analiza o tej nazwie. Wybierz inną.”;
- tytuł logicznie usuniętej analizy może zostać wykorzystany ponownie;
- użytkownik nie może odczytać, zmienić ani usunąć analizy innego użytkownika;
- usunięcie analizy ukrywa ją z domyślnej listy;
- trwałe usunięcie konta usuwa zależne analizy i harmonogramy;
- wartości zerowe i ujemne nie przechodzą ograniczeń finansowych zgodnie z zasadami `LoanInput`;
- suma kapitału harmonogramu odpowiada kwocie kredytu, a końcowe saldo wynosi zero z tolerancją 0,01 PLN;
- równoległe próby utworzenia konta z tym samym e-mailem nie tworzą duplikatu.

## Kryteria akceptacji przyszłego wdrożenia

- [ ] W bazie istnieją tabele `app_user`, `saved_analysis` i `analysis_schedule_item` wraz z opisanymi kluczami, ograniczeniami i indeksami.
- [ ] Nie istnieje żadna kolumna przechowująca hasło jawne ani własnoręcznie zarządzaną sól.
- [ ] Konto jest jednoznacznie rozpoznawane po e-mailu, a e-mail i nazwa użytkownika są unikalne bez względu na wielkość liter.
- [ ] Każda analiza ma właściciela, komplet danych wejściowych i — po ukończeniu — odtwarzalny wynik oraz harmonogram.
- [ ] Właściciel może otworzyć analizę z listy, co wypełnia formularz i pokazuje zapisany snapshot wyników bez ponownego liczenia.
- [ ] Dwie aktywne analizy właściciela nie mogą mieć tego samego tytułu po normalizacji wielkości liter i spacji brzegowych.
- [ ] Autoryzacja uniemożliwia dostęp do danych innego użytkownika na poziomie backendu, a tam gdzie to możliwe także w bazie przez RLS.
- [ ] Zapis analizy i harmonogramu jest atomowy.
- [ ] Użytkownik może usunąć swoje dane zgodnie z opisaną polityką retencji.

## Otwarte decyzje przed implementacją

1. Czy uwierzytelnianie zapewni własny backend, czy zarządzana usługa (np. Supabase Auth)? Przy usłudze zarządzanej tabela `app_user` powinna być profilem powiązanym z jej tabelą tożsamości, a `password_hash` pozostaje wyłącznie w systemie dostawcy.
2. Czy zapisy robocze (`draft`) są potrzebne w pierwszej wersji? Jeżeli nie, można ograniczyć tabelę do analiz `completed` i uprościć pola `NULL`.
3. Czy użytkownik ma móc zmieniać adres e-mail i nazwę użytkownika? Wymaga to osobnego procesu ponownej weryfikacji oraz audytu zmian.
4. Jak długo mają być przechowywane rekordy oznaczone jako usunięte oraz kopie zapasowe? Decyzja powinna znaleźć odzwierciedlenie w polityce prywatności.
