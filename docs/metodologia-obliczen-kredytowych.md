# Metodologia obliczeń kredytowych

## 1. Cel, zakres i status dokumentu

Dokument opisuje niezależną metodologię obliczania rat, harmonogramu spłaty, całkowitej kwoty do zapłaty, całkowitego kosztu kredytu, RRSO oraz wskaźnika obciążenia dochodu. Jest punktem odniesienia do późniejszej weryfikacji kalkulatora, a nie opisem jego obecnej implementacji.

Metodologia jest przeznaczona przede wszystkim dla symulacji kredytu lub pożyczki spłacanej miesięcznie w PLN. Rozdziela trzy rzeczy, których nie należy utożsamiać:

1. **model matematyczny** — jak z parametrów umowy wyznacza się przepływy pieniężne;
2. **definicje konsumenckie i prawne** — co jest kwotą kredytu, kosztem i kwotą do zapłaty;
3. **ocenę budżetową** — czy rata jest relatywnie duża wobec dochodu; nie jest to decyzja kredytowa banku.

Jeżeli umowa ma niestandardowy kalendarz, kilka transz, zmienne oprocentowanie, karencję, ubezpieczenie, prowizję kredytowaną albo nadpłaty, parametry te muszą zostać zapisane jawnie. Sama kwota, roczne oprocentowanie i liczba miesięcy nie wystarczają wtedy do wiernego odtworzenia oferty.

> **Ważne:** wyniki są symulacją informacyjną. Bankowa ocena zdolności kredytowej uwzględnia m.in. źródło i stabilność dochodów, koszty utrzymania, historię i inne zobowiązania, własne modele ryzyka oraz — w zależności od produktu — testy warunków skrajnych.[^5][^6]

## 2. Pojęcia i konwencja zapisu

### 2.1. Pojęcia finansowe

| Symbol / pojęcie | Znaczenie metodologiczne |
| --- | --- |
| `K` | całkowita kwota kredytu: środki udostępnione konsumentowi, **bez kredytowanych kosztów** |
| `B0` | początkowe saldo zadłużenia w harmonogramie; może być większe od `K`, gdy koszt jest kredytowany |
| `n` | liczba rat / okresów spłaty |
| `r` | roczna stopa nominalna w zapisie dziesiętnym, np. 8% = `0,08` |
| `i` | stopa przypisana jednemu okresowi naliczania odsetek |
| `A_t` | pełna płatność w okresie `t` (rata wraz z obowiązkowymi składnikami pobieranymi w tej płatności) |
| `I_t` | część odsetkowa płatności w okresie `t` |
| `C_t` | część kapitałowa płatności w okresie `t` |
| `F_t` | inne obowiązkowe koszty pobierane w okresie `t` (np. miesięczna opłata lub składka) |
| `B_t` | saldo kapitału po zaksięgowaniu płatności z okresu `t` |

W polskim kredycie konsumenckim **całkowita kwota kredytu** nie obejmuje kredytowanych kosztów. **Całkowita kwota do zapłaty przez konsumenta** to suma całkowitej kwoty kredytu i całkowitego kosztu kredytu.[^1] Ten podział jest ważniejszy niż potoczne określenie „kwota pożyczki”.

### 2.2. Założenie bazowe dla prostej symulacji

Jeżeli nie wskazano inaczej, model bazowy przyjmuje:

- jednorazową wypłatę `K` na początku (`t = 0`),
- `n` miesięcznych płatności na końcu każdego miesiąca,
- stałe oprocentowanie nominalne przez cały okres,
- brak prowizji, ubezpieczenia, opłat miesięcznych, kar, wakacji kredytowych, nadpłat i kosztów windykacji,
- raty kapitałowo-odsetkowe; podatki i opłaty notarialne poza zakresem,
- walutę, daty i częstotliwość zgodne dla wszystkich wejść.

W tym ograniczonym przypadku `B0 = K`, `F_t = 0`, a całkowity koszt jest równy sumie odsetek. W rzeczywistym produkcie to tylko szczególny przypadek, nie ogólna definicja kosztu.

## 3. Dane wejściowe i kontrakt obliczeniowy

Każde obliczenie powinno posiadać nie tylko wartości liczbowe, lecz także metadane umowne.

| Obszar | Dane wymagane | Dlaczego są konieczne |
| --- | --- | --- |
| Kwota | `K`, kwota faktycznie wypłacona, ewentualne koszty finansowane | rozstrzygają różnicę między kwotą kredytu a saldem zadłużenia |
| Czas | data wypłaty, pierwsza data płatności, daty kolejnych płatności, `n` | ustalają moment naliczenia odsetek i RRSO |
| Stopa | stopa nominalna lub harmonogram stóp, indeks i marża, zasady aktualizacji | przy stopie zmiennej nie ma jednego niezmiennego `i` |
| Konwencja odsetkowa | miesięczna albo liczba dni oraz baza dni | `r/12` i naliczanie dzienne mogą dać inne wyniki |
| Raty | wariant: równe, malejące, odsetkowe, balonowe; zasada zmiany raty | determinuje przepływy i saldo |
| Koszty | kwota, data pobrania, obowiązkowość, finansowanie lub płatność gotówką | są konieczne do kwoty do zapłaty i RRSO |
| Zaokrąglenia | precyzja wewnętrzna, moment zaokrąglenia, korekta ostatniej raty | zapobiegają różnicom jednego–kilku groszy |

**Walidacja minimum:** `K > 0`, `n` jest dodatnią liczbą całkowitą, stopa nie jest ujemna (chyba że produkt wyraźnie ją dopuszcza), daty są chronologiczne, a dochód w mianowniku wskaźnika obciążenia jest dodatni. Kwoty i stopy należy przeliczać w arytmetyce dziesiętnej, nie w binarnych liczbach zmiennoprzecinkowych.

## 4. Odsetki: stopa roczna a stopa okresowa

### 4.1. Miesięczna konwencja nominalna

Jeżeli umowa podaje nominalną stopę roczną `r` oraz stosuje miesięczny okres odsetkowy, typową konwencją symulacyjną jest:

`i = r / 12`

Przykład: dla `r = 0,08` miesięczna stopa w tej konwencji wynosi `0,08 / 12 = 0,006666…`, czyli ok. `0,6667%` miesięcznie. Nie oznacza to, że efektywny koszt roczny wynosi dokładnie 8%; przy kapitalizacji miesięcznej efektywna stopa roczna wynosi `(1 + r/12)^12 - 1`.

### 4.2. Stopa efektywna i naliczanie dzienne

