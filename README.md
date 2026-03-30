# Extractor.app v1

Aplicación `Next.js` preparada para desplegar en Vercel y procesar facturas PDF con Claude desde servidor.

## Requisitos

- Node.js 20+
- Una clave válida en `ANTHROPIC_API_KEY`

## Variables de entorno

Usa `.env.local`:

```bash
ANTHROPIC_API_KEY=tu_clave
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
AUTH_SECRET=una_clave_larga_y_privada
CLIENT_ACCOUNTS_JSON=[{"id":"martinez","name":"Martinez Hermanos","password":"supersecreta","region":"España"},{"id":"bata-logistics","name":"Bata Logistics","password":"otra-clave","region":"Guinea Ecuatorial"}]
BLOB_READ_WRITE_TOKEN=opcional_para_vercel_blob
```

## Desarrollo local

```bash
npm install
npm run dev
```

La app quedará en `http://localhost:3000`.

## Despliegue en Vercel

1. Sube este repo a GitHub.
2. Crea un proyecto nuevo en Vercel importando el repositorio.
3. Añade estas variables de entorno en Vercel:

```bash
ANTHROPIC_API_KEY=tu_clave
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

4. Usa estos comandos:

```bash
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

5. Despliega.

Notas:
- La app está marcada como `noindex` porque esta primera versión es interna.
- Las rutas API usan runtime `nodejs` y `maxDuration=60`.
- No hace falta guardar PDFs en Blob o S3 para esta v1.

## Flujo actual

- Sube hasta 5 PDFs
- Máximo 10 MB por archivo
- PDFs con texto embebido o escaneados
- Procesamiento secuencial en servidor
- Exportación Excel en tres hojas
- Acceso por empresa con contraseña
- Historial por empresa

## Endpoints

- `POST /api/extract`
  - `multipart/form-data`
  - campos: `productType`, `yearMode`, `customDescription`, `files`
- `POST /api/export`
  - JSON con `items`, `productType`, `yearMode`
