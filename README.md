# Casapupis2 - Boda Julian & Jaqueline

Web app para nuestro casamiento el 21 de febrero de 2026.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Backend:** Supabase (Database, Storage, Realtime)
- **Styling:** Tailwind CSS v4
- **Animaciones:** Framer Motion
- **Lenguaje:** TypeScript
- **Deploy:** Vercel

## Funcionalidades

- Landing con countdown al evento
- Sistema de acceso por codigo de invitado
- Fotos de Invitados (upload con compresion + galeria realtime)
- Agradecimiento + colaboracion (QR, alias, CBU)
- RSVP - Confirmar asistencia
- Como llegar (mapa integrado)
- Muro de mensajes (realtime)
- Nuestra historia (timeline)
- Galeria de la pareja
- Bingo fotografico
- Playlist colaborativa
- Programa del evento
- PWA instalable

## Setup

### 1. Clonar el repositorio

```bash
git clone https://github.com/jutopa31/casapupis2.git
cd casapupis2
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo y completar con tus datos:

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key
NEXT_PUBLIC_ACCESS_CODE=julianyjaqueline2026
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL=tu-google-maps-embed-url
```

### 4. Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ejecutar el schema SQL en el SQL Editor de Supabase:

```bash
# El archivo esta en:
supabase/schema.sql
```

3. Crear los Storage Buckets en Supabase Dashboard:
   - `galeria-pareja` (publico lectura)
   - `fotos-invitados` (publico lectura/escritura)
   - `bingo` (publico lectura/escritura)

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La app corre en [http://localhost:3000](http://localhost:3000)

### 6. Build de produccion

```bash
npm run build
npm run start
```

## Deploy en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Configurar las variables de entorno en Vercel Dashboard
3. Deploy automatico en cada push a `main`

## Estructura del proyecto

```
src/
├── app/                    # Paginas (App Router)
│   ├── page.tsx            # Landing con countdown
│   ├── fotos-invitados/    # Galeria de fotos de invitados
│   ├── layout.tsx          # Layout principal
│   └── globals.css         # Estilos globales + tema
├── components/
│   ├── auth/               # Modal de acceso
│   ├── fotos/              # Upload, galeria, lightbox
│   ├── navigation/         # Bottom nav, desktop nav, drawer
│   └── ui/                 # Toast, spinner
├── config/
│   └── wedding.ts          # Configuracion centralizada del evento
├── context/
│   └── AuthContext.tsx      # Contexto de autenticacion
├── lib/
│   └── supabase.ts         # Cliente Supabase
└── types/
    └── database.ts         # Tipos TypeScript para las tablas
```

## Configuracion del evento

Todos los datos del evento estan centralizados en `src/config/wedding.ts`:
- Nombres y fecha
- Ubicacion
- Datos bancarios
- Texto de agradecimiento
- Hitos de la historia
- Desafios del bingo
- Timeline del evento
- Navegacion

## Licencia

Proyecto privado.