Nie wolno automatycznie dzielić przez 12 stopy, która w umowie jest **efektywną** stopą roczną. Przy zgodnym założeniu 12 równych okresów stopa miesięczna wynosi wtedy:

`i = (1 + r_ef)^(1/12) - 1`

W umowie z naliczaniem dziennym odsetki za okres liczy się z rzeczywistych dni:

`I_t = B_(t-1) × r × d_t / D`

gdzie `d_t` to liczba dni w okresie, a `D` jest bazą wynikającą z umowy (np. 365, 360 albo konwencja actual/actual). Użycie `r/12` zamiast wskazanej umownie bazy dni jest wtedy metodologicznym uproszczeniem, które może zmienić harmonogram.

### 4.3. Zmienna i okresowo stała stopa

Przy stopie zmiennej należy przechowywać sekwencję stóp `i_t`; część odsetkowa danego okresu jest wyliczana ze stopy obowiązującej dla tego okresu. Zmiana stopy nie przesądza sama w sobie, jak zmieni się rata: umowa może przewidywać przeliczenie raty przy zachowaniu terminu końcowego, zmianę okresu lub inny mechanizm. Materiały NBP wskazują, że w kredytach o zmiennej stopie rata często zależy od stawki rynkowej (np. WIBOR) powiększonej o marżę banku.[^7]

W symulacji należy rozróżniać:

- **stałą stopę przez cały okres** — harmonogram jest deterministyczny po zawarciu umowy;
- **okresowo stałą stopę** — harmonogram jest pewny tylko do daty refiksacji;
- **zmienną stopę** — przedstawiona przyszła rata jest scenariuszem przy zadanej ścieżce stóp, nie gwarantowaną ratą.

## 5. Raty równe (annuitetowe)

### 5.1. Wysokość raty

Przy saldzie początkowym `B0`, stałej stopie okresowej `i`, `n` ratach i płatnościach na końcu okresu, rata kapitałowo-odsetkowa jest:

`A = B0 × i / (1 - (1 + i)^(-n))`

Wzór wynika z warunku, że wartość bieżąca wszystkich `n` równych rat ma być równa saldu na początku: `B0 = A × [1 - (1+i)^(-n)] / i`.

Gdy `i = 0`, nie stosuje się powyższego dzielenia przez zero; poprawny przypadek graniczny to:

`A = B0 / n`

„Równe” znaczy równe **przed korektą zaokrągleń** i bez zmiany stopy lub kosztów okresowych. Jeżeli występuje stała opłata miesięczna `F_t`, równą ratą finansową pozostaje `A`, lecz całkowita miesięczna płatność konsumenta wynosi `A + F_t`.

### 5.2. Rozbicie pojedynczej raty

Dla każdej raty `t = 1, …, n`:

`I_t = B_(t-1) × i`

`C_t = A - I_t`

`B_t = B_(t-1) - C_t`

Pełny wypływ środków w terminie wynosi `P_t = A + F_t`. W modelu bazowym `F_t = 0`, zatem `P_t = A`.

Na początku harmonogramu saldo jest wysokie, dlatego `I_t` jest relatywnie wysokie, a `C_t` niskie. Z każdym terminem saldo maleje; przy niezmiennej racie rośnie zatem część kapitałowa. To jest konsekwencja powyższych równań, nie dodatkowa opłata.

### 5.3. Zmiana stopy w racie równej

Jeżeli po racie `q` stopa zmienia się na `i'`, najczęstszy wariant zachowuje końcowy termin. Ratę na pozostałe `m = n - q` okresów liczy się od bieżącego salda:

`A' = B_q × i' / (1 - (1 + i')^(-m))`

To założenie powinno być nazwane wprost w wyniku. Alternatywne umowy mogą utrzymywać ratę i modyfikować okres spłaty — wówczas nie wolno użyć powyższego przeliczenia.

## 6. Raty malejące

W wariancie malejącym stała jest planowana część kapitałowa, a nie pełna rata. Dla `B0` i `n`:

`C_t = B0 / n`

`I_t = B_(t-1) × i`

`A_t = C_t + I_t`

`B_t = B_(t-1) - C_t`

Ponieważ saldo maleje, maleją odsetki i pełne raty. Przy tej samej kwocie, stopie i czasie suma odsetek jest zwykle niższa niż przy ratach równych, ale pierwsze obciążenie miesięczne jest wyższe. Nie jest to porównanie wyłącznie „tańsze/droższe”: trzeba jednocześnie pokazać maksymalną ratę, sumę kosztu oraz przyjęty kalendarz.

## 7. Inne modele spłaty — tylko przy wyraźnym oznaczeniu

| Wariant | Mechanika | Skutek dla salda i kosztu |
| --- | --- | --- |
| Raty odsetkowe (interest-only) | `A_t = I_t`; kapitał nie jest regulowany w okresie odsetkowym | saldo nie maleje; po okresie potrzebna jest spłata kapitału lub nowy harmonogram |
| Karencja z płatnością odsetek | kapitał jest odroczony, odsetki opłacane na bieżąco | saldo zwykle pozostaje stałe w karencji |
| Karencja z kapitalizacją odsetek | odsetki dopisuje się do salda: `B_t = B_(t-1) + I_t` | saldo rośnie, a późniejsza rata/koszt rosną |
| Rata balonowa | część kapitału pozostaje do dużej płatności końcowej | zwykle niższe raty okresowe i wysokie ryzyko płatności końcowej |
| Nierówne transze i raty | stosuje się rzeczywiste daty oraz listę przepływów | nie stosuje się pojedynczego wzoru annuitetowego; potrzebna jest iteracja po zdarzeniach |

Nie należy przedstawiać tych wariantów jako standardowej „raty miesięcznej” bez informacji o saldzie końcowym i płatności balonowej. Przy wypłatach w transzach odsetki liczy się od faktycznie uruchomionego salda każdej transzy, od jej daty.

## 8. Harmonogram spłaty

### 8.1. Algorytm ogólny

Harmonogram powinien być generowany sekwencyjnie. Dla każdego terminu najpierw ustala się saldo przed ratą i stopę/dni obowiązujące w danym okresie, następnie odsetki, kapitał, opłaty i saldo po racie. Zalecane kolumny to:

| Kolumna | Znaczenie |
| --- | --- |
| Numer i data raty | pozwalają odtworzyć kolejność i RRSO |
| Saldo przed ratą | baza naliczenia odsetek |
| Oprocentowanie / liczba dni | założenie zastosowane w tym okresie |
| Rata kapitałowo-odsetkowa | `A_t` |
| Odsetki | `I_t` |
| Kapitał | `C_t` |
| Inne koszty | `F_t` wraz z opisem |
| Pełna płatność | `A_t + F_t` |
| Saldo po racie | `B_t` |

