# 🛠️ Development Workflow Guide

Panduan lengkap untuk development di localhost sebelum push ke production.

## 🚀 **Quick Start (Local Development)**

### 1. Copy Environment File

```bash
# Di folder app/
cd app
cp .env.example .env.local
```

### 2. Edit `.env.local` untuk Development

```env
# Mode Development
VITE_ENV_MODE=development

# Backend Local (pastikan server jalan di port 5000)
VITE_BACKEND_URL=http://localhost:5000

# Enable Debug Logs
VITE_DEBUG_LOGS=true
VITE_DEBUG_ERROR_BOUNDARY=true

# Disable mock data (gunakan data real dari backend)
VITE_USE_MOCK_DATA=false
```

### 3. Jalankan Backend di Localhost

```bash
# Di folder server/
cd server
npm install
npm run dev
# atau
npm start
```

Pastikan backend berjalan di `http://localhost:5000`

### 4. Jalankan Frontend di Localhost

```bash
# Di folder app/
cd app
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:5173` (Vite default)

---

## 🌿 **Git Branching Strategy**

### Setup Branches

```bash
# 1. Buat branch development
git checkout -b development

# 2. Push ke remote
git push -u origin development

# 3. Setup branch staging (opsional)
git checkout -b staging
git push -u origin staging
```

### Workflow Development

```bash
# 1. Mulai dari branch development
git checkout development

# 2. Buat feature branch untuk task spesifik
git checkout -b feature/nama-fitur

# 3. Coding... test... debugging...

# 4. Commit perubahan
git add .
git commit -m "feat: deskripsi fitur"

# 5. Merge ke development
git checkout development
git merge feature/nama-fitur

# 6. Push ke development (trigger auto-deploy ke staging)
git push origin development
```

### Release ke Production

```bash
# 1. Test di development branch
# 2. Merge ke main untuk production
git checkout main
git merge development

# 3. Push ke main (trigger auto-deploy ke production)
git push origin main
```

---

## 🔒 **Environment Isolation**

### Development (Localhost)
- **URL**: `http://localhost:5173`
- **Backend**: `http://localhost:5000`
- **Database**: Local MongoDB atau MongoDB Atlas dev cluster
- **R2 Storage**: Bisa pakai local folder atau R2 dev bucket

### Staging (Opsional)
- **URL**: `https://staging.animeku.xyz`
- **Backend**: `https://staging-api.animeku.xyz`
- **Database**: MongoDB staging
- **Purpose**: Testing dengan data semi-real sebelum production

### Production
- **URL**: `https://animeku.xyz`
- **Backend**: `https://api.animeku.xyz` (aaPanel)
- **Database**: MongoDB production
- **R2**: Cloudflare R2 production buckets

---

## 🧪 **Testing Sebelum Deploy**

### Checklist Manual

- [ ] Fitur berjalan normal di localhost
- [ ] Tidak ada error di browser console
- [ ] Build berhasil tanpa error (`npm run build`)
- [ ] TypeScript check passed (`npx tsc --noEmit`)
- [ ] ESLint check passed (`npm run lint`)

### Automated Testing (Opsional)

Tambahkan ke `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx",
    "lint:fix": "eslint . --ext ts,tsx --fix"
  }
}
```

---

## 📊 **Monitoring Development**

### Debug Tools Aktif di Development

1. **React DevTools** - Install browser extension
2. **Logger** - Debug logs muncul di console
3. **Error Boundary** - Detail error lengkap
4. **Network Tab** - Monitor API calls

### Environment Indicators

Tambahkan indicator di UI untuk membedakan environment:

```tsx
// Di Navbar atau Footer
{IS_DEVELOPMENT && (
  <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
    DEV MODE
  </span>
)}
```

---

## 🚫 **File yang Tidak Di-push**

Pastikan ini di `.gitignore`:

```
# Environment files
.env.local
.env.development
.env.production

# Local data
*.local
```

---

## 🔧 **Troubleshooting**

### CORS Error di Localhost

Tambahkan di backend (`server/index.js`):

```javascript
// CORS untuk development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://animeku.xyz',
  'https://staging.animeku.xyz'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Database Local Setup

```bash
# Install MongoDB locally atau gunakan MongoDB Atlas
# Buat 3 cluster: dev, staging, production

# String connection example:
mongodb://localhost:27017/animeku-dev
```

---

## 📝 **Summary Commands**

```bash
# Setup awal
git clone <repo>
cd app && npm install
cd server && npm install

# Copy env file
cp app/.env.example app/.env.local

# Jalankan development
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd app && npm run dev

# Build untuk production test
cd app && npm run build && npm run preview

# Push ke development branch
git checkout development
git add . && git commit -m "feat: ..."
git push origin development

# Merge ke production
git checkout main
git merge development
git push origin main
```

---

## ✅ **Best Practices**

1. **Jangan pernah commit `.env.local`** - Sudah di .gitignore
2. **Test di development dulu** - Sebelum merge ke main
3. **Gunakan feature branches** - Untuk task yang besar
4. **Review code sendiri** - Sebelum push, cek diff
5. **Backup database** - Sebelum deploy production
6. **Communicate** - Kasih tahu tim kalau ada breaking changes

---

## 🆘 **Butuh Bantuan?**

Kalau ada error:
1. Cek console browser
2. Cek terminal backend
3. Cek file `.env.local`
4. Pastikan port tidak conflict
5. Restart dev server
