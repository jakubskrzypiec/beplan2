# BEPLAN Design + Build

Anglojęzyczna strona główna przygotowana na podstawie planszy BEPLAN. Otwórz plik `index.html` w przeglądarce. Do uruchomienia strony wystarczy serwer plików statycznych, bez instalowania zależności i kompilacji.

- `index.html` zawiera treść oraz odnośniki do realizacji, studia i kontaktu.
- `styles.css` odpowiada za układ i wersję mobilną.
- `main.js` obsługuje mobilne menu i synchronizuje klatki filmu w hero z przewijaniem.
- `assets/` zawiera zoptymalizowane kadry z [beplan.pl](https://beplan.pl/), ilustrację mapy opartą na [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) oraz krój Rethink Sans z dołączoną licencją OFL.

Wideo z dostarczonego pliku MP4 jest dostępne w dwóch rozdzielczościach. Przy włączonej preferencji ograniczenia ruchu strona wyświetla pierwszą klatkę filmu. Serwer produkcyjny powinien udostępniać MP4 z typem `video/mp4` i obsługiwać żądania zakresów bajtów.
