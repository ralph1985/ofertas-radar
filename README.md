# Ofertas Radar

Aplicación privada para describir búsquedas de productos en lenguaje natural y recibir por email las ofertas que cumplen sus criterios.

El frontal permite crear y pausar búsquedas. Un worker local ejecuta Codex en modo lectura, valida los resultados, descarta falsos positivos y envía un digest SMTP solo con ofertas nuevas y válidas.

## Cómo funciona

```text
Next.js + Prisma Postgres
          │
          └── worker local + cron
                ├── Codex CLI (solo lectura)
                ├── validación, filtros y deduplicación
                └── SMTP → destinatarios configurados
```

El worker no compra productos ni realiza acciones en webs externas. Las páginas y sus datos se tratan como contenido no confiable: Codex devuelve JSON y la aplicación aplica los filtros de negocio antes de enviar cualquier resultado.

## Requisitos

- Node.js 22 o posterior.
- pnpm.
- Una base de datos Prisma Postgres accesible desde la aplicación.
- Codex CLI instalado y autenticado en el equipo que ejecuta el worker.
- Una cuenta SMTP para enviar los avisos.
- Un proyecto de Vercel para desplegar el frontal y las rutas API.

## Configuración local

```bash
cp .env.example .env.local
pnpm install
pnpm db:generate
```

Completa `.env.local` con:

- `DATABASE_URL`: cadena de conexión de Prisma Postgres.
- `RADAR_ACCESS_KEY` y `RADAR_SESSION_SECRET`: acceso y sesiones del frontal.
- `RADAR_RECIPIENTS`: emails separados por comas.
- `RADAR_SMTP_HOST`, `RADAR_SMTP_PORT`, `RADAR_SMTP_SECURE`, `RADAR_SMTP_USER`, `RADAR_SMTP_PASSWORD` y `RADAR_FROM`: configuración SMTP.
- `CODEX_BIN`: ruta al ejecutable de Codex.
- `RADAR_PROJECT_ROOT`: ruta absoluta de este repositorio para el worker.
- `RADAR_TIMEZONE`: zona horaria usada por el cron, por ejemplo `Europe/Madrid`.

El archivo `.env.local` está excluido de Git. No guardes contraseñas ni claves reales en `.env.example`, el código fuente o los commits.

## Desarrollo

```bash
pnpm dev
```

Comprobaciones antes de publicar:

```bash
pnpm lint
pnpm test
pnpm build
```

## Base de datos

Para aplicar las migraciones en un entorno de desarrollo:

```bash
pnpm db:migrate
```

El esquema está en [`prisma/schema.prisma`](prisma/schema.prisma) y las migraciones en [`prisma/migrations`](prisma/migrations). En Vercel, configura `DATABASE_URL` como variable de entorno del proyecto.

## Worker y cron

Puedes lanzar una revisión manual con:

```bash
pnpm worker
```

El worker:

1. Carga las búsquedas activas.
2. Pide a Codex candidatos en JSON usando `read-only`.
3. Exige los criterios de cada búsqueda: disponibilidad, talla, cantidad, precio y deduplicación.
4. Guarda la ejecución y las ofertas válidas.
5. Envía por SMTP un digest únicamente si hay resultados nuevos.

Para instalar el cron diario del usuario actual:

```bash
bash scripts/install-cron.sh
```

El instalador usa `flock` para impedir ejecuciones simultáneas. El log queda en `var/log/worker.cron.log`.

El mismo instalador configura una copia PostgreSQL diaria a las 00:00 con `pg_dump`. Los SQL se guardan localmente en `var/backups/prisma-postgres`, con permisos restrictivos y una retención de 14 días. El log del backup queda en `var/log/prisma-postgres-backup.log`. Estos archivos están excluidos de Git.

## Despliegue

El frontal se despliega en Vercel desde GitHub. Las variables necesarias para Next.js deben configurarse en Vercel; el worker y sus credenciales SMTP se ejecutan en el equipo local configurado para el cron.

## Estado del proyecto

MVP privado. La aplicación ya cubre el alta de búsquedas, persistencia, ejecución del worker, filtrado estricto, deduplicación y envío SMTP. Antes de abrirla a más usuarios conviene añadir autenticación individual, gestión de secretos y observabilidad.

## Mantenimiento

Rafael García · [@ralph1985](https://github.com/ralph1985)
