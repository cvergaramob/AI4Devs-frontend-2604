# Contexto de Backend — Pantalla Position

> Documento de referencia para implementar la pantalla **Position**: visualización y gestión de candidatos de una posición específica.
> Fuentes: `backend/ModeloDatos.md` y `backend/api-spec.yaml`.

---

## 1. Entidades relevantes

### Position
Representa una oferta de trabajo abierta en una empresa.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | int | Identificador único (PK, autoincremental) |
| `companyId` | int (FK) | Empresa que publica la posición |
| `interviewFlowId` | int (FK) | Flujo de entrevistas asignado |
| `title` | string | Título del puesto |
| `description` | string | Descripción general |
| `status` | string | Estado — valor por defecto: `'Draft'` |
| `isVisible` | boolean | Visibilidad pública — por defecto: `false` |
| `location` | string | Ubicación del puesto |
| `jobDescription` | string | Descripción detallada del trabajo |
| `requirements` | string | Requisitos del puesto |
| `responsibilities` | string | Responsabilidades del puesto |
| `salaryMin` / `salaryMax` | float | Rango salarial |
| `employmentType` | string | Tipo de empleo |
| `benefits` | string | Beneficios |
| `applicationDeadline` | datetime | Fecha límite de postulación |
| `contactInfo` | string | Información de contacto |

---

### InterviewFlow
Define el flujo de entrevistas de una posición.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | int | Identificador único (PK) |
| `description` | string \| null | Descripción del flujo |

Relaciones:
- Un `InterviewFlow` tiene múltiples `InterviewStep` (ordenados por `orderIndex`).
- Un `InterviewFlow` puede estar asociado a múltiples `Position`.

---

### InterviewStep
Representa cada etapa dentro de un flujo de entrevistas. Define las **columnas** del tablero kanban.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | int | Identificador único (PK) |
| `interviewFlowId` | int (FK) | Flujo al que pertenece |
| `interviewTypeId` | int (FK) | Tipo de entrevista |
| `name` | string | Nombre del paso (ej. "HR Screen", "Technical") |
| `orderIndex` | int | Orden dentro del flujo |

---

### Candidate
Persona que aplica a una posición.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | int | Identificador único (PK) |
| `firstName` | string | Nombre |
| `lastName` | string | Apellido |
| `email` | string | Correo electrónico (único) |
| `phone` | string \| null | Teléfono |
| `address` | string \| null | Dirección |

---

### Application
Vínculo entre un `Candidate` y una `Position`. Representa la postulación y lleva el seguimiento del paso actual.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | int | Identificador único (PK) |
| `positionId` | int (FK) | Posición a la que aplica |
| `candidateId` | int (FK) | Candidato que aplica |
| `applicationDate` | datetime | Fecha de postulación |
| `currentInterviewStep` | int (FK → InterviewStep.id) | Paso actual del candidato en el flujo |
| `notes` | string \| null | Notas adicionales |

---

### Interview
Registro de una entrevista concreta realizada en el marco de una aplicación.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | int | Identificador único (PK) |
| `applicationId` | int (FK) | Aplicación a la que pertenece |
| `interviewStepId` | int (FK) | Paso de entrevista al que corresponde |
| `employeeId` | int (FK) | Entrevistador (empleado) |
| `interviewDate` | datetime | Fecha de la entrevista |
| `result` | string | Resultado |
| `score` | int \| null | Puntuación obtenida |
| `notes` | string \| null | Notas del entrevistador |

---

## 2. Endpoints disponibles

### 2.1 Obtener flujo de entrevistas de una posición

```
GET /position/{id}/interviewflow
```

**Respuesta 200:**
```json
{
  "interviewFlow": {
    "positionName": "string",
    "interviewFlow": {
      "id": 1,
      "description": "string | null",
      "interviewSteps": [
        {
          "id": 1,
          "interviewFlowId": 1,
          "interviewTypeId": 2,
          "name": "HR Screen",
          "orderIndex": 1
        }
      ]
    }
  }
}
```

**Uso en pantalla:** cargar las columnas del tablero kanban (una columna por cada `InterviewStep`, ordenadas por `orderIndex`). También provee el nombre de la posición (`positionName`).

**Errores:** `404` si la posición no existe, `500` error interno.

---

### 2.2 Obtener candidatos de una posición

```
GET /position/{id}/candidates
```

**Respuesta 200:** array de candidatos con su estado actual.
```json
[
  {
    "id": 1,
    "applicationId": 10,
    "fullName": "string",
    "currentInterviewStep": "string",
    "averageScore": 4.5
  }
]
```

> **Nota:** `id` es el identificador del candidato (usado como `candidateId` en el PUT). `applicationId` es el identificador de la postulación (requerido para el PUT y como clave del drag & drop). `averageScore` puede ser `null` si el candidato no tiene entrevistas puntuadas aún.

