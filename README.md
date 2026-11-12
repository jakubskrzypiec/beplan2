# BEPLAN Design + Build

Anglojęzyczna strona główna przygotowana na podstawie planszy BEPLAN. Uruchom katalog przez serwer plików statycznych. Strona nie wymaga instalowania zależności ani kompilacji.

- `index.html` zawiera treść oraz odnośniki do realizacji, studia i kontaktu.
- `styles.css` odpowiada za układ i wersję mobilną.
- `main.js` obsługuje mobilne menu, odtwarzanie filmu w hero i formularz, który otwiera szkic w aplikacji pocztowej. Formularz na [beplan.pl](https://beplan.pl/#contact-anchor) pozwala wysłać wiadomość w przeglądarce.
- `globe.js` wyświetla kopułę z miastami oznaczonymi w `index.html`. Pakiet `assets/globe-geometry.js` zawiera projekcję z d3-geo, funkcje z topojson-client i dane countries-110m z World Atlas oparte na [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/). Licencje znajdują się w `assets/globe-LICENSES.txt`.
- `assets/` zawiera także zoptymalizowane kadry z [beplan.pl](https://beplan.pl/) oraz krój Rethink Sans z dołączoną licencją OFL.

Hero odtwarza film MP4 w wersjach 1920 × 1080 i 960 × 540. Po przewinięciu sekcji odtwarzanie jest wstrzymywane. Przy ograniczeniu ruchu lub oszczędzaniu danych strona wyświetla pierwszą klatkę.
