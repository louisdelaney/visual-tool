<!--
La página Privacidad y riesgos, tal como se ve. «#» es el título de la página y «##» empieza una
sección; una lista justo debajo del título se muestra como los puntos clave. CONTRIBUTING.md explica
el resto.

Debe ser exacta: son las promesas del proyecto (ver AGENTS.md), y debe decir lo mismo que la página
en inglés (../en/privacy.md). Si el sitio o el servidor empiezan a recoger o registrar algo nuevo,
esta página debe decirlo.
-->

# Privacidad y riesgos

- **Solo por diversión.** Esta es una prueba en línea informal, hecha solo por curiosidad, y no es
  un consejo médico.
- **Todos los datos aportados son públicos.** Cualquiera puede [descargar](data) todos los
  resultados y respuestas que la gente decide aportar. La descarga se actualiza una vez al día.
- **Es anónima.** No hay cuentas, y con tus resultados no se guarda ningún nombre, correo
  electrónico ni dirección IP.
- **No se registra nada que te identifique.** Solo se envía lo que se enumera abajo, y solo si
  decides contribuir. El servidor guarda durante una semana una breve nota anónima de cada
  petición, sin nada sobre ti (ver «Qué registra el servidor»).

## Si contribuyes

Cuando terminas la prueba, se envía esto y se añade al conjunto de datos público:

- Tus respuestas del primer paso: tu franja de edad (como «De 25 a 34», nunca tu edad exacta), si
  tienes o sospechas que tienes un trastorno de la percepción visual, cuál, si te lo han
  diagnosticado, el uso de psicodélicos, una estimación de cuántas veces, cuánto hace que los
  usaste por última vez (en años y meses) y cuáles, si tomas medicamentos y cuáles, las notas, dónde
  encontraste la prueba y tu seudónimo, si diste uno.
- Tus resultados: si hiciste la prueba completa o la rápida, los umbrales, las sensibilidades y
  cada ensayo (qué se mostró, tu respuesta y cuánto tardaste).
- Los detalles técnicos necesarios para entender los resultados: la medición de la tarjeta, la
  distancia de visión, la frecuencia de actualización, el tamaño de la ventana y la densidad de
  píxeles, si usaste una computadora o una tableta, tu navegador y su versión principal (por
  ejemplo, «Chrome 131»), la hora en que empezó la prueba (nunca el momento exacto) y cuánto duró.

Solo se recoge lo necesario para interpretar los resultados. No se envía nada más, por inofensivo
que parezca: ni la resolución de tu pantalla, ni tu configuración de idioma, ni tu sistema
operativo, ni el momento exacto de nada.

Si decides no contribuir, no se envía nada. Tus resultados se quedan en tu navegador, y puedes
guardarlos en un archivo. Los archivos guardados, incluidos los PDF, se crean en tu navegador: no se
envía nada para crearlos.

## Tu seudónimo

El seudónimo es totalmente opcional. Si lo dejas en blanco, tus resultados no se pueden buscar ni
relacionar entre sí: es la opción más privada.

Si das uno, es la única llave de tus resultados. No hay contraseña, así que cualquiera que lo
escriba ve todos los resultados y respuestas enviados con él, y puede rellenar las preguntas con las
respuestas enviadas la última vez. Usa el botón «Generar uno» para obtener un par de palabras al
azar, y no uses tu nombre, un nombre de usuario que uses en otro sitio ni nada que apunte a ti.

## Qué registra el servidor

Para corregir fallos, el servidor guarda un breve registro de cada petición durante 7 días. Dice
qué parte del servicio se usó (por ejemplo, «enviar resultados»), si funcionó, cuánto tardó y un
número de referencia al azar creado para esa única petición. Si algo sale mal, también guarda un
breve mensaje de error.

No contiene tu dirección IP, tu navegador, tu seudónimo ni nada de lo que escribiste, y el número de
referencia no está vinculado a ti. Si falla el envío de tus resultados, esta página muestra ese
número de referencia, y puedes citarlo si informas de un problema.

## Qué no se recoge

- Ningún nombre, correo electrónico ni cuenta.
- Ninguna dirección IP, ningún detalle del navegador ni otros detalles de la petición guardados o
  registrados por el servidor, ni con tus resultados ni en ningún otro lugar.
- Ninguna cookie, analítica, publicidad ni rastreo de ningún tipo.
- Ningún contenido de terceros: las fuentes y todo lo demás se sirven desde este sitio, y la página
  está bloqueada para que tu navegador no contacte con ningún otro servidor.

## Quién puede ver igualmente tu dirección IP

Todo sitio web tiene que conocer tu dirección IP para enviarte una página. Estos servicios la ven,
y este proyecto no puede impedirlo:

- **GitHub**, que aloja esta página en GitHub Pages y la descarga de datos, ve tu dirección IP
  cuando cargas la página o descargas los datos, y puede guardarla en sus propios registros de
  servidor, según la declaración de privacidad de GitHub.
- **Google Cloud**, donde funciona el servidor, recibe tu dirección IP cuando se envían o se buscan
  resultados. El servidor está configurado para no guardarla, y para descartar los registros por
  petición que Google guardaría de otro modo, que la incluyen. La red de Google sigue gestionando la
  conexión.
- **Tu proveedor de internet**, y tu empresa o centro de estudios si usas su red, pueden ver que
  visitaste este sitio, pero no qué respondiste.

## Riesgos para ti

- **Alguien que conozca tu seudónimo** puede ver y descargar todos los resultados y respuestas que
  aportaste, incluidos los problemas de salud, los medicamentos y el uso de psicodélicos.
- **Todo lo que escribes es público**, en las casillas de notas, medicamentos, psicodélicos u
  «otro». No incluyas nombres, lugares, datos de contacto ni nada que te identifique.
- **Los detalles pueden sumarse.** Alguien que ya sepa mucho sobre ti, como cuándo hiciste la
  prueba y en qué computadora, podría reconocer tu registro por la hora en que se hizo, el tamaño de
  la ventana y el navegador. No usar seudónimo y escribir notas generales lo hace mucho más difícil.
- **Solo puedes retirar una aportación enseguida.** Justo después de enviarla, la página de
  resultados ofrece eliminar esa sesión de la base de datos, hasta que hagas la prueba de nuevo o
  cierres la pestaña. Usa un código secreto que el servidor da a tu navegador cuando se envía la
  sesión; el navegador lo guarda solo en memoria, y el servidor guarda solo una forma codificada de
  él, que no está en la descarga. Después ya no hay manera de demostrar que un resultado es tuyo, así
  que tampoco de eliminarlo. Una sesión eliminada sale de las cifras de los grupos al instante y de
  la descarga en su próxima actualización diaria, pero quien la haya descargado antes conserva su
  copia. Aporta solo lo que te parezca bien que sea público para siempre.
- **La prueba muestra puntos que parpadean y se mueven.** No la hagas si tienes epilepsia
  fotosensible, y para si te sientes mal.

## En este dispositivo

Tu navegador recuerda la medición de tu tarjeta, para que no tengas que repetirla la próxima vez. No
se guarda nada más en tu dispositivo, y la medición solo se envía como parte de una sesión que
decidas aportar.
