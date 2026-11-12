# BEPLAN Design + Build

Anglojęzyczna strona główna przygotowana na podstawie planszy BEPLAN. Uruchom katalog przez serwer plików statycznych. Strona nie wymaga instalowania zależności ani kompilacji.

- `index.html` zawiera treść oraz odnośniki do realizacji, studia i kontaktu.
- `styles.css` odpowiada za układ i wersję mobilną.
- `main.js` obsługuje mobilne menu, film sterowany przewijaniem i formularz, który otwiera szkic w aplikacji pocztowej. Formularz na [beplan.pl](https://beplan.pl/#contact-anchor) pozwala wysłać wiadomość w przeglądarce.
- `globe.js` wyświetla kopułę z miastami oznaczonymi w `index.html`. Pakiet `assets/globe-geometry.js` zawiera projekcję z d3-geo, funkcje z topojson-client i dane countries-110m z World Atlas oparte na [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/). Licencje znajdują się w `assets/globe-LICENSES.txt`.
- `assets/` zawiera także zoptymalizowane kadry z [beplan.pl](https://beplan.pl/) oraz krój Rethink Sans z dołączoną licencją OFL.

Hero wyświetla klatki filmu zapisane w `assets/hero-frames/`, w wersjach 1280 × 720 i 768 × 432. Każdy plik AVIF zawiera sześć klatek ułożonych w dwóch kolumnach. Przy ograniczeniu ruchu lub oszczędzaniu danych strona wyświetla pierwszą klatkę.
