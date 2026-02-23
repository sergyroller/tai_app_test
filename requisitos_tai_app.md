# Documento de Especificaciones Técnicas y Requisitos
## Aplicación Web de Tests para Oposición TAI

---

## 1. Resumen Ejecutivo
El objetivo de este proyecto es desarrollar una aplicación web responsiva (mobile-first) orientada a la preparación de la oposición de Técnicos Auxiliares de Informática (TAI). La aplicación permite a los usuarios realizar tests configurables extrayendo preguntas de una base de datos categorizada por Bloques, Temas y Tags. Incluye gestión de usuarios, estadísticas de progreso y dos modalidades principales de ejecución: Modo Estudio y Modo Examen.

---

## 2. Arquitectura y Stack Tecnológico

El proyecto utilizará un stack moderno basado en React y servicios Serverless.

* **Frontend:** Next.js (App Router recomendado).
* **Estilos:** TailwindCSS.
* **Backend / BaaS:** Supabase.
    * *Base de datos:* PostgreSQL.
    * *Autenticación:* Supabase Auth.
    * *Almacenamiento:* Supabase Storage (para imágenes de enunciados/respuestas).
* **Librerías Recomendadas:**
    * *Gestos/Swipe:* `react-swipeable` o `framer-motion` (para navegación móvil).
    * *Resaltado de código:* `react-syntax-highlighter` (imprescindible para preguntas de desarrollo/sistemas).
    * *Parseo CSV:* `papaparse` (para la importación masiva).
    * *Iconos:* `lucide-react` o `heroicons`.

---

## 3. Modelo de Datos (Esquema Propuesto en PostgreSQL)

La base de datos relacional debe contemplar, al menos, las siguientes entidades principales:

* **`profiles` (Usuarios):** Extiende la tabla de Auth de Supabase. Campos: `id`, `role` ('admin', 'user'), `created_at`.
* **`blocks` (Bloques):** `id`, `name` (ej. Bloque I, Bloque II...).
* **`topics` (Temas):** `id`, `block_id` (FK), `name`.
* **`tags` (Etiquetas):** `id`, `name`.
* **`questions` (Preguntas):**
    * `id`, `topic_id` (FK)
    * `statement` (Texto del enunciado)
    * `code_snippet` (Opcional - Texto con el código a formatear)
    * `code_language` (Opcional - Lenguaje para el syntax highlighter)
    * `image_url` (Opcional - URL del Storage de Supabase)
    * `explanation` (Feedback/Explicación visible al responder)
    * `is_active` (Booleano para borrado lógico)
* **`answers` (Respuestas):** `id`, `question_id` (FK), `text`, `is_correct` (Booleano), `image_url` (Opcional). (Siempre 4 opciones por pregunta).
* **`question_tags` (Tabla intermedia):** `question_id`, `tag_id`.
* **`test_history` (Historial de Tests):** `id`, `user_id`, `mode` ('study', 'exam'), `total_questions`, `correct_answers`, `incorrect_answers`, `blank_answers`, `final_score`, `created_at`.
* **`user_mistakes` (Registro de fallos):** `user_id`, `question_id`, `fail_count` (Para alimentar los "Tests de preguntas falladas").

---

## 4. Roles y Seguridad (RBAC)

El sistema debe implementar Row Level Security (RLS) en Supabase para proteger los datos.

* **Rol `admin`:**
    * Acceso total al CRUD de `questions`, `answers`, `blocks`, `topics` y `tags`.
    * Capacidad de invitar/crear nuevos usuarios con rol `user`.
    * Capacidad de desactivar/eliminar usuarios.
    * Acceso a sus propias estadísticas.
* **Rol `user`:**
    * Acceso de solo lectura a las preguntas y configuración de tests.
    * Permiso de escritura SOLO para insertar datos en `test_history` y `user_mistakes` asociados a su propio `user_id`.
    * No tiene acceso a la creación de cuentas de usuario.

---

## 5. Requisitos Funcionales