**Uso en pantalla:** poblar las tarjetas de candidatos dentro de cada columna del tablero. `currentInterviewStep` indica en qué columna debe ubicarse la tarjeta; `averageScore` se muestra como indicador de puntuación.

**Errores:** `500` error interno.

---

### 2.3 Actualizar etapa de un candidato

```
PUT /candidates/{id}
```

**Body:**
```json
{
  "applicationId": 1,
  "currentInterviewStep": 3
}
```

**Respuesta 200:**
```json
{
  "message": "string",
  "data": {
    "id": 1,
    "positionId": 1,
    "candidateId": 1,
    "applicationDate": "2024-01-15T00:00:00Z",
    "currentInterviewStep": 3,
    "notes": "string | null",
    "interviews": [
      {
        "interviewDate": "2024-01-20T00:00:00Z",
        "interviewStep": "string",
        "score": 8
      }
    ]
  }
}
```

**Uso en pantalla:** mover una tarjeta de candidato de una columna a otra (drag & drop o selector de etapa). Se envía el `applicationId` de la aplicación y el `id` del nuevo `InterviewStep`.

**Errores:** `400` datos inválidos, `404` candidato/aplicación no encontrada, `500` error interno.

---

### 2.4 Obtener perfil completo de un candidato (opcional / detalle)

```
GET /candidates/{id}
```

**Respuesta 200:** perfil completo con educación, experiencia laboral, CVs y aplicaciones con sus entrevistas asociadas.

**Uso en pantalla:** panel lateral o modal de detalle al hacer clic en una tarjeta de candidato.

---

## 3. Relaciones clave para la pantalla

```
Position
  └── InterviewFlow
        └── InterviewStep[]  ←── columnas del tablero (ordenadas por orderIndex)
              └── Application[]  ←── tarjetas de candidatos
                    ├── Candidate  (fullName, averageScore)
                    └── Interview[]  (historial de entrevistas, scores)
```

---

## 4. Flujo de datos para renderizar el tablero

1. Llamar `GET /position/{id}/interviewflow` → obtener `positionName` y el array de `interviewSteps` (columnas).
2. Llamar `GET /position/{id}/candidates` → obtener candidatos con su `currentInterviewStep` (nombre del paso).
3. Distribuir candidatos en columnas comparando `currentInterviewStep` con el `name` de cada `InterviewStep`.
4. Al mover un candidato entre columnas → llamar `PUT /candidates/{candidateId}` con el `applicationId` y el nuevo `currentInterviewStep` (id del step destino).

---

## 5. Decisiones técnicas de implementación

- **Warning `ReactDOMTestUtils.act` en los tests**: es generado internamente por `@testing-library/react@13.4.0` al llamar a `render()` con React 18; no proviene del código de test. Es una incompatibilidad de versión conocida que se resuelve actualizando la librería a v14+. Se decidió **no actualizar** en este ejercicio para evitar abrir un frente de compatibilidad fuera de alcance; el warning no indica un bug en los tests ni en el componente.

- **Score como badge numérico**: el requisito original mencionaba un indicador visual de tipo "dot-rating". Se decidió mostrar el `averageScore` como un `Badge` de Bootstrap con el valor numérico formateado a un decimal (ej. `Score: 7.5`). Cuando el score es `null` o `0` se muestra `—`. Esta simplificación se tomó para evitar dependencias adicionales; puede reemplazarse por un componente de estrellas o dots en una iteración futura sin cambios en la lógica de negocio.

---

## 6. Consideraciones importantes

- `currentInterviewStep` en `GET /position/{id}/candidates` retorna el **nombre** del paso (string), no el id. Al hacer el `PUT` se envía el **id** del `InterviewStep`.
- Los pasos deben ordenarse siempre por `orderIndex` para renderizar las columnas en el orden correcto.
- `averageScore` puede ser `null` si el candidato no tiene entrevistas con puntuación aún; el tipo TypeScript es `number | null`.
- **`averageScore === 0` se trata igual que `null`** (se muestra `—`). Decisión de negocio: un score de exactamente 0 se considera ausente o inválido. Si el backend empieza a devolver 0 como puntuación real, esta lógica deberá revisarse.
- Si el `currentInterviewStep` de un candidato no coincide con ningún paso del flujo actual (datos inconsistentes), el candidato es mostrado en un aviso de "etapa no reconocida" en el tablero en lugar de desaparecer silenciosamente.
- Si una posición existe pero su flujo no tiene pasos definidos (`interviewSteps: []`), se muestra un aviso informativo y no se renderiza el tablero.
- No existe endpoint para listar las posiciones en detalle desde la pantalla Position; se asume que el `id` de la posición llega como parámetro de ruta (ej. `/positions/:id`).
