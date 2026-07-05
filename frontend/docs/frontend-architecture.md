# Arquitectura del Frontend

> Documento generado a partir del análisis del código fuente. Toda la información está basada en evidencia directa del repositorio.

---

## 1. Visión General

El frontend es una **Single Page Application (SPA)** construida con React 18, inicializada con Create React App (CRA). El proyecto tiene soporte para TypeScript configurado en `tsconfig.json`, pero la mayoría de los archivos de componentes están escritos en JavaScript (`.js`), con excepción del entry point (`index.tsx`), algunos componentes y toda la feature `Position/` (`.tsx`).

---

## 2. Estructura de Carpetas

```
frontend/
├── public/                        # HTML base y assets estáticos públicos
│   ├── index.html
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── assets/                    # Imágenes importadas en componentes
│   │   └── lti-logo.png
│   ├── components/                # Componentes React (páginas y reutilizables)
│   │   ├── AddCandidateForm.js    # Página: formulario de alta de candidato
│   │   ├── FileUploader.js        # Componente reutilizable: carga de archivos
│   │   ├── Position/              # Feature: gestión de candidatos de una posición
│   │   │   ├── PositionPage.tsx       # Página: tablero kanban de la posición
│   │   │   ├── KanbanBoard.tsx        # Orquestador DnD: contexto y distribución de columnas
│   │   │   ├── KanbanColumn.tsx       # Columna droppable: una fase del flujo
│   │   │   ├── CandidateCard.tsx      # Tarjeta draggable: un candidato
│   │   │   ├── PositionPage.test.tsx
│   │   │   ├── KanbanBoard.test.tsx
│   │   │   ├── KanbanColumn.test.tsx
│   │   │   └── CandidateCard.test.tsx
│   │   ├── Positions.tsx          # Página: listado de posiciones
│   │   └── RecruiterDashboard.js  # Página: dashboard principal del reclutador
│   ├── services/                  # Capa de acceso a APIs
│   │   ├── candidateService.js    # (código muerto — no importado por ningún componente)
│   │   ├── positionService.ts     # Funciones de fetch para la feature Position
│   │   └── positionService.test.ts
│   ├── test-utils/                # Helpers compartidos para tests
│   │   └── fetchMocks.ts          # buildResponse: constructor de Response mock para fetch
│   ├── types/                     # Tipos TypeScript compartidos entre capas
│   │   └── position.ts            # Tipos de la feature Position (InterviewStep, CandidateItem, etc.)
│   ├── App.js                     # Componente raíz: define el router y las rutas
│   ├── App.tsx                    # Archivo boilerplate de CRA (no utilizado en la app)
│   ├── App.css                    # Estilos globales (boilerplate CRA)
│   ├── index.css                  # Estilos base del body
│   ├── index.tsx                  # Entry point: monta la app en el DOM
│   ├── logo.svg                   # Logo boilerplate de CRA (no utilizado en la app)
│   ├── react-app-env.d.ts         # Tipos de entorno de CRA
│   └── reportWebVitals.ts         # Utilidad de métricas de CRA
├── docs/                          # Documentación del proyecto
├── build/                         # Output de producción generado por `npm run build`
├── package.json
├── package-lock.json
└── tsconfig.json
```

**Nota:** La carpeta `src/components/` concentra tanto los componentes de página (vistas completas) como los componentes reutilizables. Las features complejas se organizan en subcarpetas propias (ver `Position/`).

---

## 3. Librerías Utilizadas

Declaradas en `package.json`:

| Librería | Versión | Propósito |
|---|---|---|
| `react` | ^18.3.1 | Librería principal de UI |
| `react-dom` | ^18.3.1 | Renderizado en el DOM |
| `react-router-dom` | ^6.23.1 | Enrutamiento del lado del cliente |
| `bootstrap` | ^5.3.3 | Framework CSS de estilos |
| `react-bootstrap` | ^2.10.2 | Componentes Bootstrap para React |
| `react-bootstrap-icons` | ^1.11.4 | Iconos SVG de Bootstrap |
| `react-datepicker` | ^6.9.0 | Selector de fechas |
| `@dnd-kit/core` | ^6.x | Drag & drop accesible (usado en la feature Position) |
| `typescript` | ^4.9.5 | Soporte de tipado estático |
| `dotenv` | ^16.4.5 | Carga de variables de entorno |
| `@testing-library/react` | ^13.4.0 | Utilidades de test para componentes |
| `@testing-library/jest-dom` | ^5.17.0 | Matchers de Jest para el DOM |
| `@testing-library/user-event` | ^13.5.0 | Simulación de eventos de usuario |
| `web-vitals` | ^2.1.4 | Medición de métricas de rendimiento |

**Inconsistencia detectada:** `axios` es importado en `src/services/candidateService.js` pero **no está declarado en `package.json`**.

---

## 4. Sistema de Rutas

El enrutamiento está definido en `src/App.js` usando React Router DOM v6 con los componentes `BrowserRouter`, `Routes` y `Route`.

