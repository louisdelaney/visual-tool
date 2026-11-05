<!--
Medir la pantalla y la distancia de visión, y la comprobación del punto ciego: las instrucciones y
las notas. Los títulos, los botones y los mensajes cortos están en calibration.ts.
Cada línea «##» nombra un lugar de la página: cambia las palabras que hay debajo, pero deja las
líneas «##» como están. CONTRIBUTING.md explica el resto.
-->

## screen.instructions

Sujeta una tarjeta bancaria, o cualquier tarjeta del mismo tamaño, plana contra la pantalla, sobre
el contorno. Mueve el control deslizante hasta que el contorno sea exactamente igual de ancho que la
tarjeta.

## screen.savedSize

El contorno está puesto al tamaño guardado en este navegador. Comprueba que sigue coincidiendo con
tu tarjeta.

## screen.keepZoom

No cambies el zoom del navegador después de este paso, y mantén la ventana en esta pantalla.

## distance.intro

Las tareas se definen en grados de ángulo visual, así que la página necesita saber a qué distancia
están tus ojos de la pantalla. Lo calcula a partir de tu punto ciego, que está a unos 13,5° de donde
mires. Siéntate en el centro, frente a la pantalla, como estarás durante las tareas: el cálculo lo da
por hecho.

## distance.windowNarrowFullScreen

<!-- Cuando la ventana es más estrecha que la pantalla: con pantalla completa disponible, o sin ella. -->

Esta ventana es más estrecha que tu pantalla. La comprobación del punto ciego y las tareas pasan a
pantalla completa al empezar, porque las dos dan por hecho que te sientas en el centro de lo que
dibuja la página.

## distance.windowNarrowNoFullScreen

Esta ventana es más estrecha que tu pantalla, y aquí no se puede usar la pantalla completa. Maximiza
la ventana y siéntate en el centro de ella: la comprobación del punto ciego y las tareas dan por
hecho que estás en el centro de lo que dibuja la página.

## distance.tabletNote

La comprobación del punto ciego necesita la barra espaciadora de un teclado. Si no tienes, mide con
una cinta métrica desde tus ojos hasta la pantalla, en la postura que tendrás durante las tareas, y
escribe la distancia abajo.

## blindSpot.missed

El punto llegó al borde sin que pulsaras <kbd>Espacio</kbd>. Comprueba que tu ojo derecho está
tapado del todo, y mantén el ojo izquierdo en el cuadrado y no en el punto. Si aun así nunca
desaparece, para y escribe tu distancia a mano.

## blindSpot.steps

<!-- Las instrucciones de la comprobación del punto ciego, en la pantalla de la prueba. -->

1. Siéntate en el centro, frente a la pantalla, como estarás durante la prueba, a un brazo de distancia.
2. Tápate el ojo **derecho** con la mano.
3. Mira el cuadrado negro y no dejes de mirarlo. No sigas el punto: lo seguirás viendo con el rabillo del ojo.
4. Un punto rojo se mueve hacia la izquierda, desaparece uno o dos segundos y luego vuelve. Pulsa <kbd>Espacio</kbd> en el momento en que desaparezca.

## blindSpot.repeats

<!-- Debajo de los pasos. {times} es cuántas mediciones hace. -->

Esto se repite {times} veces. Pulsa <kbd>Esc</kbd> en cualquier momento para parar.