Takie rozbicie jest zgodne z wzorem tabeli spłat przewidzianym dla kredytu hipotecznego: harmonogram, wysokość raty, należne odsetki, inne koszty w racie, spłacany kapitał i saldo pozostałe po płatności.[^3]

### 8.2. Spójności, które harmonogram musi spełniać

Przy pełnej spłacie bez dodatkowych zdarzeń:

- `B_t = B_(t-1) - C_t` w każdym wierszu;
- suma niezaokrąglonych części kapitałowych wynosi `B0`;
- saldo końcowe wynosi zero w ustalonej tolerancji;
- suma rat kapitałowo-odsetkowych jest równa sumie kapitału i odsetek;
- pełny wypływ konsumenta obejmuje również wszystkie `F_t` oraz obowiązkowe koszty poza harmonogramem.

Jeżeli ostatnie saldo po obliczeniach groszowych nie jest równe zeru, ostatnią ratę kapitałową koryguje się o pozostałą różnicę. Nie powinno się sztucznie usuwać tej różnicy bez korekty raty — w przeciwnym razie suma kapitału przestaje odpowiadać saldu.

### 8.3. Zaokrąglenia

Najbezpieczniejsza procedura to:

1. liczyć stopę, odsetki, kapitał i saldo z wysoką precyzją dziesiętną;
2. prezentować kwoty do dwóch miejsc po przecinku zgodnie z jedną regułą zaokrąglania;
3. w końcowym wierszu wykonać kontrolowaną korektę kapitału i pełnej raty do dokładnej spłaty salda;
4. zachować w metadanych informację, czy bank zaokrągla każdą ratę, odsetki dzienne czy tylko wartości prezentowane.

Zaokrąglanie salda i odsetek po każdym działaniu do grosza może dawać wynik odmienny od bankowego, jeśli umowa stosuje inną kolejność zaokrągleń. Różnica kilku groszy nie dowodzi błędu modelu, ale różnica powinna być wyjaśniona i mierzalna.

## 9. Całkowita kwota do zapłaty i całkowity koszt kredytu

### 9.1. Definicje

Zgodnie z ustawą o kredycie konsumenckim całkowity koszt obejmuje wszelkie znane kredytodawcy koszty, które konsument ma ponieść w związku z umową — w szczególności odsetki, opłaty, prowizje, podatki i marże oraz wymagane koszty usług dodatkowych; definicja ustawowa zawiera także wskazane wyłączenia, m.in. opłaty notarialne.[^1] Całkowita kwota do zapłaty jest sumą tego kosztu i całkowitej kwoty kredytu.[^1]

W zapisie:

`CKK = odsetki + prowizje + opłaty + wymagane ubezpieczenia i usługi dodatkowe + inne obowiązkowe koszty objęte umową`

`CKZ = K + CKK`

gdzie `CKK` oznacza całkowity koszt kredytu, a `CKZ` całkowitą kwotę do zapłaty.

### 9.2. Metoda oparta na przepływach pieniężnych

Najbardziej odporna metoda polega na utworzeniu pełnego rejestru obowiązkowych płatności konsumenta:

- opłaty pobrane przy zawarciu umowy,
- raty kapitałowo-odsetkowe,
- prowizje i składki pobierane okresowo,
- obowiązkowe koszty płatne poza ratą,
- wymagane koszty końcowe.

Suma tych płatności jest operacyjną wartością `CKZ`, o ile zawiera wszystkie należne elementy. Następnie `CKK = CKZ - K`. Dzięki temu nie dochodzi do pomyłki, gdy prowizja jest **kredytowana**: zwiększa saldo `B0` i jest spłacana w ratach, ale nadal pozostaje kosztem, natomiast nie zwiększa ustawowej całkowitej kwoty kredytu `K`.[^1][^2]

Należy odróżniać:

- **sumę rat widocznych w harmonogramie** — nie obejmie opłaty pobranej z góry poza harmonogramem;
- **całkowity wypływ środków konsumenta** — obejmuje również obowiązkowe koszty poza ratami;
- **całkowitą kwotę do zapłaty** — pojęcie ustawowe zdefiniowane przez `K + CKK`.

W uproszczonym modelu bez kosztów dodatkowych zachodzi: `CKZ = suma rat`, a `CKK = suma rat - K = suma odsetek`. Tych równości nie należy stosować, gdy występują opłaty.

### 9.3. Co wyłączyć albo oznaczyć osobno

Do bazowego kosztu umownego nie należy bezwarunkowo dopisywać opłat za opóźnienie, windykację czy zdarzenia zależne od naruszenia umowy, ponieważ nie są kosztem, który konsument ma ponieść przy terminowej realizacji; wyłączenie takich opłat wynika również z zasad kalkulacji RRSO.[^8] Koszt dobrowolnej usługi dodatkowej należy oznaczyć jako opcjonalny, a nie mieszać z kosztem obowiązkowym. Jeśli jej zawarcie jest warunkiem uzyskania kredytu lub danych warunków, należy ją uwzględnić, gdy jest znana kredytodawcy.[^1][^8]

## 10. RRSO: czym jest i jak ją liczyć

### 10.1. Sens wskaźnika

RRSO nie jest sumą oprocentowania nominalnego i prowizji. Jest roczną stopą dyskontową, która zrównuje wartość otrzymanych przez konsumenta środków z wartością wszystkich uzgodnionych spłat i kosztów w ich rzeczywistych terminach. Taką konstrukcję określa prawo UE; polska ustawa wymaga podania RRSO wraz z założeniami w reprezentatywnym przykładzie.[^8][^9]

W szczególności RRSO zależy od momentu pobrania prowizji. Ta sama prowizja pobrana na początku zwykle ma większy wpływ na RRSO niż pobrana później, mimo identycznej wartości nominalnej.

### 10.2. Równanie przepływów

Niech `C_k` oznacza środki udostępnione konsumentowi w chwili `t_k`, a `D_l` — spłatę lub opłatę konsumenta w chwili `s_l`, przy czym czasy są wyrażone w latach od pierwszego uruchomienia środków. RRSO `X` spełnia:

`Σ [C_k / (1 + X)^(t_k)] = Σ [D_l / (1 + X)^(s_l)]`

Jest to podstawowe równanie z załącznika do dyrektywy konsumenckiej UE.[^8] Dla wypłaty jednej kwoty dziś i miesięcznych rat można przyjąć daty rzeczywiste; uproszczenie `s_l = l / 12` jest uzasadnione wyłącznie przy równych miesiącach modelowych.

### 10.3. Procedura numeryczna

