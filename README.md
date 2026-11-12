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
| 🍎 **Contar** | ¿Cuántos hay? Tocando los dibujos se numeran y se oye el número. |
| 👂 **¿Qué número?** | Se oye un número y hay que tocarlo entre cuatro. |
| 🎯 **Busca el grupo** | Se ve un número y hay que elegir el grupo de dibujos que tiene esa cantidad. |
| ➕ **Sumas** | Dos grupos de dibujos para juntar y contar (2 + 3 = ?). |
| ➖ **Restas** | Los dibujos que se van aparecen tachados (5 − 2 = ?). |
| 🏆 **Mis premios** | Álbum de premios y cinturones (del blanco al dorado). |
| 📊 **Mi progreso** | Estadísticas para mayores: palabras que cuestan y palabras dominadas. |

Cada acierto suma una ⭐. Al llenar la barra se gana un premio sorpresa y salen globos para explotar.

## Ajustes (⚙️, para mayores)

- Sílabas que se practican, número de opciones y aciertos necesarios para el premio.
- Nivel de las palabras (fácil, medio o difícil) y lo exigente que es el micrófono.
- **Mostrar los dibujos** en «Lee la palabra», «Construye» y «¿Qué falta?». Si se quitan, sale una «?» y el dibujo aparece al acertar, para que el niño lea sin adivinar por el dibujo.
- **Mis palabras**: añade las tuyas (su nombre, `a-bue-la`…) con un emoji. Se separan en sílabas automáticamente.
- **Números**: contar y calcular hasta 5, 10 o 20, y si se muestran dibujos de ayuda en sumas y restas.
- Mayúsculas o minúsculas, velocidad de la voz, color del ninja y sonido.

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
js/core.js            datos guardados, voz, mascota, efectos, puntuación y premios
js/words.js           lista de palabras, separación en sílabas y comparación de lo leído
js/game-syllables.js  juego de sílabas
js/game-read.js       juego de lectura con micrófono
js/game-build.js      juego de construir palabras
js/game-picture.js    juego de palabra y dibujo
js/game-missing.js    juego de ¿qué falta?
js/game-numbers.js    juego de números (contar, qué número, busca el grupo, sumas y restas)
js/screen-progress.js pantalla de progreso
js/app.js             navegación (#menu, #silabas, #leer, #construir, #dibujo, #falta, #contar, #numero, #grupos, #sumar, #restar, #progreso) y ajustes
sw.js                 modo sin conexión
```