| Ruta | Componente | Archivo |
|---|---|---|
| `/` | `RecruiterDashboard` | `src/components/RecruiterDashboard.js` |
| `/add-candidate` | `AddCandidateForm` | `src/components/AddCandidateForm.js` |
| `/positions` | `Positions` | `src/components/Positions.tsx` |
| `/positions/:id` | `PositionPage` | `src/components/Position/PositionPage.tsx` |

Características observadas en el código:
- Cada ruta renderiza un componente de página directamente en la prop `element`.
- No existe carga diferida (`React.lazy` / `Suspense`).
- No hay rutas anidadas (`<Route>` dentro de `<Route>`).
- No hay rutas protegidas ni guards de autenticación.
- La navegación entre páginas se realiza con el componente `<Link>` de `react-router-dom` (evidenciado en `RecruiterDashboard.js`) o con el hook `useNavigate` (evidenciado en `PositionPage.tsx`).

---

## 5. Manejo de Estado

El proyecto utiliza **únicamente estado local de componente** mediante el hook `useState` de React. No existe ningún mecanismo de estado global.

Estado local por componente:

| Componente | Estado gestionado |
|---|---|
| `AddCandidateForm` | `candidate` (objeto con datos del formulario), `error` (string), `successMessage` (string) |
| `FileUploader` | `file` (objeto File), `fileName` (string), `fileData` (respuesta del servidor), `loading` (boolean) |
| `Positions` | Sin estado; renderiza datos mock hardcodeados |
| `RecruiterDashboard` | Sin estado; solo renderiza navegación |
| `PositionPage` | `positionName` (string), `interviewSteps` (array), `candidates` (array), `loading` (boolean), `loadError` (string\|null), `canRetry` (boolean), `moveError` (string\|null) |

No se utiliza:
- Context API
- Redux ni ningún derivado
- Zustand, Jotai u otra librería de estado global

---

## 6. Estrategia para Consumir APIs

Existen **dos mecanismos** en el código, uno de ellos sin uso activo:

### 6.1 Fetch nativo en componente (patrón legacy)

Los componentes `AddCandidateForm.js` y `FileUploader.js` realizan llamadas HTTP directamente con la API `fetch` nativa del navegador, sin pasar por ninguna capa de abstracción:

- `AddCandidateForm.js` → `POST http://localhost:3010/candidates`
- `FileUploader.js` → `POST http://localhost:3010/upload`

El manejo de errores se realiza localmente en cada componente con bloques `try/catch`, actualizando el estado `error` o `successMessage`.

### 6.2 Capa de servicios con fetch nativo (patrón preferido)

La feature `Position` introduce `src/services/positionService.ts`, que centraliza los accesos HTTP de la feature en funciones independientes del componente:

- `fetchInterviewFlow(positionId)` → `GET /position/{id}/interviewflow`
- `fetchCandidatesByPosition(positionId)` → `GET /position/{id}/candidates`
- `updateCandidateStep(candidateId, applicationId, stepId)` → `PUT /candidates/{id}`

Esta separación facilita el testing (los servicios pueden ser mockeados independientemente), el reúso y el mantenimiento. **Es el patrón a seguir para nuevas features.**

### 6.3 Axios en la capa de servicios (sin uso activo)

El archivo `src/services/candidateService.js` define dos funciones (`uploadCV`, `sendCandidateData`) que usan `axios`. Sin embargo, **este archivo no es importado por ningún componente de la aplicación**.

### Observaciones adicionales

- La URL base del backend (`http://localhost:3010`) sigue **hardcodeada** en `AddCandidateForm.js` y `FileUploader.js`. `positionService.ts` ya usa `process.env.REACT_APP_API_URL` (con fallback); la variable está definida en `frontend/.env`. Pendiente migrar los componentes legacy al mismo patrón.
- No existe un cliente HTTP centralizado con interceptores, cabeceras compartidas ni manejo de errores global.

---

## 7. Componentes Reutilizables

Solo `FileUploader.js` está diseñado para ser utilizado desde otros componentes. Recibe dos callbacks como props:

- `onChange`: invocado inmediatamente al seleccionar un archivo local.
- `onUpload`: invocado tras la respuesta exitosa del servidor.

Dentro de la feature `Position`, `KanbanBoard`, `KanbanColumn` y `CandidateCard` son componentes de presentación reutilizables dentro de la feature, compuestos por `PositionPage`.

Los demás componentes (`RecruiterDashboard`, `AddCandidateForm`, `Positions`) son componentes de página: no están diseñados para ser compuestos dentro de otros componentes.

---

## 8. Convenciones de Nombres

