# Plan: Sección de Encuestas (`/encuestas`)

## Resumen

Agregar una sección de encuestas divertidas sobre la boda, con preguntas de opción múltiple, visualización de resultados en tiempo real y una sola respuesta por invitado.

---

## 1. Base de Datos (Supabase)

**Nueva tabla:** `encuesta_respuestas`

```sql
CREATE TABLE IF NOT EXISTS encuesta_respuestas (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_invitado TEXT      NOT NULL,
  pregunta_id   INTEGER     NOT NULL,
  respuesta     TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Restricción única: un invitado solo puede responder una vez por pregunta
ALTER TABLE encuesta_respuestas
  ADD CONSTRAINT unique_respuesta_por_invitado
  UNIQUE (nombre_invitado, pregunta_id);

-- RLS (igual que todas las demás tablas del proyecto)
ALTER TABLE encuesta_respuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"   ON encuesta_respuestas FOR SELECT USING (true);
CREATE POLICY "Public insert" ON encuesta_respuestas FOR INSERT WITH CHECK (true);
```

Se agrega como nuevo archivo en `supabase/migrations/`.

---

## 2. Config (`src/config/wedding.ts`)

Se agregan dos cosas:

**a) Interface + array de preguntas:**
```ts
export interface EncuestaPregunta {
  id: number;
  pregunta: string;
  opciones: string[];
}

encuestas: EncuestaPregunta[]
```

**b) Preguntas propuestas (divertidas, temáticas de la boda):**

| # | Pregunta | Opciones |
|---|----------|----------|
| 1 | ¿Quién tiene mejor ritmo en la pista? | Julian / Jacqueline / Los dos igual / El DJ |
| 2 | ¿Cuánto dura este matrimonio? | Para siempre / 50+ años / Hasta que la muerte los separe / ¿Qué pregunta es esa? |
| 3 | ¿Cuál fue tu momento favorito del día? | La ceremonia / El brindis / La cena / La fiesta |
| 4 | ¿Quién dijo "sí" primero mentalmente? | Julian / Jacqueline / Los dos al mismo tiempo / Preguntale a ellos |
| 5 | ¿Cómo llegaste a la fiesta? | En auto / En remis/taxi / Me trajeron / En OVNI |

**c) Agregar a navegación:**
```ts
{ label: "Encuestas", href: "/encuestas", icon: "BarChart2" }
```

---

## 3. Tipos TypeScript (`src/types/database.ts`)

```ts
export interface EncuestaRespuesta {
  id: string;
  nombre_invitado: string;
  pregunta_id: number;
  respuesta: string;
  created_at: string;
}
```

---

## 4. Página Principal (`src/app/encuestas/page.tsx`)

### Estructura y flujo:

**Estado A — Formulario (antes de enviar):**
- Header con icono y título "Encuestas" + subtítulo
- Una card por pregunta con los botones de opciones (toggle-style, igual que `/confirmar`)
- Botón "Enviar respuestas" habilitado solo cuando todas las preguntas están respondidas
- Al enviar: `INSERT` en Supabase para cada pregunta respondida, con `nombre_invitado` de `AuthContext`
- Toast de éxito / error

**Estado B — Resultados (después de enviar o si ya respondió):**
- Mismas cards de preguntas, pero ahora muestran barras de porcentaje animadas por opción
- Los porcentajes se calculan de los registros en Supabase (`SELECT` agrupado por `pregunta_id, respuesta`)
- Etiqueta "Tu respuesta" marcando la opción elegida
- Las barras usan `framer-motion` para animarse al aparecer (igual que otras páginas)

**Detección de "ya respondió":**
- Al cargar la página: consultar si existe un registro con `nombre_invitado` actual
- Si existe → mostrar directamente los resultados con sus respuestas marcadas

**Vista admin (Julian / Jacqueline):**
- Los admins siempre ven los resultados, nunca el formulario
- Mismo patrón que `muro/page.tsx`: `ADMIN_NAMES = ['Julian', 'Jacqueline']`

---

## 5. Componentes y patrones reutilizados

| Patrón | Origen |
|--------|--------|
| Botones toggle de respuesta | `src/app/confirmar/page.tsx` |
| Toast éxito/error | `src/components/ui/Toast.tsx` |
| Animaciones Framer Motion | Todas las páginas |
| Auth context (`guestName`) | `src/context/AuthContext.tsx` |
| Admin detection | `src/app/muro/page.tsx` |
| Supabase insert + select | `src/app/playlist/page.tsx` |
| Skeleton loading | `src/app/muro/page.tsx` |

---

## 6. Archivos a crear / modificar

| Acción | Archivo |
|--------|---------|
| CREAR  | `supabase/migrations/YYYYMMDD_add_encuesta_respuestas.sql` |
| CREAR  | `src/app/encuestas/page.tsx` |
| EDITAR | `src/config/wedding.ts` (interface + array de preguntas + nav) |
| EDITAR | `src/types/database.ts` (agregar `EncuestaRespuesta`) |

---

## 7. Mockup visual de la página

```
┌─────────────────────────────────────┐
│  📊  Encuestas                      │
│  Contanos qué pensás               │
├─────────────────────────────────────┤
│                                     │
│  ¿Quién tiene mejor ritmo?          │
│  ┌──────────┐  ┌──────────────┐    │
│  │  Julian  │  │  Jacqueline  │    │  <- Toggle buttons (gold border si selec.)
│  └──────────┘  └──────────────┘    │
│  ┌──────────────────┐ ┌──────┐     │
│  │  Los dos igual   │ │El DJ │     │
│  └──────────────────┘ └──────┘     │
│                                     │
│  ¿Cuánto dura este matrimonio?      │
│  ...                                │
│                                     │
│  [  Enviar respuestas  ]            │ <- Deshabilitado hasta completar todo
└─────────────────────────────────────┘

--- después de enviar ---

┌─────────────────────────────────────┐
│  ¿Quién tiene mejor ritmo?          │
│                                     │
│  Julian         ████████░░  45%     │ <- Tu respuesta ✓
│  Jacqueline     █████░░░░░  30%     │
│  Los dos igual  ██░░░░░░░░  15%     │
│  El DJ          █░░░░░░░░░  10%     │
└─────────────────────────────────────┘
```
