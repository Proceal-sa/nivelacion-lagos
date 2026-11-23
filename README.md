# TopoPiscícola Pro 🐟📐
### PWA 100% Offline-First para Topografía y Nivelación de Lagos Piscícolas

Aplicación Web Progresiva diseñada específicamente para topografía de precisión en exteriores (sol directo), optimizada para teléfonos móviles y trabajo en cuadrícula de estacas para el fondo de estanques y piscinas acuícolas de gran tamaño.

---

## 🌟 Características Principales

### 1. Configuración del Lago y Malla de Estacas
- **Geometría Paramétrica**: Configuración de número de filas (letras A, B, C...) y columnas (1, 2, 3...), con separación métrica independiente en $X$ y $Y$ ($\Delta X$, $\Delta Y$).
- **Caja de Pesca / Desagüe (Punto Más Bajo)**:
  - Selección visual del nodo o coordenada donde se ubica la caja de cosecha.
  - Cota base de diseño de referencia (cota más baja absoluta).
- **Cálculo Automático de Rasante**:
  - **Modo A (Doble Pendiente Ortogonal)**: % longitudinal hacia la columna de la caja + % transversal hacia el canal/eje de cosecha.
  - **Modo B (Pendiente Radial Directa)**: % uniforme según la distancia euclidiana directa a la caja de pesca.
  - Cálculo instantáneo de la cota de rasante para cada estaca con opción de **edición manual** para nodos singulares (rampas, zanjas, zonas especiales).

### 2. Gestión de Armadas y Puntos de Cambio (PC)
- **Cálculo de Altura Instrumental**: $HI = \text{Cota BM} + \text{Vista Atrás (V+)}$.
- **Asistente Guiado de Punto de Cambio (PC)**:
  - Paso 1: Lectura de Vista Adelante ($V^-$) en el PC $\to \text{Cota}_{PC} = HI_{prev} - V^-$.
  - Paso 2: Traslado del nivel y lectura de nueva Vista Atrás ($V^+$) sobre el mismo PC $\to HI_{new} = \text{Cota}_{PC} + V^+$.
  - Historial cronológico completo de armadas con selector para reactivar cualquier armada anterior.

### 3. Toma de Niveles Interactiva en Campo (Flujo con Cadenero)
- **Mapa Visual de la Cuadrícula**: Identificación visual del estado de cada estaca mediante código de colores de alto contraste:
  - 🟩 **A NIVEL**: Dentro de la tolerancia configurable (ej. $\pm 2$ cm).
  - 🟥 **CORTE**: Sobra tierra, muestra los metros a excavar (ej. `CORTE: +0.25 m`).
  - 🟦 **RELLENO**: Falta tierra, muestra los metros a rellenar (ej. `RELLENO: -0.18 m`).
  - 🟨 **CAJA DE PESCA**: Resaltada con estrella y borde de alta visibilidad.
- **Teclado Numérico Táctil Gigante**: Botones de $\ge 52$ px optimizados para uso con guantes, humedad o sol directo. Botones rápidos de $+1\text{ cm}$, $-1\text{ cm}$, borrar y atajos.
- **Lectura Ideal de Mira al Instante**: Muestra $HI - \text{Cota Diseño}$ en grande para que el topógrafo pueda cantarle inmediatamente al cadenero la lectura teórica sin hacer cuentas mentales.
- **Navegación Fluida**: Botones de *Guardar & Siguiente* para avanzar en orden de estacas sin salir del modal.
- **Puntos Libres / Auxiliares**: Registro de cotas fuera de malla (taludes, tuberías de entrada, bermas).

### 4. Control Hidráulico, Drenaje y Exportación
- **Detector de Contrapendientes y Charcos**: Algoritmo que analiza los gradientes hacia la caja de pesca. Si una estaca medida queda más baja que una vecina aguas abajo rumbo al desagüe, genera una alerta visual parpadeante (`⚠️ CHARCO`) para evitar empozamientos durante la cosecha de peces.
- **Balance de Movimiento de Tierras**: Estimación volumétrica de corte ($m^3$), relleno ($m^3$) y balance neto mediante el método de prismas de cuadrícula.
- **Exportación a CSV / Excel**:
  - Archivo CSV con cabecera UTF-8 BOM (compatible nativo con Microsoft Excel sin problemas de tildes).
  - Cartera topográfica completa, historial de armadas y resumen de movimiento de tierras.
  - Opciones de separador decimal y separador de columnas personalizables.

### 5. 100% Offline-First
- Funciona sin internet mediante **Service Workers** (caché total de assets) e **IndexedDB** (persistencia de datos local permanente).
- Modo Claro de **Ultra Alto Contraste para Sol Directo** y selector para Modo Noche.

---

## 🚀 Cómo Ejecutar la Aplicación

Al ser una aplicación web estática autónoma, no requiere instalación de dependencias pesadas.

### Opción 1: Con cualquier servidor local
Desde esta carpeta (`C:\Users\willi\.gemini\antigravity\scratch\topo-piscicola-pwa`):

```bash
# Con Node.js (npx)
npx serve .

# O con Python
python -m http.server 8080
```

Abra su navegador en `http://localhost:8080` o en la IP local de su red Wi-Fi para acceder desde su celular.

### Opción 2: Instalación en el Celular (PWA)
1. Conéctese a la aplicación desde el navegador del celular (Chrome en Android o Safari en iOS).
2. Toque en el menú de opciones del navegador y elija:
   - En Android: **"Instalar aplicación"** o **"Añadir a la pantalla de inicio"**.
   - En iOS (iPhone): Botón Compartir $\to$ **"Añadir a pantalla de inicio"**.
3. La aplicación funcionará a pantalla completa como una app nativa y estará disponible **incluso en modo avión y sin señal en zonas rurales**.

---

## 📁 Estructura del Proyecto

```
topo-piscicola-pwa/
├── index.html            # Interfaz principal, modales y navegación
├── manifest.json         # Manifiesto PWA para instalación en smartphone
├── sw.js                 # Service Worker para funcionamiento 100% offline
├── css/
│   └── styles.css        # Estilos de alto contraste para sol directo y teclado
├── js/
│   ├── db.js             # Capa de almacenamiento IndexedDB
│   ├── topo-math.js      # Motor matemático, pendientes, cotas y volúmenes
│   └── app.js            # Controlador de interfaz, eventos y exportación CSV
├── icons/
│   ├── icon.svg          # Ícono vectorial de mira topográfica y cuadrícula
│   ├── icon-192.png      # Ícono PWA estándar
│   └── icon-512.png      # Ícono PWA alta resolución
└── test-topo.js          # Suite de pruebas unitarias automáticas
```