### 5.1. Panel de Administración (Backoffice)
* **Gestión de Preguntas:** Formulario para crear/editar/eliminar preguntas. Debe incluir subida de imágenes al Storage de Supabase y campo de texto para fragmentos de código, indicando el lenguaje.
* **Importación Masiva:** Interfaz para subir archivos JSON o CSV que parsee el contenido y haga una inserción masiva (bulk insert) en las tablas `questions` y `answers`.
* **Gestión de Estructura:** CRUD para añadir o modificar Bloques, Temas y Tags.
* **Gestión de Usuarios:** Tabla con los usuarios registrados, opción de dar de alta mediante email/contraseña, y botón para desactivar/eliminar cuentas.

### 5.2. Configuración del Test
Antes de iniciar un test, el usuario debe seleccionar:
* **Modalidad:** Modo Estudio o Modo Examen.
* **Filtros (Test Especiales):**
    * Por Bloque(s).
    * Por Tema(s).
    * Por Tag(s).
    * Preguntas falladas anteriormente.
    * Preguntas nunca vistas (que no existan en el historial del usuario).
* **Número de preguntas:** Configurable numéricamente.
* **Temporizador (Solo Modo Examen):** Input para establecer los minutos de duración máxima.

### 5.3. Dinámica y Ejecución del Test
* **Aleatoriedad:** Las preguntas recuperadas de la base de datos deben mostrarse en orden aleatorio. Las 4 opciones de respuesta de cada pregunta también deben renderizarse en orden aleatorio siempre.
* **Navegación:**
    * Paginación de 1 en 1.
    * Soporte para botones "Anterior" / "Siguiente".
    * Soporte para *Swipe* táctil en móviles (derecha para avanzar, izquierda para retroceder).
* **Bloqueo al responder:** En cuanto el usuario hace clic en una opción, la pregunta se bloquea instantáneamente. Ya no se puede cambiar la respuesta elegida.
* **Feedback Inmediato:** Al bloquearse la pregunta, se resalta visualmente la opción correcta en verde y las incorrectas en rojo (si se eligió una de ellas). Aparece inmediatamente el bloque de texto con la `explanation` de la pregunta. Este comportamiento es **idéntico en Modo Estudio y Modo Examen**.
* **Navegación de Revisión:** El usuario puede volver hacia atrás (swipe left o botón) para revisar preguntas ya contestadas, pero estas permanecerán bloqueadas mostrando el feedback. No se permite alterar la respuesta.
* **Preguntas en Blanco:**
    * *Modo Estudio:* El sistema no permite avanzar a la siguiente pregunta si no se ha seleccionado una respuesta.
    * *Modo Examen:* El usuario puede avanzar dejando la pregunta sin responder.
* **Finalización (Modo Examen):** El test termina si el usuario pulsa "Entregar/Finalizar" o si el temporizador llega a `00:00`.

### 5.4. Cálculo de Resultados y Puntuación
Al finalizar el test, se muestra una pantalla de resumen.
* **Modo Estudio:** Muestra conteo de aciertos y fallos.
* **Modo Examen:**
    * Suma 1 punto por acierto.
    * Resta 0.33 puntos (1/3) por cada fallo.
    * No suma ni resta por preguntas en blanco.
    * Cálculo: `(Aciertos * 1) - (Fallos * 0.33)`. Se mostrará la nota sobre 10 o nota base ajustada al total de preguntas del test.

### 5.5. Estadísticas de Usuario
* Dashboard personal para cada usuario.
* Historial de los últimos tests realizados (fecha, modalidad, puntuación).
* Métricas de rendimiento desglosadas por Bloque y Tema (para identificar áreas de mejora).

---

## 6. Requisitos No Funcionales y UI/UX
* **Mobile-first:** La interfaz de resolución de tests debe sentirse como una app nativa en el móvil. Botones grandes y legibles, aprovechamiento de gestos táctiles.
* **Resaltado de Sintaxis:** Cualquier texto en el campo `code_snippet` debe renderizarse utilizando un componente de resaltado de código respetando la indentación original.
* **Rendimiento:** Las imágenes deben estar optimizadas (uso de `next/image`).
* **Estado del Test:** Si el usuario recarga la página a mitad de un test, el estado del mismo debería mantenerse (opcional pero recomendado usar persistencia local o estado en URL).
