# 🥷 Dojo Ninja

Juego web para que los niños aprendan a leer y a contar, con premios, cinturones y un ninja que los anima.
Funciona sin conexión y se puede instalar en el móvil o la tablet (PWA).

## Juegos

| Pantalla | Qué se hace |
|---|---|
| 🚪 **Sílabas** | Se oye una sílaba y hay que abrir la puerta correcta, o tocar el farolillo correcto en el modo 🏮 Farolillos. |
| 🎤 **Lee la palabra** | Se muestra un dibujo y su palabra separada en sílabas. El niño pulsa 🎤 y la lee en voz alta, y el micrófono comprueba si la ha leído bien. Con 🔊 se puede oír la palabra y tocando una sílaba se oye esa sílaba. |
| 🧩 **Construye** | Se oye la palabra y hay que ordenar sus sílabas. |
| 🖼️ **Palabra y dibujo** | Se ve una palabra escrita (sin oírla) y hay que leerla y tocar su dibujo. Uno de los dibujos falsos empieza por la misma letra, para que lea la palabra entera. |
| 🔍 **¿Qué falta?** | A la palabra le falta una sílaba y hay que elegir la que completa el hueco. |
| 🃏 **Parejas** | Juego de memoria: se enseñan las cartas un momento y hay que juntar cada palabra con su dibujo. |
| 👍 **¿Sí o no?** | Un dibujo y una palabra escrita: ¿pone lo mismo que el dibujo? |
| 🔤 **Letras** | Como «Construye», pero letra a letra (palabras de hasta 7 letras). |
| 🍎 **Contar** | ¿Cuántos hay? Tocando los dibujos se numeran y se oye el número. |
| 👂 **¿Qué número?** | Se oye un número y hay que tocarlo entre cuatro. |
| 🎯 **Busca el grupo** | Se ve un número y hay que elegir el grupo de dibujos que tiene esa cantidad. |
| 🐛 **Series** | Cuatro números seguidos con un hueco (a veces hacia atrás, y de 2 en 2 si se cuenta hasta 20). |
| 🐘 **Mayor o menor** | Tres números: hay que tocar el mayor (🐘) o el menor (🐭). |
| 🪜 **Ordena** | Tocar cuatro números del menor al mayor. |
| ➕ **Sumas** | Dos grupos de dibujos para juntar y contar (2 + 3 = ?). |
| ➖ **Restas** | Los dibujos que se van aparecen tachados (5 − 2 = ?). |
| 🏆 **Mis premios** | Álbum con 66 premios (30 imágenes y 36 pegatinas ninja), 18 cinturones (del blanco al Dragón) y 28 medallas por logros (estrellas, rachas, 20 aciertos en cada juego…). |
| 📊 **Mi progreso** | Estadísticas para mayores: palabras que cuestan y palabras dominadas. |

Cada acierto suma una ⭐. Al llenar la barra se gana un premio sorpresa y salen globos para explotar.

## Ajustes (⚙️, para mayores)

- Sílabas que se practican, número de opciones y aciertos necesarios para el premio.
- Nivel de las palabras (fácil, medio o difícil) y lo exigente que es el micrófono.
- **Mostrar los dibujos** en «Lee la palabra», «Construye» y «¿Qué falta?». Si se quitan, sale una «?» y el dibujo aparece al acertar, para que el niño lea sin adivinar por el dibujo.
- **Mis palabras**: añade las tuyas (su nombre, `a-bue-la`…) con un emoji. Se separan en sílabas automáticamente.
- **Números**: contar y calcular hasta 5, 10 o 20, y si se muestran dibujos de ayuda en sumas y restas.
- **Voz**: se puede elegir entre las voces en español que tenga el dispositivo (primero las de España), el tono (grave, normal o aguda) y la velocidad, y probarla con «🔊 Probar la voz». Para tener más voces hay que instalarlas en los ajustes de texto a voz del sistema.
- Mayúsculas o minúsculas, color del ninja y sonido.

Las sílabas sueltas se dicen con tilde (`to` → `tó`): así ninguna voz las lee en inglés o como abreviatura.

## Probarlo en local

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

El micrófono necesita **Chrome o Edge**, conexión a internet y una página servida por `https` o `localhost`.
Si no está disponible, aparecen los botones «✅ ¡Bien leído!» y «🔁 Otra vez» para que un adulto valide la lectura.

## Estructura

```
index.html            pantallas y diálogos
css/index.css         estilos y animaciones
js/core.js            datos guardados, voz, mascota, efectos, puntuación, premios, cinturones y medallas
js/words.js           lista de palabras, separación en sílabas y comparación de lo leído
js/game-syllables.js  juego de sílabas
js/game-read.js       juego de lectura con micrófono
js/game-build.js      juego de construir palabras
js/game-picture.js    juego de palabra y dibujo
js/game-missing.js    juego de ¿qué falta?
js/game-pairs.js      juego de parejas (memoria)
js/game-yesno.js      juego de ¿sí o no?
js/game-spell.js      juego de letras
js/game-numbers.js    juego de números (contar, qué número, busca el grupo, series, mayor o menor, ordena, sumas y restas)
js/screen-progress.js pantalla de progreso
js/app.js             navegación (#menu, #progreso y una ruta por juego: ver ROUTES) y ajustes
sw.js                 modo sin conexión
```