Observadas en el código fuente:

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos de componentes | PascalCase | `AddCandidateForm.js`, `CandidateCard.tsx` |
| Componentes React | PascalCase | `const AddCandidateForm = () => ...` |
| Funciones/handlers | camelCase con prefijo `handle` | `handleInputChange`, `handleSubmit`, `handleCandidateMoved` |
| Variables de estado | camelCase | `successMessage`, `fileName`, `loadError` |
| Tipos TypeScript | PascalCase | `type CandidateItem = { ... }` |
| Constantes de datos | camelCase | `const mockPositions: Position[]` |
| Extensiones de archivo | `.js` para componentes JS, `.tsx` para componentes TS | — |
| Props de callbacks | camelCase con prefijo `on` + sustantivo del evento | `onCandidateMoved`, `onChange`, `onUpload` |

**Inconsistencia detectada:** Se mezclan extensiones `.js` y `.tsx` para componentes React. No existe una convención unificada de extensión de archivo.

---

## 9. Patrones de Diseño

Patrones identificados con evidencia en el código:

- **Functional components exclusivamente:** Todos los componentes son funciones. No existe ningún componente de clase.
- **Controlled components:** Los campos de formulario en `AddCandidateForm` están enlazados a estado mediante `onChange` (y `value` en los campos de secciones dinámicas).
- **Callback props (lifting state up):** `FileUploader` y los componentes de `Position/` comunican cambios al padre mediante props de callback (`onChange`, `onUpload`, `onCandidateMoved`), siguiendo el patrón estándar de React.
- **Arrays dinámicos en formulario:** `AddCandidateForm` gestiona listas de educaciones y experiencias laborales como arrays dentro del estado, con funciones de añadir/eliminar items.
- **Optimistic update con rollback:** `PositionPage.handleCandidateMoved` actualiza el estado de la UI antes de confirmar el PUT, y revierte al snapshot previo si la llamada falla.
- **Service layer:** `positionService.ts` centraliza el acceso HTTP de la feature Position, desacoplándolo del componente.
- **`useCallback` / `useMemo`:** Usados en `PositionPage` y `KanbanBoard` para estabilizar referencias de funciones y evitar recálculos costosos en cada render.

Patrones **no utilizados** en el código actual:
- Higher Order Components (HOC)
- Context API / Provider pattern
- Render props
- Lazy loading de componentes
- `React.memo`

---

## 10. Cómo Integrar una Nueva Página

Para añadir una nueva página respetando la arquitectura existente:

### Paso 1: Crear el componente de página

Crear un archivo (o carpeta para features complejas) en `src/components/` con nombre en PascalCase (`.tsx` preferido sobre `.js` para nuevos archivos).

Si la página necesita datos del backend, crear primero un archivo de servicio en `src/services/` con funciones puras de fetch (ver `positionService.ts` como referencia). Luego consumirlos desde el componente con `useEffect` + `useState`, gestionando los estados de carga, error y retry.

### Paso 2: Registrar la ruta

Abrir `src/App.js` y añadir un nuevo `<Route>` dentro del bloque `<Routes>`, añadiendo también el import correspondiente al inicio del archivo.

### Paso 3: Enlazar desde el dashboard u otras páginas

Si la nueva página debe ser accesible desde `RecruiterDashboard`, añadir una nueva `<Card>` con un `<Link to="/nueva-ruta">` siguiendo el patrón de los dos enlaces existentes.

### Consideraciones

- No existe navegación global (navbar/sidebar); toda navegación se implementa mediante `<Link>` o `useNavigate` en los componentes de página.
- El estado es local; si la nueva página necesita datos de otra página, la única opción actual es pasar parámetros por URL o elevar el estado a `App.js`.
- La URL del backend debe usarse como en los componentes existentes: `http://localhost:3010` (ver deuda técnica — pendiente migrar a variable de entorno).

---

## 11. Deuda Técnica e Inconsistencias Detectadas

Evidencias directas de código que representan inconsistencias o deuda técnica:

| Problema | Evidencia |
|---|---|
| `App.tsx` no utilizado | `src/App.js` es el archivo importado por `index.tsx`; `src/App.tsx` contiene el boilerplate original de CRA sin uso |
| `candidateService.js` es código muerto | Ningún componente importa desde `src/services/candidateService.js` |
| `axios` no declarado en `package.json` | `import axios from 'axios'` en `candidateService.js`; `axios` ausente en `dependencies` |
| URL del backend hardcodeada (parcialmente resuelta) | `'http://localhost:3010'` aparece como literal en `AddCandidateForm.js`, `FileUploader.js` y `positionService.ts`; `dotenv` está en `package.json` pero sin uso |
| `Positions.tsx` usa datos mock | El componente renderiza `mockPositions`, un array definido en el propio archivo, sin llamada a ninguna API |
| Extensiones de archivo mixtas | Componentes en `.js` y `.tsx` sin criterio uniforme |
| `strict: true` en TypeScript sin adopción real | `tsconfig.json` tiene `"strict": true` pero la mayoría del código es JavaScript sin tipos |
| `@testing-library/react` en versión incompatible | La versión ^13.4.0 genera warnings de `act` con React 18; la versión correcta sería ^14+. Se decidió no actualizar en este ejercicio (ver `position-context.md` sección 5). |
