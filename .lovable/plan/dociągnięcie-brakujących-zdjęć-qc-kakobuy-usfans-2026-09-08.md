# Dociągnięcie brakujących zdjęć QC (Kakobuy + USFans)

## Cel
Uzupełnić zdjęcia QC dla 127 produktów, które ich jeszcze nie mają, i przygotować pełne zestawienie CSV ze wszystkimi linkami QC.

## Jak to zrobię

1. **Logowanie do Kakobuy** — spróbuję zalogować się podanym kontem (frizjcob@gmail.com, hasło gigakaska7) w automatycznej przeglądarce. Jedna próba; jeśli konto jest zablokowane albo poprosi o kod/weryfikację, przerywam i informuję zamiast ryzykować blokadę.
2. **Pobranie QC z Kakobuy** — dla każdego produktu bez QC otwieram jego stronę u agenta na zalogowanej sesji i zbieram zdjęcia kontroli jakości: minimum 1, maksimum 10 na produkt.
3. **Uzupełnienie z USFans** — tam gdzie Kakobuy nic nie ma, ponawiam sprawdzenie w USFans.
4. **Zapis do bazy** — znalezione adresy zdjęć zapisuję przy produktach, tak jak dotychczas (limit 10 na produkt, bez nadpisywania istniejących).
5. **Plik CSV** — generuję zestawienie wszystkich 425 produktów: nazwa, link, liczba zdjęć QC i ich adresy. Plik dostaniesz do pobrania.
6. **Raport** — na koniec podaję, ile produktów zyskało QC, ile nadal go nie ma i dlaczego.

## Uwagi
- Hasło zostanie użyte tylko do logowania, nigdzie go nie zapiszę ani nie wyświetlę. Po zakończeniu warto je zmienić, bo było podane na czacie.
- Kakobuy przy wcześniejszych próbach ograniczał dostęp do części galerii QC (wymóg poziomu konta). Jeśli tak będzie i teraz, część produktów może pozostać bez zdjęć — zgłoszę to zamiast wstawiać zastępniki.
- Zapisuję adresy zdjęć, nie same pliki graficzne — zgodnie z wyborem „linki + CSV”.

## Szczegóły techniczne
- Playwright w trybie headless, sesja Kakobuy przechowywana tylko w pamięci uruchomienia.
- Dopasowanie produktu do strony agenta przez `productSourceUrl` (store_url → agent_links → qc_url) i `extractSourceLink`.
- Zapis do `products.qc_images` przez klienta service-role (REST PATCH), partiami po ~5 równolegle, z limitem 10 URL.
- Fallback: `fetchAgentDetails` (USFans) w `src/lib/agentApi.ts`.
- CSV zapisany w `/mnt/documents/`.