Ponieważ zazwyczaj nie da się wyizolować `X` prostym przekształceniem, należy:

1. zbudować listę wszystkich dodatnich i ujemnych przepływów wraz z datami;
2. zdefiniować funkcję różnicy wartości bieżących `f(X)` jako lewa strona minus prawa strona równania;
3. znaleźć `X`, dla którego `f(X)` jest bliskie zeru, np. metodą bisekcji lub metodą Newtona z ograniczeniami;
4. potwierdzić małą wartość błędu końcowego i udokumentować założenia dotyczące dat, wypłat i opłat;
5. wyświetlić wynik jako procent roczny dopiero po obliczeniu.

Bisekcja jest wolniejsza, ale stabilniejsza, gdy przedział stóp zmienia znak funkcji. Metoda Newtona jest szybka, lecz może nie zbiegać się przy słabym punkcie startowym. Dla typowego kredytu z jedną wypłatą i późniejszymi płatnościami istnieje zwykle jedno ekonomicznie sensowne rozwiązanie; przy nietypowych, naprzemiennych przepływach może być ich więcej, dlatego trzeba walidować strukturę przepływów.

### 10.4. Ograniczenia porównawcze

RRSO jest użyteczna do porównania ofert o podobnej kwocie, terminach i konstrukcji. Nie zastępuje jednak porównania kwoty do zapłaty ani maksymalnej miesięcznej raty. Przy krótkich kredytach roczne przeskalowanie może być dla odbiorcy mniej intuicyjne, mimo że wskaźnik pozostaje poprawny metodologicznie.[^2]

## 11. Wskaźnik obciążenia dochodu (DTI / DSTI)

### 11.1. Definicja orientacyjna

Do edukacyjnej oceny bieżącego obciążenia użyteczna jest miesięczna relacja:

`Obciążenie (%) = [(P_nowa + Z_obecne) / D_netto] × 100%`

gdzie:

- `P_nowa` to pełna wymagalna płatność nowego zobowiązania w danym miesiącu — nie tylko część kapitałowo-odsetkowa, jeżeli obowiązkowe koszty są płatne co miesiąc;
- `Z_obecne` to miesięczne płatności z istniejących kredytów oraz trwałe, nieodwołalne zobowiązania finansowe, zgodnie z przyjętym zakresem;
- `D_netto` to wiarygodny, powtarzalny miesięczny dochód netto gospodarstwa domowego lub konkretnego kredytobiorcy — zakres musi być opisany.

KNF definiuje DtI jako relację wydatków związanych z obsługą zobowiązań kredytowych oraz innych zobowiązań finansowych do dochodu klienta.[^5] Jest to wskaźnik pomocniczy: nie mierzy aktywów, kosztów życia, ryzyka dochodu ani historii spłat.

### 11.2. Różne sensowne warianty

| Przeznaczenie | Licznik | Prezentacja |
| --- | --- | --- |
| Bieżąca rata | `P_1 + Z_obecne` | obciążenie pierwszego miesiąca |
| Maksymalne obciążenie harmonogramu | `max(P_t) + Z_obecne` | właściwe dla rat malejących lub zmiennej stopy w zadanym scenariuszu |
| Obciążenie po kosztach mieszkaniowych | `P_t + Z_obecne + koszty mieszkaniowe` | bliższe analizie budżetu, ale należy jasno zmienić nazwę wskaźnika |
| Wolna nadwyżka | `D_netto - P_t - Z_obecne - wydatki podstawowe` | wartość kwotowa, uzupełniająca procent |

W przypadku rat równych przy stałej stopie pierwsza i typowa rata są takie same. W przypadku rat malejących do ostrożnej oceny należy pokazać co najmniej ratę pierwszą albo maksimum harmonogramu, nie tylko średnią.

### 11.3. Interpretacja i progi

Nie istnieje uniwersalny prawny próg, którego przekroczenie automatycznie oznacza odmowę kredytu. KNF wskazuje, że bank powinien przyjmować obiektywnie bezpieczny poziom obciążenia oraz że formuła oceny musi uwzględniać wszystkie istotne elementy zdolności i wiarygodności; poziom jest elementem zarządzania ryzykiem banku.[^5][^6] Historyczne wartości 40% i 50% pojawiały się w dawnych komunikatach dotyczących sytuacji wymagających szczególnej uwagi, lecz nie powinny być prezentowane jako aktualna, powszechnie obowiązująca granica dla każdego konsumenta.[^10]

Rzetelny kalkulator powinien zatem używać określenia **„orientacyjny wskaźnik obciążenia dochodu”**, podawać wzór i zakres zobowiązań, a nie komunikować „zdolność kredytową” ani decyzję „kredyt dostępny / niedostępny”. KNF zwraca także uwagę na uwzględnianie ryzyka spadku dochodu rozporządzalnego i wzrostu wydatków stałych.[^11]

## 12. Przypadki szczególne i zdarzenia po zawarciu umowy

### 12.1. Prowizja i ubezpieczenie

Każdy koszt musi otrzymać trzy atrybuty: **czy jest wymagany**, **kiedy jest płacony**, **czy jest finansowany**. Prowizja 1 000 zł może być:

- płatna z góry: zwiększa `CKK` i `CKZ`, lecz nie saldo `B0`;
- potrącona z wypłaty: konsument otrzymuje mniej niż nominalnie wskazana kwota; przepływ do RRSO musi odzwierciedlać rzeczywiście udostępnione środki;
- kredytowana: zwiększa `B0`, jest spłacana wraz z odsetkami, lecz nie powinna zwiększać `K` w definicji ustawowej.[^1][^2]

### 12.2. Nadpłata i wcześniejsza spłata

Nadpłata jest dodatkowym przepływem, który obniża saldo od daty jej zaksięgowania. Po niej umowa może skracać okres albo obniżać ratę — są to dwa odmienne scenariusze. Bez informacji o zasadzie rozliczenia nie można wiarygodnie wyznaczyć dalszych rat ani oszczędności odsetek. Wyliczenia kosztu dla pierwotnego harmonogramu nie należy przedstawiać jako kosztu po nadpłacie.

### 12.3. Opóźnienie w spłacie

Opóźnienie wymaga odrębnego modelu: daty faktycznej zapłaty, odsetek za opóźnienie, kolejności zaliczeń i ewentualnych kosztów. Nie należy dodawać tych kosztów do standardowego harmonogramu terminowej spłaty ani podstawowej RRSO. Ustawa wymaga wskazania w umowie zasad i terminów spłaty, w tym kolejności zaliczania rat na należności kredytodawcy.[^4]

### 12.4. Kredyt walutowy, indeksowany i wielowalutowy

