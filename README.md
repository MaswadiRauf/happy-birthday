# Cerita Ress

Proyek web interaktif (kode PIN, buku, bunga, pertanyaan, kue, cerita foto, surat).

## Cara menjalankan
1. Buka folder ini di VS Code (`File > Open Folder`).
2. Install ekstensi **Live Server** (akan disarankan otomatis).
3. Klik kanan `index.html` > **Open with Live Server**.
   Atau buka `index.html` langsung di browser. Untuk tes di HP, pakai Live Server lalu buka alamat IP laptop dari HP (satu Wi-Fi).

## Struktur
```
index.html        markup halaman
css/style.css     semua gaya
js/main.js        semua logika & animasi
assets/img/       gambar (gembok, kunci, buku, bunga, kelopak, kue, dll.)
musik/            taruh lagu di sini -> musik/lagu.mp3
foto/             taruh foto cerita di sini -> foto/1.jpg, dst.
```

## Yang biasa diubah (js/main.js)
- `CODE` : kode PIN layer 1
- `BGM_SRC`, `BGM_VOL`, `BGM_FADE` : lagu latar, volume, lama fade-in
- `ANSWERS` : jawaban benar pertanyaan
- `MEMORIES` : isi cerita foto. Isi `photo:"foto/1.jpg"` dst.

## Ukuran bunga & kelopak transisi (js/main.js)
- Transisi 1: fungsi `bloomSeq()` (variabel `base`) dan `shed()` (ukuran kelopak)
- Transisi 2: fungsi `l2Flowers()` (variabel `base`, `size`, `pet`, `pets`)
