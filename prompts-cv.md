# Prompts CV

Listado de prompts utilizados durante el desarrollo (Cursor / Sonnet 4.6).

## Índice

1. [Prompt 1 — Análisis de arquitectura frontend](#prompt-1--análisis-de-arquitectura-frontend)
2. [Prompt 2 — Resumen de contexto backend para pantalla Position](#prompt-2--resumen-de-contexto-backend-para-pantalla-position)
3. [Prompt 3 — Plan de implementación pantalla Position (kanban)](#prompt-3--plan-de-implementación-pantalla-position-kanban)
4. [Prompt 4 — Implementación del plan](#prompt-4--implementación-del-plan)
5. [Prompt 5 — Suite de tests completa para Position](#prompt-5--suite-de-tests-completa-para-position)
6. [Prompt 6 — Score como círculos verdes en CandidateCard](#prompt-6--score-como-círculos-verdes-en-candidatecard)
7. [Prompt 7 — Diagnóstico de datos mock en Positions.tsx](#prompt-7--diagnóstico-de-datos-mock-en-positionstsx)
8. [Prompt 8 — Eliminar posición inexistente del mock](#prompt-8--eliminar-posición-inexistente-del-mock)

---

## Prompt 1 — Análisis de arquitectura frontend

```text
Analiza el proyecto completo, especialmente el frontend.
Necesito entender:
- arquitectura del frontend
- estructura de carpetas
- librerías utilizadas
- sistema de rutas
- manejo de estado
- estrategia para consumir APIs
- componentes reutilizables
- convenciones de nombres
- patrones de diseño
- cómo debería integrarse una nueva página respetando la arquitectura existente.

Salida esperada:
Genera el archivo frontend/docs/frontend-architecture.md.

Restricciones:
- No escribas código.
- Lo que documentes debe estar basado únicamente en la evidencia del código. No hagas suposiciones ni infieras información que no pueda verificarse.
```

---

## Prompt 2 — Resumen de contexto backend para pantalla Position

```text
Lee los siguientes documentos:
- backend/ModeloDatos.md
- backend/api-spec.yaml

Resume solamente la información relevante del bakcend para implementar la pantalla Position donde se debería poder visualizar y gestionar los diferentes candidatos de una posición específica (position, candidate, interview flow, interview step).

Salida esperada:
- Genera el archivo frontend/docs/position-context.md.
```

---

## Prompt 3 — Plan de implementación pantalla Position (kanban)

```text
Actúa como un ingeniero frontend senior. Antes de escribir código, quiero que 
propongas un plan de implementación para la pantalla "Position" (kanban de candidatos), se adjunta imagen de esquema propuesto para el kanban.

Contexto obligatorio:
- @frontend/docs/frontend-architecture.md
- @frontend/docs/position-context.md

Requisitos funcionales:
- Vista kanban: columnas = interviewSteps de GET /positions/:id/interviewFlow
- Tarjetas = candidatos de GET /positions/:id/candidates, ubicadas en la columna de su current_interview_step, mostrando nombre completo y score promedio
- Drag & drop de tarjetas entre columnas dispara PUT /candidates/:id con { applicationId, currentInterviewStep }
- Título de la posición arriba + flecha de "volver" al listado
- Responsive: en mobile las columnas se apilan verticalmente a ancho completo
- No debo tocar el layout global (header/footer), solo el contenido de la página

Quiero que el plan incluya:
1. Estructura de carpetas/archivos a crear (siguiendo lo definido en frontend-architecture.md)
2. Componentes propuestos y su responsabilidad (ej: PositionPage, KanbanBoard, KanbanColumn, CandidateCard)
3. Estrategia de manejo de estado (dónde vive el estado del board, optimistic update sí/no)
4. Librería de drag&drop a usar (evaluar si el proyecto ya tiene una, si no, proponer 1 opción liviana y justificar)
5. Manejo de loading/error states
6. Qué se testea y con qué (unit vs integración)

No escribas código todavía, solo el plan. Esperá mi confirmación.
```

---

## Prompt 4 — Implementación del plan

```text
Implementá los cambios propuestos
```

---

## Prompt 5 — Suite de tests completa para Position

```text
Actúa como ingeniero frontend senior. Necesito que generes la suite de tests completa para la feature "Position" (kanban de candidatos).

Antes de escribir tests, revisá:
- frontend/docs/frontend-architecture.md y frontend/docs/position-context.md para el contexto del dominio
- Los componentes ya implementados: PositionPage, KanbanBoard, KanbanColumn, CandidateCard, y positionService, para conocer props, tipos (types.ts) y firmas exactas de funciones
- La configuración de testing del proyecto (react-scripts test, @testing-library/react, setupTests.ts) 

ALCANCE COMPLETO A CUBRIR:

1. positionService.test.ts
   - Mock de global.fetch, tipado explícitamente (sin as any)
   - Para cada una de las 3 funciones (fetchInterviewFlow, fetchCandidatesByPosition, updateCandidateStep):
     - Caso de éxito: fetch resuelve con datos válidos, la función devuelve lo esperado
     - Caso de error: fetch resuelve con ok: false o rechaza, la función propaga/maneja el error de forma consistente con su implementación real
     - Verificar que se llama a fetch con la URL y method correctos

2. CandidateCard.test.tsx
   - Renderiza el nombre completo del candidato
   - Muestra el score formateado correctamente
   - Muestra el estado correspondiente cuando no hay score (0/null/undefined, según lo que maneje el componente real)
   - Caso de nombre largo (+30 caracteres): el nombre completo debe seguir presente en el DOM en su forma completa, aunque se trunque visualmente por CSS

3. KanbanColumn.test.tsx
   - Muestra el nombre del step en el header
   - Muestra el estado de "sin candidatos" cuando la lista está vacía
   - Renderiza una tarjeta por cada candidato recibido
   - No muestra el estado vacío cuando hay candidatos

4. KanbanBoard.test.tsx
   - Renderiza una columna por cada step recibido
   - Ubica cada candidato en la columna correcta según su fase actual
   - Respeta el orden de las columnas según corresponda (orderIndex u otro criterio que use el componente real)

5. PositionPage.test.tsx
   - Muestra estado de carga mientras se resuelven los fetch iniciales
   - Muestra el título de la posición tras la carga exitosa
   - Muestra las columnas del flujo de entrevistas
   - Ubica los candidatos en la columna correcta
   - Muestra un estado de error cuando falla la carga inicial
   - Muestra un mensaje específico cuando la posición no existe (404)
   - El botón/flecha de "volver" navega correctamente al listado de posiciones
   - Drag & drop de éxito: al soltar una tarjeta en otra columna, se ejecuta el handler real de drop (usando test utilities de @dnd-kit o simulando el evento necesario) y se verifica con toHaveBeenCalledWith que updateCandidateStep fue llamado con los parámetros exactos correctos
   - Drag & drop con fallo: si el mock de updateCandidateStep rechaza, el candidato revierte a su columna original (optimistic update revertido)

REGLAS GENERALES:
- Seguí el patrón arrange/act/assert
- Usá async/await con waitFor o findBy* para cualquier actualización de estado asíncrona — no dejes warnings de "not wrapped in act(...)" en la salida de la corrida
- Tests de comportamiento (lo que ve/hace el usuario), no de implementación interna
- Nada de snapshots grandes
- No agregues dependencias nuevas de testing sin preguntar primero
- No modifiques código, si es necesario hacerlo para hacer testeable el drag & drop mostrame los cambios necesarios con la justificación y esperá mi aprobación.
```

**Resultado de la corrida (`npm test`):**

```text
> frontend@0.1.0 test
> react-scripts test

 PASS  src/components/Position/KanbanBoard.test.tsx
 PASS  src/components/Position/KanbanColumn.test.tsx
 PASS  src/components/Position/CandidateCard.test.tsx
 PASS  src/services/positionService.test.ts
 PASS  src/components/Position/PositionPage.test.tsx

Test Suites: 5 passed, 5 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        5.328 s, estimated 6 s
```

---

## Prompt 6 — Score como círculos verdes en CandidateCard

```text
En CandidateCard, el score se muestra actualmente como número. Necesito que 
se muestre como una fila de círculos verdes, replicando el mockup de diseño 
original (ver imagen adjunta).

Reglas de representación:
- Cada círculo representa 1 punto de score (redondeado al entero más cercano)
- Si el score es 3.7, se muestran 4 círculos. Si es 3.2, se muestran 3
- Si el score es 0 o null/undefined, no se muestran círculos — mostrar 
  "Sin puntuación" como texto sutil en gris
- Usar un emoji (🟢) o un <span> con border-radius: 50% y background-color 
  verde — elegí lo que sea más consistente con el estilo visual del resto 
  del proyecto (revisá si ya se usan emojis o íconos SVG en otros 
  componentes antes de decidir)

Después de modificar CandidateCard:
- Actualizá los tests de CandidateCard.test.tsx para que reflejen la nueva 
  representación (ya no se busca un número en pantalla sino la cantidad 
  correcta de círculos renderizados)
- Corré npm test y confirmame que todo sigue en verde
```

---

## Prompt 7 — Diagnóstico de datos mock en Positions.tsx

```text
El componente Positions.tsx usa datos mock hardcodeados en vez de consultar 
la API real del backend. Esto causa que se muestren posiciones con IDs que 
no existen en la BD (ej. id: 3 no existe, solo existen las del seed).

Antes de tocar nada, diagnosticá:

1. ¿Existe un endpoint en el backend que devuelva el listado de posiciones? 
   Revisá api-spec.yaml y los controllers/routes del backend para confirmarlo. 
   Mostrame qué endpoint es, qué método HTTP usa, y qué campos devuelve.
2. Revisá el componente Positions.tsx actual completo: qué campos usa de cada 
   posición (title, manager, deadline, status, id) para saber si el endpoint 
   real devuelve todo lo necesario o hay campos que solo existen en el mock.

No modifiques el backend, solo devolve el diagnóstico.
```

---

## Prompt 8 — Eliminar posición inexistente del mock

```text
En Positions.tsx, eliminá la tercera posición del array mock (id: 3, 
"Product Manager") porque no existe en el seed del backend y genera un 
404 al hacer click en "Ver proceso". Dejá solo las posiciones con id 1 
y 2 que sí existen en la BD. No toques nada más del componente.
```
