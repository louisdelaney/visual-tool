<!--
La página Datos, tal como se ve. «#» es el título de la página y «##» empieza una sección.
{download} es el botón de descarga, que dibuja la página. CONTRIBUTING.md explica el resto.

La descripción debe coincidir con la página en inglés (../en/data.md), con la tarea de exportación
(backend/src/jobs/export.ts) y con el README.
-->

# Datos

Todos los resultados y respuestas que la gente decide aportar se pueden descargar, usar e
investigar libremente, por cualquiera y con cualquier fin.

{download}

## Licencia

Los datos tienen la licencia
[Creative Commons Atribución 4.0 Internacional (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/deed.es).
Puedes compartirlos y adaptarlos con cualquier fin, siempre que menciones de dónde vienen, con un
enlace a este sitio.

Por favor, no intentes averiguar quién es nadie. Quienes contribuyen son anónimos, y parte de lo
que compartieron es personal.

## Qué contienen

- Todas las sesiones aportadas, de todas las versiones de la prueba, con todos los ensayos, la
  calibración de la pantalla, los ajustes de la prueba y las respuestas del primer paso.
- Solo lo necesario para interpretar los resultados. Cada sesión tiene la hora en que empezó y
  cuánto duró, nunca momentos exactos, y sus ensayos no tienen ninguna hora. Las sesiones enviadas
  antes de que esto se restringiera se recortan de la misma manera.
- Se actualizan una vez al día, así que los resultados más recientes pueden tardar un día en
  aparecer.

## Formato

La descarga es un único archivo JSON comprimido con gzip, `visual-data.json.gz`, alojado en GitHub.
Contiene todas las sesiones por orden de llegada, en el mismo formato que el archivo que puedes
guardar de tus propios resultados, más la fecha en que se recibió cada una. Los nombres de los
campos y sus valores están en inglés. Cada sesión registra su `test_version`; compara solo sesiones
de la misma versión, ya que una versión nueva significa que la prueba misma cambió. Las sesiones
también registran `test_type`, `"full"` (completa) o `"quick"` (rápida); si no lo tienen, es la
completa. La prueba rápida es una prueba aparte, más corta y con resultados menos precisos:
mantenla separada de la prueba completa.

Los resultados vienen de personas que hacen una prueba informal en línea en sus propias pantallas,
sin supervisión, así que las pantallas, las distancias de visión y la atención varían.

Este proyecto solo recoge y comparte los datos. No los analiza ni saca conclusiones de ellos.
Cualquier análisis, y lo que concluya, es obra de quien lo haga, y citar este sitio como fuente no
significa que el proyecto esté de acuerdo con él.
