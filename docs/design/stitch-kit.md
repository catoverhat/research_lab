# Kit para Google Stitch

Para rediseñar la interfaz de Research Lab con [Google Stitch](https://stitch.withgoogle.com) (fase 4b). Solo texto: no hace falta subir capturas ni datos reales. Todos los ejemplos son inventados y de temas distintos, para que el diseño sirva a cualquier investigación.

## Cómo usarlo

1. En Stitch, crea un proyecto **web** y pega el **prompt base** (sección 1).
2. Pega los **prompts de pantalla** (sección 2) de uno en uno, en ese orden. Empieza por el informe de experimento: es la pantalla que más exige al sistema visual.
3. Itera con cambios pequeños, uno por mensaje («más contraste en las tablas», «menos espacio entre filas»). Si Stitch propone algo fuera de alcance, usa la sección 3.
4. Cuando te guste, **exporta el `DESIGN.md`** del proyecto. Si puedes, exporta también el HTML de 2 o 3 pantallas, solo como referencia visual.
5. Guárdalo en `docs/design/DESIGN.md` (o pásamelo). Yo lo valido con el linter de Google (`@google/design.md`), lo ajusto a las reglas del glosario y lo aplico a los estilos y componentes compartidos. Así cambian todas las pantallas a la vez, sin tocar la lógica.

---

## 1. Prompt base

```text
Diseña el sistema visual y las pantallas de «Research Lab», una aplicación web para investigar y decidir con evidencia.

QUÉ ES
Una persona organiza su investigación en proyectos. En cada proyecto registra productos y sus precios a lo largo del tiempo, prepara versiones de una receta (v1, v2…), las pone a prueba en experimentos, puntúa los resultados y escribe conclusiones con un nivel de evidencia. Hoy tiene un módulo de alimentos (recetas, nutrición, evaluación sensorial). Más adelante tendrá otros, como uno de compras para comparar, por ejemplo, electrodomésticos por precio y características. El diseño debe servir para cualquier tema: no lo ilustres con un producto concreto.

QUIÉN LA USA
Una persona investigadora con sesión iniciada; no hay registro público ni varios usuarios. Trabaja sobre todo en escritorio, y en el móvil registra datos al momento (en la cocina, en la tienda).

IDIOMA Y FORMATO
Toda la interfaz en español de República Dominicana. Fechas dd/mm/aaaa. Moneda RD$ con dos decimales (RD$1,234.50). Unidades g, ml y ud.

DIRECCIÓN VISUAL
Un cuaderno de laboratorio moderno: sobrio, preciso y legible, con aire de informe científico. Tablas densas pero respirables, formularios claros, cifras alineadas con números tabulares. Un color de acento para las acciones y neutros para la estructura. Sin degradados decorativos, ilustraciones ni fotos de stock. Modo claro primero; propone también el modo oscuro. El informe de experimento se imprime o se guarda en PDF: debe verse bien en papel y en blanco y negro.

REGLAS DE DATOS QUE EL DISEÑO DEBE MOSTRAR, NO ESCONDER
- Lo desconocido se muestra como «—», nunca como 0.
- Un total incompleto se marca: «RD$88.26 · faltan 2 precios».
- Las diferencias llevan signo y porcentaje: «+1.5 (+25%)», «−RD$20.89 (−19%)».
- «Mejor» o «peor» solo cuando los datos alcanzan: flecha, palabra y color a la vez. Si no alcanzan, la diferencia va en gris, neutra.
- Los estados van en insignias de texto, nunca solo con color:
  experimento (Planificado, Realizado, Fallido, Cancelado); receta (Borrador, Propuesta, Probada, Validada, Descartada); hipótesis (Pendiente, En prueba, Respaldada, Refutada, Inconclusa); evidencia (Confirmado, Preliminar, Anecdótico); proyecto (Planificado, Activo, En pausa, Terminado, Archivado).
- Lo registrado no se reescribe: los precios solo se añaden; una receta ya probada queda congelada y se crea una versión nueva; un experimento realizado no vuelve a planificado. El diseño lo explica con un aviso, sin botones que no se puedan usar.
- Borrar pide confirmación y va aparte, en una zona de peligro al final.

GRÁFICAS (mantén su forma; puedes proponer la paleta)
- Escala de puntos 0-10 por atributo: punto = media, línea fina = rango de notas, punto claro = referencia, unido al punto actual.
- Barras horizontales agrupadas para comparar hasta 4 experimentos, con leyenda.
- Línea en escalones para precios en el tiempo, una serie por proveedor.
Cada gráfica va acompañada de su tabla con los mismos datos. Nunca doble eje. Colores distinguibles con daltonismo; el texto de leyendas y etiquetas va en color de texto, no en el color de la serie.

ACCESIBILIDAD (WCAG 2.2 AA)
Contraste suficiente, foco visible, etiquetas siempre visibles (no solo placeholder), una línea de ayuda bajo el campo cuando haga falta, errores junto al campo y un aviso arriba, objetivos táctiles de 44 px en móvil, todo usable con teclado.

NAVEGACIÓN
Barra superior: Proyectos, Productos, Cuenta y Salir. Migas de pan: Proyecto › Receta › Experimento. Un enlace «Saltar al contenido».

EJEMPLOS (datos inventados; úsalos en lugar de lorem ipsum)
- Proyecto «Pan de masa madre más esponjoso»: recetas P1 v1 y P1 v2; hipótesis «Más hidratación da una miga más abierta».
- Proyecto «Cold brew en casa: molienda y tiempo de reposo».
- Producto «Harina de trigo todo uso 2 kg», con precios de dos supermercados en fechas distintas.
- Proyecto futuro del módulo de compras: «Elegir una freidora de aire».
```

---

## 2. Prompts de pantalla

### 2.1 Informe de experimento

```text
Pantalla: Informe de experimento. Es la pantalla principal del sistema y debe parecer un informe de laboratorio profesional, legible en pantalla e impreso.

Cabecera: etiqueta pequeña «Informe de experimento», título «P1 v2 · 27/11/2026» con la insignia «Realizado», el nombre de la receta («Hidratación al 75%») y «Proyecto: Pan de masa madre más esponjoso». Acciones: «Comparar» e «Imprimir».

Cuatro cifras clave en tarjetas:
- Nota global «7.5 / 10», detalle «2 evaluaciones · desv. 0.71», y «▲ +1.5 vs referencia» en gris (neutro: la referencia solo tiene una evaluación).
- Coste por ración «RD$18.40», «Precios del 27/11/2026», y «▼ RD$1.10 vs referencia» como mejora (flecha, palabra y color).
- Evaluadores «2», «8 notas registradas».
- Referencia «P1 v1», «26/10/2026».

Secciones numeradas, cada una en su bloque:
1. Objetivo e hipótesis: la hipótesis destacada como cita.
2. Diseño: «Comparado con P1 v1 · 26/10/2026». Tabla «Qué cambia respecto a la referencia» (Producto, Referencia, Este, Cambio): Agua 350 ml → 375 ml con la insignia «Cambia (+25 ml)»; Harina 500 g y Sal 10 g sin cambio, en gris.
3. Materiales y método: aviso «La composición quedó congelada al registrar el experimento»; tabla de ingredientes con cantidad y notas; «Preparación» y «Condiciones» en texto.
4. Resultados: la escala de puntos 0-10 (Global, Apariencia, Aroma, Acidez) con la referencia; debajo, su tabla (Atributo, Evaluaciones, Media, Rango, Desv. típica, Referencia, Diferencia «+1.5 (+25%)»); la tabla de notas por evaluador; la tabla de coste (lote, por ración, precios: «Completos» o «faltan 2 precios») y la de nutrición por ración, con «—» donde falta un dato.
5. Observaciones.
6. Conclusiones: cada una con su insignia de evidencia («Preliminar») y la frase «Estado actual de la hipótesis: Respaldada».
7. Limitaciones: lista de hechos («Evaluado por 2 personas», «La referencia tiene atributos con una sola evaluación»).

Al final, fuera del informe impreso, el bloque «Registrar datos» con tres paneles plegables: «Registrar evaluación sensorial», «Añadir conclusión» y «Editar datos del experimento» (con «Borrar experimento» en la zona de peligro).
Muestra también la vista de impresión: sin barra de navegación, sin botones ni formularios.
```

### 2.2 Formulario de evaluación sensorial

```text
Pantalla (panel abierto del informe): «Registrar evaluación sensorial».
- Campo «Evaluador», ya relleno con el nombre de la persona usuaria, con ayuda: «Quien prueba y puntúa (no quien preparó la receta). Usa un código, como P1, si la cata es anónima. Si ya evaluó, sustituye su evaluación anterior.»
- Línea: «Notas de 0 a 10, de medio en medio punto. Vacío = no evaluado (no es un 0).»
- Grupo «Agrado: cuánto gusta»: Global («Cuánto gusta en conjunto. 0 = no gusta nada · 10 = gusta muchísimo») y Apariencia.
- Grupo «Intensidad: cuánto se nota», con la nota «Más alto = más, no mejor. No importa si te gusta.»: Sabor, Aroma, Dulzor («0 = nada dulce · 10 = muy dulce»), Amargor, Espesor («Qué tan espeso se siente al probarlo. 0 = muy líquido · 10 = muy espeso»).
- Dos filas «Otro atributo» + «Nota», y «Comentario».
- Botón «Guardar evaluación».
Cada nota se introduce rápido en el móvil: teclado numérico, campos grandes, las anclas 0 y 10 siempre visibles (no en un tooltip).
```

### 2.3 Comparador

```text
Pantalla: Comparar experimentos de un proyecto.
- Arriba, una lista de casillas con los experimentos («P1 v2 · 27/11/2026 · Realizado») y el botón «Comparar». Se eligen 2 o más; la gráfica muestra hasta 4 y un aviso lo dice si hay más.
- «Cifras clave»: tabla con Experimento (enlace), Estado, «Nota global (n = evaluadores)» con valores como «7.5 (n=2, desv. 0.71)» o «6 (n=1)», y «Coste por ración (precios de su fecha)» con «· faltan 1 precio» cuando aplica.
- «Evaluación sensorial»: nota de lectura («Global y Apariencia miden agrado; los demás atributos, intensidad: más alto no significa mejor»), barras horizontales agrupadas por atributo y su tabla.
- «Composición»: matriz producto × experimento; las filas que cambian van en negrita con la insignia «Cambia».
- «Nutrición por ración»: matriz con «—» donde falta un dato y la fila «Ingredientes sin ficha».
Botón «Imprimir».
```

### 2.4 Proyecto

```text
Pantalla: Proyecto «Pan de masa madre más esponjoso» (insignia «Activo»), con objetivo y alcance en texto.
- «Recetas»: tabla con receta (P1 v1, P1 v2), nombre, estado y coste por ración a precios actuales (con «faltan N precios» si aplica). Panel «Nueva receta».
- «Experimentos»: tabla con fecha, receta, estado, coste del lote a precios de su fecha y nota global. Panel «Nuevo experimento» y enlace «Comparar experimentos».
- «Hipótesis y conclusiones»: recuento por estado («Pendiente: 2 · Respaldada: 1»), lista de hipótesis con su insignia, y conclusiones agrupadas por nivel de evidencia, cada una con su hipótesis y el enlace «(ver experimento P1 v2)».
- «Editar proyecto» plegable al final.
```

### 2.5 Receta

```text
Pantalla: Receta «P1 v2 · Hidratación al 75%» (insignia «Probada»).
- Aviso cuando ya tiene experimentos realizados: «Receta congelada: los cambios de composición se hacen en una versión nueva», con el botón «Crear versión nueva». Las notas siguen editables.
- Tabla de ingredientes: producto, cantidad con su unidad (g, ml, ud.) y notas. Formulario «Añadir ingrediente» solo si no está congelada.
- Resumen: raciones y tamaño de ración, coste del lote y por ración a precios actuales («faltan 1 precio» si aplica), nutrición por ración con «—» donde falta un dato.
- «Editar receta» plegable, con «Borrar versión» en la zona de peligro.
```

### 2.6 Productos y precios

```text
Pantalla A: Productos. Tabla con producto (marca, nombre y tamaño: «Harina de trigo todo uso 2 kg»), ingrediente, último precio con su fecha y coste por unidad («RD$0.06 / g»). Panel plegable «Nuevo producto» (marca, nombre, tamaño, unidad, ingrediente).

Pantalla B: Producto «Harina de trigo todo uso 2 kg».
- «Precios»: gráfica de línea en escalones por proveedor (dos supermercados), con la leyenda y «4 observaciones»; debajo, la tabla (Fecha, Precio, Por g, Proveedor, Disponible, Notas).
- Formulario «Añadir precio» (precio, fecha, proveedor, disponible, URL donde se vio, notas) con la ayuda «Los precios no se editan: cada observación es una fila nueva».
- «Editar producto» plegable; si el producto ya tiene precios o está en recetas, el tamaño y la unidad no se cambian (aviso: otra presentación es otro producto).
```

### 2.7 Inicio, entrada y cuenta

```text
Pantalla A: Proyectos (inicio). Lista de proyectos: título, estado y objetivo. Panel «Nuevo proyecto». Estado vacío útil para la primera vez.

Pantalla B: Entrar. Email y contraseña, verificación anti-bots (Cloudflare Turnstile) y el botón secundario «Entrar con passkey». Sin registro público. Mensajes de error claros junto al campo.

Pantalla C: Cuenta. «Sesión iniciada como …», «Tu nombre» (se propone como evaluador) y «Passkeys» (lista, añadir, borrar).
```

---

## 3. Si Stitch se sale del alcance

Pégale lo que corresponda:

```text
Fuera de alcance, no lo incluyas: funciones de IA o chat, varios usuarios o equipos, comentarios, notificaciones, paneles con métricas inventadas, fotos o ilustraciones, y cualquier cifra que no venga de los datos registrados.
```

```text
Mantén las reglas de datos: «—» para lo desconocido, totales parciales marcados, estados en insignias de texto, y la diferencia neutra cuando no hay datos suficientes.
```

## 4. Lo que no hará Stitch (y hago yo)

- Conectar el diseño con la app: los datos, las acciones del servidor, las reglas de la base y la seguridad ya existen y no cambian.
- Validar la paleta de las gráficas con el script de daltonismo y contraste.
- Comprobar que el `DESIGN.md` pasa el linter y aplicarlo a los componentes compartidos, con la revisión de UI/UX y la prueba de punta a punta.