Potrzebne są waluta zobowiązania, kursy, źródło kursu, data i kierunek przeliczenia dla wypłaty oraz każdej raty. Bez tych informacji nie istnieje jeden poprawny harmonogram w PLN. Zasady ustalania kursu dla kwoty, transz i rat powinny wynikać z umowy.[^12]

## 13. Wymagania jakościowe i plan późniejszej weryfikacji

Niezależna weryfikacja kalkulatora powinna sprawdzać co najmniej:

1. **Parametry wejściowe:** czy okres jest poprawnie zamieniany na liczbę rat, procent na liczbę dziesiętną, a koszt finansowany odróżniany od `K`.
2. **Model rat:** czy wybrany wariant jest jednoznaczny, zero procent obsłużony osobno i nie mieszają się stopa nominalna, efektywna oraz dzienna.
3. **Harmonogram:** czy w każdym wierszu działa zależność saldo–kapitał–odsetki oraz saldo końcowe po korekcie wynosi zero.
4. **Sumy:** czy suma rat, odsetek, opłat i kapitału jest spójna z definicjami `CKK` i `CKZ`; opłaty z góry nie mogą zniknąć tylko dlatego, że nie są w tabeli rat.
5. **RRSO:** czy obliczenie korzysta z pełnych przepływów i dat, a nie z prostego przeliczenia stopy nominalnej.
6. **Obciążenie dochodu:** czy licznik obejmuje właściwą pełną ratę i istniejące zobowiązania, mianownik jest dodatnim dochodem netto, a wynik jest opisany jako orientacyjny.
7. **Precyzja:** czy grosze są zaokrąglane konsekwentnie, ostatnia rata wyrównuje saldo, a wyświetlane kwoty są zgodne z wartościami sumarycznymi.
8. **Przypadki testowe:** 0%, jedna rata, bardzo długi okres, raty malejące, opłata z góry, opłata kredytowana, koszt miesięczny, zmiana stopy, nadpłata oraz skrajne obciążenie dochodu.

### Minimalne własności testowe

| Scenariusz | Oczekiwany wynik |
| --- | --- |
| `r = 0` | suma odsetek = 0; rata kapitałowa = saldo / liczba rat |
| jedna rata | kapitał w całości spłacany w pierwszym terminie; odsetki zależą od jednej długości okresu |
| raty równe, stała stopa | rata finansowa jest stała przed korektą ostatniej raty; udział kapitału rośnie |
| raty malejące, stała stopa | część kapitałowa jest stała przed korektą; rata całkowita maleje |
| prowizja płatna z góry | zwiększa koszt i RRSO, ale nie saldo, jeśli nie jest finansowana |
| prowizja kredytowana | zwiększa saldo i odsetki; nie staje się przez to całkowitą kwotą kredytu |
| ostatnia rata | saldo po racie = 0, a suma kapitału = saldo początkowe |

## 14. Ograniczenia metodologii

Metodologia wylicza umowne przepływy na podstawie dostarczonych założeń. Nie wycenia ryzyka kredytowego, nie prognozuje przyszłych stóp, kursów ani dochodów, nie uwzględnia decyzji banku i nie zastępuje formularza informacyjnego, umowy lub porady prawnej. W razie rozbieżności rozstrzygające są warunki konkretnej umowy, jej harmonogram oraz przepisy właściwe dla produktu.

Przy kredycie konsumenckim informacje reklamowe i przedumowne obejmują m.in. stopę, całkowitą kwotę kredytu, RRSO, a w stosownych przypadkach czas umowy, całkowitą kwotę do zapłaty i wysokość rat.[^4] Dlatego porównywanie wyniku symulatora z ofertą powinno zawsze zaczynać się od porównania tych samych parametrów i tych samych dat, a nie tylko „oprocentowania”.

## 15. Praktyczna ocena ryzyka kredytowego

### 15.1. Co oznacza „ryzyko kredytowe” w praktyce

Ryzyko kredytowe to ryzyko, że kredytobiorca nie spłaci zobowiązania zgodnie z umową. Nie jest ono tożsame z wysokością raty, RRSO ani jednym wskaźnikiem DTI. W polskiej praktyce bank uzależnia udzielenie kredytu od zdolności kredytowej, rozumianej jako zdolność do spłaty kredytu wraz z odsetkami w terminach umownych.[^13] Dla kredytu konsumenckiego kredytodawca ma obowiązek dokonać takiej oceny przed zawarciem umowy i może oprzeć ją na informacjach od konsumenta oraz odpowiednich bazach danych.[^14]

Bankowa ocena nie jest publicznym, jednolitym wzorem. Instytucja łączy reguły polityki kredytowej, weryfikację danych, modele scoringowe oraz ocenę ekspercką; progi i wagi są zależne od produktu, segmentu klienta i apetytu na ryzyko. Dlatego aplikacja edukacyjna nie powinna deklarować „prawdopodobieństwa otrzymania kredytu” ani naśladować rzekomego bankowego scoringu bez danych, walidacji modelu i uprawnienia do korzystania z właściwych baz.

### 15.2. Warstwy faktycznej oceny

Poniższy model odzwierciedla strukturę często spotykaną w praktyce, lecz nie zastępuje procedury konkretnego banku.

| Warstwa | Pytanie decyzyjne | Przykładowe dane / miary | Znaczenie |
| --- | --- | --- | --- |
| Zdolność do obsługi długu | Czy miesięczne przepływy wystarczą na raty? | dochód netto, źródło i stabilność dochodu, koszty utrzymania, zobowiązania, DSTI/DTI, nadwyżka po wydatkach | podstawowa ocena wypłacalności |
| Odporność na zmianę warunków | Czy klient utrzyma spłatę po wzroście raty lub spadku dochodu? | rata przy stopie stresowej, stres dochodu i wydatków, długość okresu | ogranicza ryzyko nadmiernego optymizmu |
| Historia i wiarygodność | Czy dotychczasowe zachowanie płatnicze wskazuje na podwyższone ryzyko? | zweryfikowane dane z baz, historia spłat, aktualne zaległości, kompletność i spójność dokumentów | uzupełnia analizę dochodu; nie wolno go zastępować deklaracją użytkownika |
| Zabezpieczenie — gdy występuje | Jaka jest relacja finansowania do wartości zabezpieczenia? | `LTV = saldo kredytu / wartość zabezpieczenia × 100%`, płynność i stan prawny zabezpieczenia | istotne zwłaszcza w finansowaniu hipotecznym; nie poprawia samoistnie bieżącej zdolności do rat |
| Cechy produktu | Czy konstrukcja produktu zwiększa ryzyko? | zmienna stopa, waluta, karencja, rata balonowa, długość okresu, cel kredytu | determinuje możliwy przyszły profil rat i salda |

