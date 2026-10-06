# Sistem Manajemen Armada TransJakarta

Aplikasi (frontend) untuk memantau data armada secara realtime menggunakan **React, TypeScript, dan Vite**, dengan sumber data dari **MBTA Realtime Transit API**.

Aplikasi ini menyediakan dashboard monitoring armada, filter rute dan trip, pencarian kendaraan, pagination, peta armada interaktif, serta detail informasi kendaraan.

---

## 1. Teknologi yang Digunakan

* **React** — membangun antarmuka aplikasi.
* **TypeScript** — type safety dan pengembangan yang lebih terstruktur.
* **Vite** — development server dan production build.
* **Tailwind CSS** — styling dan responsive layout.
* **Lucide React** — icon interface.
* **Leaflet** — peta interaktif.
* **MBTA V3 API** — sumber data realtime kendaraan.

---

## 2. Cara Menjalankan Aplikasi

### Prasyarat

Pastikan sudah tersedia/terinstall:

* Node.js 20+
* npm

Cek versi:

```bash
node --version
npm --version
```

### Instalasi

Clone repository kemudian masuk ke direktori project:

```bash
git clone git@github.com:Andi1987/fleet-management-system.git
cd <project-directory>
```

Install dependency:

```bash
npm install
```

### Menjalankan Development Server

Jalankan:

```bash
npm run dev
```

Setelah berhasil, buka URL yang ditampilkan oleh Vite pada terminal, biasanya:

```text
http://localhost:5173
```

---

## 3. Fitur Utama

### Dashboard Armada

Dashboard menampilkan:

* Total armada
* Armada yang sedang berjalan
* Armada yang sedang berhenti
* Armada yang akan masuk ke halte
* Waktu sinkronisasi terakhir
* Status koneksi API

### Filter Armada

Data kendaraan dapat difilter berdasarkan:

* Route
* Trip
* Label / ID Armada

### Pagination

Data kendaraan ditampilkan secara bertahap dengan pagination.

Konfigurasi saat ini:

* 5 kendaraan per halaman
* Navigasi halaman berikutnya dan sebelumnya
* Perubahan ukuran halaman


### Detail Armada

Setiap kendaraan dapat dibuka melalui tombol **Detail**.

Detail kendaraan menampilkan informasi seperti:

* Status kendaraan
* Koordinat GPS
* Waktu update terakhir
* Informasi Route
* Informasi Trip
* Informasi halte
* Kecepatan
* Bearing
* Status okupansi
* Stop sequence
* Revenue service
* Informasi aksesibilitas

---

## 4. Integrasi API

Aplikasi menggunakan **MBTA V3 API** sebagai sumber data realtime.

Base URL:

```text
https://api-v3.mbta.com
```

Untuk data kendaraan, aplikasi menggunakan endpoint:

```text
GET /vehicles
```

Relasi Route dan Trip digunakan untuk mendapatkan informasi yang lebih lengkap:

```text
GET /vehicles?include=route,trip
```

Detail kendaraan menggunakan:

```text
GET /vehicles/{vehicle_id}?include=route,trip,stop
```

Data `included` dari response API diproses oleh aplikasi untuk menghubungkan kendaraan dengan Route, Trip, dan Stop yang sesuai.

---

## 5. Arsitektur Aplikasi

Aplikasi menggunakan **arsitektur frontend berbasis komponen** dengan pemisahan  antara UI, state/data fetching, service API, dan types.

Struktur utama:

```text
src/
├── components/
│   ├── common/
│   ├── filters/
│   ├── maps/
│   ├── pagination/
│   └── vehicle/
│
├── hooks/
│   ├── useRoutes.ts
│   ├── useTrips.ts
│   └── useVehicles.ts
│
├── services/
│   └── api.ts
│
├── types/
│   └── mbta.ts
│
├── App.tsx
└── main.tsx
```

### `App.tsx`

Berfungsi sebagai komponen utama aplikasi dan mengatur:

* State filter
* Kendaraan yang dipilih
* Dashboard summary
* Pagination
* Tampilan vehicle grid
* Pembukaan detail kendaraan

### `components/`

Berisi komponen UI yang memiliki tanggung jawab spesifik.

Contohnya:

* `VehicleCard` — menampilkan ringkasan kendaraan.
* `VehicleGrid` — mengatur layout kumpulan kendaraan dan peta.
* `VehicleDetail` — menampilkan informasi detail kendaraan.
* `VehicleFilters` — menyediakan filter Route, Trip, dan pencarian kendaraan.
* `FleetMap` — menampilkan posisi kendaraan pada peta.
* `Pagination` — menangani navigasi pagination.
* `Loading` dan `ErrorMessage` — menangani state loading dan error.

### `hooks/`

Digunakan untuk memisahkan logic pengambilan dan pengelolaan data dari komponen UI.

Diantaranya:

* `useVehicles` — mengambil data kendaraan, pagination, filtering, loading, error, dan auto refresh.
* `useRoutes` — mengambil data Route.
* `useTrips` — mengambil data Trip berdasarkan Route yang dipilih.

### `services/`

Berisi logic komunikasi dengan API eksternal.

`api.ts` bertanggung jawab untuk request ke MBTA API sehingga komponen UI tidak perlu menangani detail HTTP request secara langsung.

### `types/`

Berisi definisi TypeScript untuk struktur data API.

Diantaranya:

* Vehicle
* Route
* Trip
* Stop
* API response

Dengan pendekatan ini, struktur data yang digunakan oleh aplikasi tetap terdefinisi dan dapat diperiksa oleh TypeScript.

---

## 6. Sinkronisasi Data

Data kendaraan diperbarui secara otomatis setiap **60 detik**.

Aplikasi juga menampilkan waktu sinkronisasi terakhir pada dashboard.

Jika request gagal, aplikasi menampilkan pesan error dan menyediakan opsi untuk melakukan retry.

---

## 7. Penanganan Loading dan Error

Aplikasi menyediakan state khusus untuk:

* Loading data kendaraan
* Loading detail kendaraan
* Error API
* Data kendaraan kosong
* Hasil pencarian tidak ditemukan
* Error saat mengambil detail Route/Trip/Stop

Dengan demikian, kegagalan API tidak menyebabkan halaman aplikasi menjadi kosong tanpa informasi kepada pengguna.

---