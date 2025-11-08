# 🌐 Marketing Campaign Tools

Deskripsi singkat proyekmu — misalnya:
> Website ini dibangun menggunakan React + TypeScript + Vite dengan dukungan UI Mantine, TailwindCSS, serta integrasi grafik dan kalender menggunakan Recharts dan FullCalendar.

---

## 🚀 Tech Stack

**Frontend Framework:**
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — build tool super cepat

**UI Library:**
- [Mantine](https://mantine.dev/) — komponen React modern & powerful
- [TailwindCSS](https://tailwindcss.com/) — utility-first CSS framework
- [Lucide React](https://lucide.dev/) — ikon open-source untuk React

**Visualization & Calendar:**
- [Recharts](https://recharts.org/) — visualisasi data berbasis chart
- [FullCalendar](https://fullcalendar.io/) — tampilan kalender interaktif (day grid, time grid, dsb.)

**Routing:**
- [React Router DOM](https://reactrouter.com/en/main) — manajemen rute halaman SPA

---

## ⚙️ Software Requirements

Pastikan perangkat kamu sudah memiliki:

| Software | Minimum Version | Keterangan |
|-----------|-----------------|-------------|
| **Node.js** | `>= 18.x` | Menjalankan server pengembangan & build proyek |
| **npm** | `>= 9.x` | Manajemen dependensi |
| **Vite** | (included via npm) | Build tool & dev server |
| **Browser Modern** | (Chrome/Edge/Firefox) | Untuk menjalankan aplikasi |

---

## 📦 Instalasi Dependensi

Clone repositori ini terlebih dahulu:

```bash
git clone https://github.com/username/nama-proyek.git
cd nama-proyek
```

Lalu jalankan perintah berikut untuk menginstal seluruh dependensi utama dan dev:

```bash
npm install react react-dom @mantine/core @mantine/hooks react-router-dom lucide-react @mantine/dates @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction recharts
```

Tambahkan dependensi pengembangan (TypeScript, linting, dan styling):
```bash
npm install --save-dev @types/node @types/react @types/react-dom @typescript-eslint/eslint-plugin @typescript-eslint/parser @vitejs/plugin-react eslint eslint-plugin-react-hooks eslint-plugin-react-refresh typescript vite tailwindcss@3 autoprefixer postcss
```

## 🎨 Konfigurasi TailwindCSS

Inisialisasi Tailwind dan PostCSS:
```bash
npx tailwindcss init -p
```

## 🧠 Skrip Pengembangan

Menjalankan server pengembangan:
```bash
npm run dev
```