KNF wskazuje, że ocena powinna obejmować zdolność i wiarygodność kredytową, a banki powinny korzystać z własnych i zewnętrznych baz danych.[^6] Wytyczne EBA dotyczące udzielania i monitorowania kredytów wymieniają ocenę zdolności kredytowej oraz metryki takie jak relacja obsługi długu do dochodu i — dla kredytów zabezpieczonych — LTV.[^15]

### 15.3. Przejrzysty wskaźnik edukacyjny: odporność spłaty

Zamiast nieprzejrzystego „wyniku scoringowego” kalkulator może pokazywać **wskaźnik odporności spłaty** w dwóch jawnych elementach. Nie jest to punktacja bankowa ani decyzja kredytowa.

1. Ustala się ratę stresową `P_stres`. Dla stałej raty i przyjętego bufora `b` punktów procentowych oblicza się ją tak samo jak ratę annuitetową, zastępując roczną stopę `r` wartością `r + b`. Przy zmiennej stopie trzeba zastosować scenariusz opisany w umowie lub przyjęty jawnie w symulacji.
2. Oblicza się obciążenie stresowe:

   `DSTI_stres (%) = [(P_stres + Z_obecne) / D_netto] × 100%`

3. Oblicza się nadwyżkę po obsłudze długu:

   `Nadwyżka_stres = D_netto - Z_obecne - P_stres - W_podstawowe`

   gdzie `W_podstawowe` są deklarowanymi, powtarzalnymi kosztami gospodarstwa domowego. Jeżeli aplikacja ich nie zbiera, musi wyraźnie oznaczyć, że pokazuje **nadwyżkę przed kosztami życia**, a nie pełną zdolność.

Interpretacja edukacyjna:

- `Nadwyżka_stres ≤ 0` — brak dodatniej gotówki po obsłudze długu w przyjętym scenariuszu; to sygnał wysokiej wrażliwości, nie automatyczna decyzja odmowna.
- `Nadwyżka_stres > 0` — dodatnia nadwyżka, której wysokość należy analizować razem ze stabilnością dochodu i innymi kosztami.
- wzrost `DSTI_stres` względem bieżącego DTI pokazuje wrażliwość wyniku na zmianę stopy, a nie prognozę przyszłej stopy.

Wybór bufora `b` musi być ujawniony obok wyniku. Nie powinien być prezentowany jako stały próg prawny; KNF wskazuje minimalny bufor dla części kredytów mieszkaniowych jako parametr zależny od charakterystyki produktu i ryzyk rozpoznawanych przez bank.[^16]

### 15.4. Wynik ryzyka jako klasyfikacja, nie „bank score”

Jeżeli potrzebna jest jedna etykieta w aplikacji, właściwsza jest klasyfikacja oparta na jawnych regułach niż liczba udająca wewnętrzny scoring. Przykładowa struktura:

| Status | Reguła edukacyjna | Komunikat |
| --- | --- | --- |
| Wymaga uwagi | brak danych o dochodzie, zobowiązaniach lub kosztach życia | „Uzupełnij dane; nie można ocenić odporności budżetu.” |
| Podwyższona wrażliwość | `Nadwyżka_stres ≤ 0` albo bieżące DTI przekracza 100% | „W przyjętym scenariuszu budżet nie pokrywa pełnej obsługi długu.” |
| Do dalszej analizy | dodatnia nadwyżka, lecz brak danych o stabilności dochodu, historii lub zabezpieczeniu | „Wynik budżetowy jest niepełny; instytucja oceni dodatkowe czynniki.” |
| Nie oceniaj automatycznie | istnieje informacja o aktualnych zaległościach, niespójnych danych lub finansowaniu walutowym | „Wymagana jest indywidualna analiza; nie wyprowadzaj decyzji z kalkulatora.” |

Nie należy oznaczać statusu „niskie ryzyko” wyłącznie na podstawie dodatniej nadwyżki lub niskiego DTI. Brak zaległości i zdolność do płatności są różnymi wymiarami ryzyka, a weryfikacja historii wymaga danych, których publiczny kalkulator nie posiada.

### 15.5. Modele bankowe: PD, LGD i EAD

W zarządzaniu portfelem kredytowym instytucje mogą modelować m.in.:

- **PD (probability of default)** — prawdopodobieństwo niewykonania zobowiązania w zdefiniowanym horyzoncie;
- **LGD (loss given default)** — oczekiwaną część ekspozycji utraconą po niewykonaniu zobowiązania, po uwzględnieniu odzysków i zabezpieczeń;
- **EAD (exposure at default)** — ekspozycję oczekiwaną w chwili niewykonania zobowiązania.

Iloczyn `PD × LGD × EAD` bywa używany jako intuicyjny opis oczekiwanej straty portfelowej, ale nie jest wzorem do samodzielnego wydawania decyzji konsumenckiej. Wyznaczenie tych parametrów wymaga danych historycznych, definicji niewykonania zobowiązania, kalibracji, monitorowania jakości modelu i nadzoru. W kalkulatorze edukacyjnym należy pozostać przy przejrzystych miarach budżetowych oraz wyraźnie odróżnić je od bankowej analizy ryzyka.

### 15.6. Minimalny zakres danych dla przyszłego modułu

Moduł odporności spłaty powinien zbierać co najmniej: dochód netto, liczbę źródeł dochodu i ich stabilność, obecne raty/limity, powtarzalne koszty utrzymania, rodzaj i stopę kredytu, okres, planowane nadpłaty oraz — tylko przy kredycie zabezpieczonym — wartość i typ zabezpieczenia. Dane o historii kredytowej nie powinny być deklarowane jako zweryfikowane, jeśli aplikacja nie ma legalnego i technicznego dostępu do odpowiednich źródeł.

Wynik należy prezentować w następującej kolejności: bieżąca rata i DTI, założenia scenariusza stresowego, rata stresowa, nadwyżka stresowa, ograniczenia danych oraz zastrzeżenie, że ocena banku może być inna. Taki układ jest użyteczny edukacyjnie, a jednocześnie nie sugeruje, że aplikacja zastępuje proces kredytodawcy.

## 16. Profil metodologii dla bieżącego formularza CreditScope

### 16.1. Zakres danych, które użytkownik rzeczywiście podaje

Bieżący formularz CreditScope zbiera wyłącznie następujące dane:

