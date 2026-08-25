# DoF Studio — Simulador de profundidad de campo

Calculadora web responsive en español para fotógrafos, inspirada conceptualmente en los simuladores de profundidad de campo existentes, pero con una interfaz y código propios.

## Incluye

- Cámara/sensor: Full Frame, APS-C, Micro 4/3, medio formato, 1" y sensor personalizado.
- Círculo de confusión editable.
- Distancia focal de 10 a 600 mm.
- Apertura de f/1 a f/32.
- Distancia de enfoque de 0,15 a 1000 m.
- Unidades métricas y pies.
- Profundidad de campo total.
- Límite cercano y límite lejano.
- Distancia hiperfocal.
- División de profundidad delante/detrás del sujeto.
- Diagrama SVG interactivo que se actualiza en tiempo real.
- El sujeto del diagrama se puede arrastrar para cambiar la distancia de enfoque.
- Botón para enfocar directamente a la hiperfocal.
- Tema claro/oscuro.
- Diseño responsive para escritorio y móvil.
- Sin backend y sin dependencias externas: funciona de forma local y puede abrirse directamente.

## Ejecutar

No requiere Node.js para la versión entregada.

1. Abre `index.html` en un navegador moderno.
2. Para desarrollo, también puedes servir la carpeta con cualquier servidor estático.

Ejemplo con Python:

```bash
python -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Cálculo

El modelo utiliza:

- H = f² / (N · c) + f
- Límite cercano = H · s / (H + s − f)
- Límite lejano = H · s / (H − s + f), salvo cuando el enfoque alcanza/supera la hiperfocal, donde se considera infinito.

Las distancias internas se calculan en milímetros y se convierten a metros o pies para la interfaz.

El círculo de confusión predeterminado para cada formato se calcula a partir de una convención equivalente a diagonal/1500, salvo Full Frame, que parte de 0,029 mm. Es un criterio práctico, no una garantía de nitidez perceptual para todos los tamaños de impresión y visualización.

## Estructura

- `index.html` — interfaz y estructura.
- `styles.css` — diseño responsive y tema.
- `app.js` — estado, fórmulas, conversiones y visualización SVG.

## Nota

El proyecto está pensado como herramienta de planificación fotográfica. Los resultados dependen del criterio de círculo de confusión y de las condiciones reales de visualización, impresión y óptica.
