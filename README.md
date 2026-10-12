# Portofolio Data Analyst

Website portofolio Data Analyst yang modern dan penuh animasi. Dibuat dengan HTML, CSS, dan JavaScript murni, ditambah [Chart.js](https://www.chartjs.org/) untuk grafik.

## Fitur & animasi

- **Preloader**: bar chart beranimasi dengan penghitung persentase
- **Kursor kustom** dan **progress bar** saat scroll
- **Navbar**: blur saat di-scroll, tersembunyi saat scroll ke bawah, menandai link aktif, dan punya menu burger di mobile
- **Hero**: latar jaringan partikel di canvas yang bereaksi terhadap mouse, teks mengetik otomatis, kartu dashboard 3D tilt dengan garis grafik yang "tergambar", dan angka KPI yang menghitung naik
- **Marquee** daftar tools yang berjalan terus
- **Tentang**: avatar blob yang berubah bentuk dan orbit berputar
- **Keahlian**: progress bar dengan efek shimmer dan radar chart
- **Proyek**: filter dengan indikator geser, kartu tilt + spotlight, mini chart di setiap kartu, dan modal studi kasus
- **Dashboard interaktif**: filter tahun dan wilayah, tombol acak data, transisi grafik, KPI yang ter-animasi, dan insight otomatis
- **Timeline** pengalaman yang garisnya terisi mengikuti scroll, plus kartu sertifikasi
- **Form kontak**: label melayang, validasi dengan animasi getar, dan toast notifikasi
- **Mode gelap/terang** (tersimpan di browser), responsif, dan menghormati `prefers-reduced-motion`

## Struktur

```
index.html
css/style.css
js/main.js
assets/        # taruh foto & file CV di sini
```

## Menjalankan

Cukup buka `index.html` di browser, atau jalankan server lokal:

```bash
python3 -m http.server 8000
```

## Kustomisasi

- Ganti nama, email, LinkedIn, dan teks lainnya di `index.html`.
- Data proyek ada di array `projects` di `js/main.js`.
- Warna tema diatur lewat variabel CSS di bagian `:root` pada `css/style.css`.
- Form kontak masih simulasi. Hubungkan ke Formspree/EmailJS supaya pesan benar-benar terkirim.