| Pole formularza | Symbol w metodologii | Zastosowanie |
| --- | --- | --- |
| Kwota kredytu | `K` i w modelu bazowym `B0` | kapitał początkowy |
| Oprocentowanie nominalne w skali roku | `r` | konwersja do miesięcznej stopy `i = r / 12` po uprzedniej zmianie procentu na zapis dziesiętny |
| Okres spłaty w pełnych latach | `n = lata × 12` | liczba miesięcznych rat |
| Miesięczny dochód netto | `D_netto` | mianownik wskaźnika obciążenia budżetu |
| Miesięczne zobowiązania | `Z_obecne` | istniejące obciążenia dodawane do raty nowego kredytu |

W rozszerzonej symulacji użytkownik może dodatkowo wybrać raty równe albo malejące oraz podać nadpłatę jednorazową i/lub cykliczną. Te dane opisują wyłącznie scenariusz spłaty kapitału; nie dodają informacji o historii kredytowej, stabilności dochodu, wydatkach życia ani zabezpieczeniu.

### 16.2. Kontrakt obliczeniowy CreditScope

Dla wyników podstawowych CreditScope należy jawnie przyjąć następujący kontrakt:

- jedna wypłata całej kwoty na początku okresu;
- rata płatna co miesiąc, w modelu bez konkretnych dat i bez naliczania dziennego;
- stała nominalna stopa roczna przez pełen okres, przeliczona jako `i = (r / 100) / 12`;
- raty równe w wyniku podstawowym; raty malejące są odrębnym wariantem rozszerzonym;
- brak prowizji, ubezpieczeń, opłat cyklicznych, kosztów konta, kosztów opóźnienia, podatków, kosztów notarialnych oraz kosztów kursowych;
- kwota z formularza jest równocześnie całkowitą kwotą kredytu `K` i początkowym saldem `B0`, ponieważ aplikacja nie obsługuje finansowania kosztów.

W tych granicach algorytm może poprawnie wyliczyć ratę, kapitał, odsetki, saldo i sumy. Nie wolno rozszerzać znaczenia wyniku poza ten kontrakt bez dodania odpowiednich danych wejściowych.

### 16.3. Definicje wyników widocznych w aplikacji

| Wynik CreditScope | Wzór / sposób wyliczenia | Prawidłowa interpretacja |
| --- | --- | --- |
| Miesięczna rata | `A = K × i / [1 - (1+i)^(-n)]`; dla `i = 0`: `K / n` | standardowa rata równa w przyjętym uproszczeniu; ostatnia rata może różnić się o korektę groszową |
| Suma do spłaty | `Σ A_t` z harmonogramu | suma rat w modelu bez kosztów pozaodsetkowych |
| Suma odsetek | `Σ I_t` | wszystkie odsetki modelu podstawowego |
| Całkowity koszt kredytu | `Σ A_t - K` | w **tym kalkulatorze** jest równy sumie odsetek, ponieważ nie ma danych o innych kosztach; nie jest pełnym ustawowym CKK rzeczywistej oferty |
| Harmonogram | kolejno `I_t = B_(t-1) × i`, `C_t = A_t - I_t`, `B_t = B_(t-1) - C_t` | miesięczny plan bez dat; pokazuje strukturę kapitału i odsetek |
| Orientacyjny wskaźnik obciążenia dochodu | `[(A + Z_obecne) / D_netto] × 100%` | bieżące obciążenie budżetu przed kosztami życia; nie jest zdolnością kredytową ani scoringiem |

Przy wariancie malejącym należy użyć `C_t = K / n`, `I_t = B_(t-1) × i`, `A_t = C_t + I_t`. Do wskaźnika obciążenia należy wtedy komunikować **pierwszą (najwyższą) ratę**, nie średnią ratę. Przy nadpłacie bieżący wariant CreditScope zachowuje założoną ratę planową i skraca okres; nadpłata powinna być traktowana jako dodatkowa część kapitałowa w danym miesiącu.

### 16.4. Wskaźnik możliwy do uczciwego pokazania dziś

Na podstawie obecnych pól kalkulator może rzetelnie pokazywać dwa wskaźniki budżetowe:

`Obciążenie bieżące (%) = [(A + Z_obecne) / D_netto] × 100%`

`Nadwyżka przed kosztami życia = D_netto - Z_obecne - A`

Drugi wynik jest prostym dopełnieniem pierwszego i warto go dodać do metodologii wyników, ale jego etykieta musi zawierać słowa **„przed kosztami życia”**. Aplikacja nie zbiera czynszu, alimentów, kosztów dzieci, transportu, żywności ani wydatków nieregularnych, więc nie może na jego podstawie wyświetlać „wolnych środków” ani oceny bezpieczeństwa kredytu.

Z tego samego powodu w bieżącej wersji nie należy generować jednolitego „wskaźnika ryzyka kredytowego”, kolorowego ratingu ani prawdopodobieństwa otrzymania kredytu. Dopuszczalny komunikat jakościowy brzmi: **„Wskaźnik pokazuje wyłącznie relację zadeklarowanej raty i zobowiązań do dochodu netto; bank oceni także inne dane.”** Jest to zgodne z rozróżnieniem między orientacyjnym DTI a pełną oceną zdolności i wiarygodności.[^5][^6][^13][^14]

### 16.5. Czego obecny formularz nie pozwala policzyć

| Wynik lub cecha | Brakujące dane | Poprawna prezentacja w obecnej wersji |
| --- | --- | --- |
| Ustawowy całkowity koszt kredytu / całkowita kwota do zapłaty oferty | prowizje, ubezpieczenia, koszty rachunku i usług, terminy ich płatności oraz informacja, czy są finansowane | „Suma w symulacji bez opłat dodatkowych” i „koszt odsetkowy w symulacji” |
| RRSO | wszystkie przepływy i ich daty, w tym koszty pobrane z góry | nie wyświetlać RRSO |
| Rata przy zmiennej stopie | indeks, marża, daty aktualizacji i reguła przeliczenia raty/okresu | „Symulacja stałej stopy nominalnej” |
| Odsetki według realnych dni | data wypłaty, data pierwszej i kolejnych rat, baza dni | „Model miesięczny” |
| Pełna odporność budżetowa | koszty życia, stabilność dochodu, scenariusz stresowy | nie wyświetlać ratingu ryzyka |
| Ocena historii i wiarygodności | zweryfikowane dane z właściwych baz oraz zgody / podstawa prawna | nie wyświetlać wyniku scoringowego |
| LTV i ryzyko zabezpieczenia | wartość, rodzaj i stan prawny zabezpieczenia | nie wyświetlać LTV |

### 16.6. Zalecane nazwy i komunikaty w interfejsie

Aby wynik był zgodny z zakresem danych, zalecane są następujące sformułowania:

