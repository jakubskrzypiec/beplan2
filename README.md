# BEPLAN Design + Build

Strona główna po angielsku i polsku, przygotowana na podstawie planszy BEPLAN. Uruchom katalog przez serwer plików statycznych. Strona nie wymaga instalowania zależności ani kompilacji.

- `index.html` zawiera treść oraz odnośniki do realizacji, studia i kontaktu.
- `styles.css` odpowiada za układ i wersję mobilną.
- `main.js` obsługuje mobilne menu i formularz, który otwiera szkic w aplikacji pocztowej. Formularz na [beplan.pl](https://beplan.pl/#contact-anchor) pozwala wysłać wiadomość w przeglądarce.
- `hero-walk.js` synchronizuje spacer po wnętrzu z przewijaniem. Pliki `assets/hero-walk-*.bin` zawierają klatki H.264. Każdą klatkę poprzedza czterobajtowa długość w kolejności little-endian, a co osiem klatek znajduje się klatka kluczowa.
- Język zmienia przełącznik EN/PL w nagłówku. Angielska treść znajduje się w `index.html` w elementach z atrybutem `data-i18n`, a polska w słowniku na początku `main.js`. Wybór zapisuje się w przeglądarce, a adres z `?lang=pl` lub `?lang=en` otwiera stronę w danym języku.
- Spacer trzyma w pamięci zdekodowane klatki wokół bieżącej pozycji, z zapasem w kierunku przewijania. Przy szybkim przewijaniu pokazuje najbliższą gotową klatkę.
- `globe.js` wyświetla kopułę z miastami oznaczonymi w `index.html`. Pakiet `assets/globe-geometry.js` zawiera projekcję z d3-geo, funkcje z topojson-client i dane countries-110m z World Atlas oparte na [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/). Licencje znajdują się w `assets/globe-LICENSES.txt`.
- `assets/` zawiera także zoptymalizowane kadry z [beplan.pl](https://beplan.pl/) oraz krój Rethink Sans z dołączoną licencją OFL.

Spacer ma wersję 1920 × 1080 i lżejszą 960 × 540. Gdy WebCodecs jest niedostępne, przewijanie ustawia pozycję w pliku MP4. Przy ograniczeniu ruchu lub oszczędzaniu danych strona wyświetla pierwszą klatkę.
