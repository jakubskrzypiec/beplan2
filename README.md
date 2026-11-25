# BEPLAN Design + Build

Strona główna po angielsku i polsku, przygotowana na podstawie planszy BEPLAN. Uruchom katalog przez serwer plików statycznych. Strona nie wymaga instalowania zależności ani kompilacji.

- `index.html` zawiera treść oraz odnośniki do realizacji, studia i kontaktu.
- `styles.css` odpowiada za układ i wersję mobilną.
- `main.js` obsługuje mobilne menu i formularz, który otwiera szkic w aplikacji pocztowej. Formularz na [beplan.pl](https://beplan.pl/#contact-anchor) pozwala wysłać wiadomość w przeglądarce.
- Hero odtwarza film w pętli (`assets/hero-loop.mp4`, lżejszy `assets/hero-loop-mobile.mp4` na telefonach), uruchamiany w `main.js`. Przy ograniczeniu ruchu lub oszczędzaniu danych zostaje kadr `assets/hero.webp`. Plik `hero-walk.js` (spacer sterowany przewijaniem) nie jest już podpięty do strony.
- Język zmienia przełącznik EN/PL w nagłówku. Angielska treść znajduje się w `index.html` w elementach z atrybutem `data-i18n`, a polska w słowniku na początku `main.js`. Wybór zapisuje się w przeglądarce, a adres z `?lang=pl` lub `?lang=en` otwiera stronę w danym języku.
- `assets/clients/` zawiera logotypy klientów z [beplan.pl](https://beplan.pl/), przerobione na białe na przezroczystym tle.
- Logo BEPLAN (`assets/logo-beplan*.svg`) i zdjęcia realizacji w `assets/projects/` pochodzą z [beplan.pl](https://beplan.pl/). Znaki Glovo, Groupon i Mercedes-Benz w `assets/project-logos/` pochodzą z [Simple Icons](https://simpleicons.org/) (CC0, licencja obok), logo ByteDance z Wikimedia Commons. Wszystkie są znakami towarowymi swoich właścicieli.
- Nagłówki używają kroju Montserrat (`assets/montserrat-*.woff2`, licencja OFL w `assets/montserrat-OFL.txt`).
- Język zmienia przełącznik EN/PL/ES w nagłówku i w stopce. Polska i hiszpańska treść znajduje się w słownikach na początku `main.js`.
- `globe.js` wyświetla kopułę z miastami oznaczonymi w `index.html`. Pakiet `assets/globe-geometry.js` zawiera projekcję z d3-geo, funkcje z topojson-client i dane countries-110m z World Atlas oparte na [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/). Licencje znajdują się w `assets/globe-LICENSES.txt`.
- `assets/` zawiera także zoptymalizowane kadry z [beplan.pl](https://beplan.pl/) oraz krój Rethink Sans z dołączoną licencją OFL.