- „**Miesięczna rata w symulacji**” zamiast sugerowania raty z konkretnej oferty;
- „**Suma rat w symulacji**” albo pozostawienie „Suma do spłaty” z dopiskiem „bez opłat dodatkowych”;
- „**Koszt odsetkowy w symulacji**” zamiast samodzielnego „Całkowity koszt kredytu”, dopóki formularz nie zbiera kosztów pozaodsetkowych;
- „**Orientacyjny wskaźnik obciążenia dochodu**” z aktualnym wyjaśnieniem wzoru;
- „**Symulacja stałej stopy nominalnej i miesięcznych rat**” w sąsiedztwie formularza lub wyników;
- dla modułu rozszerzonego: „Nadpłata skraca okres w symulacji; zasady banku mogą przewidywać inny sposób rozliczenia.”

Takie etykiety nie zmieniają obliczeń, lecz precyzyjnie ograniczają ich znaczenie do danych, które użytkownik rzeczywiście podaje. Stanowią właściwą bazę do późniejszej rozbudowy o koszty, RRSO, daty i moduł odporności spłaty.

## Źródła

[^1]: Sejm RP, Internetowy System Aktów Prawnych / ELI, „Ustawa z dnia 12 maja 2011 r. o kredycie konsumenckim — tekst jednolity, Dz.U. 2024 poz. 1497”, art. 5, dostęp 11 września 2026 r. [Tekst aktu](https://eli.gov.pl/api/acts/DU/2024/1497/text.html).

[^2]: Urząd Ochrony Konkurencji i Konsumentów, „Nie taki kredyt straszny — Ustawa o kredycie konsumenckim w pytaniach i odpowiedziach”, s. 10, dostęp 11 września 2026 r. [Publikacja UOKiK](https://uokik.gov.pl/download/12259).

[^3]: Sejm RP, ELI, „Ustawa z dnia 23 marca 2017 r. o kredycie hipotecznym oraz o nadzorze nad pośrednikami kredytu hipotecznego i agentami”, tekst aktu, w tym wzór tabeli harmonogramu, dostęp 11 września 2026 r. [Tekst aktu](https://eli.gov.pl/api/acts/DU/2017/819/text.html).

[^4]: Sejm RP, ELI, „Ustawa z dnia 12 maja 2011 r. o kredycie konsumenckim”, art. 7, 13 i 30, dostęp 11 września 2026 r. [Tekst aktu](https://eli.gov.pl/api/acts/DU/2023/1028/text.html).

[^5]: Komisja Nadzoru Finansowego, „Rekomendacja T dotycząca dobrych praktyk w zakresie zarządzania ryzykiem detalicznych ekspozycji kredytowych”, definicja DtI oraz rekomendacje dotyczące oceny zdolności, dostęp 11 września 2026 r. [Dokument KNF](https://www.knf.gov.pl/knf/pl/komponenty/img/rekomendacja_t_%2814_09_2018%29_63160.pdf).

[^6]: Komisja Nadzoru Finansowego, „Rekomendacja T”, rekomendacje 9–14, dostęp 11 września 2026 r. [Dokument KNF](https://www.knf.gov.pl/knf/pl/komponenty/img/knf_49957_Rekomendacja%20T_18474.pdf).

[^7]: Narodowy Bank Polski, „W jaki sposób NBP wpływa na krótkoterminowe stopy procentowe w gospodarce?”, dostęp 11 września 2026 r. [Materiał NBP](https://nbp.pl/wp-content/uploads/2022/09/stopy-procentowe.pdf).

[^8]: Parlament Europejski i Rada UE, „Dyrektywa 2008/48/WE w sprawie umów o kredyt konsumencki”, art. 3 i 19 oraz załącznik I, wersja skonsolidowana, dostęp 11 września 2026 r. [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02008L0048-20231230).

[^9]: Parlament Europejski i Rada UE, „Dyrektywa (UE) 2023/2225 w sprawie umów o kredyt konsumencki”, art. 3 i załącznik III, dostęp 11 września 2026 r. [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32023L2225).

[^10]: Komisja Nadzoru Finansowego, „Komunikat dotyczący zmian w Rekomendacji S”, opis historycznych poziomów 40% i 50%, dostęp 11 września 2026 r. [Komunikat KNF](https://www.knf.gov.pl/knf/pl/komponenty/img/2013_37265.pdf).

[^11]: Komisja Nadzoru Finansowego, „Ocena zdolności kredytowej a świadczenie Rodzina 800 plus — czego oczekuje UKNF?”, dostęp 11 września 2026 r. [Materiał KNF](https://www.knf.gov.pl/komunikacja/blog?articleId=98936&p_id=18).

[^12]: Sejm RP, ELI, „Ustawa — Prawo bankowe”, przepisy dotyczące zasad ustalania kursu w kredycie denominowanym lub indeksowanym, dostęp 11 września 2026 r. [Tekst aktu](https://eli.gov.pl/api/acts/DU/2022/2324/text.html).

[^13]: Sejm RP, ELI, „Ustawa — Prawo bankowe — tekst jednolity, Dz.U. 2024 poz. 1646”, art. 70 i 70a, dostęp 11 września 2026 r. [Tekst aktu](https://eli.gov.pl/api/acts/DU/2024/1646/text.html).

[^14]: Sejm RP, ELI, „Ustawa z dnia 12 maja 2011 r. o kredycie konsumenckim — tekst jednolity, Dz.U. 2024 poz. 1497”, art. 9 i 9a, dostęp 11 września 2026 r. [Tekst aktu](https://eli.gov.pl/api/acts/DU/2024/1497/text.html).

[^15]: European Banking Authority, „Guidelines on loan origination and monitoring”, EBA/GL/2020/06, dostęp 11 września 2026 r. [Strona wytycznych](https://www.eba.europa.eu/activities/single-rulebook/regulatory-activities/credit-risk/guidelines-loan-origination-and-monitoring) oraz [tekst wytycznych](https://www.eba.europa.eu/sites/default/files/document_library/Publications/Guidelines/2020/Guidelines%20on%20loan%20origination%20and%20monitoring/884283/EBA%20GL%202020%2006%20Final%20Report%20on%20GL%20on%20loan%20origination%20and%20monitoring.pdf).

[^16]: Komisja Nadzoru Finansowego, „Stanowisko UKNF w sprawie oceny zdolności kredytowej przy udzielaniu kredytów oprocentowanych zmienną i okresowo stałą stopą procentową”, aktualizacja 7 lutego 2023 r., dostęp 11 września 2026 r. [Komunikat KNF](https://www.knf.gov.pl/komunikacja/komunikaty?articleId=81069&p_id=18).
