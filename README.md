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


## Versión 2 — mejoras

- Presets rápidos para retrato, calle, paisaje, macro y fauna.
- Configuraciones compartibles mediante URL.
- Botón de compartir con Web Share API cuando está disponible y copia al portapapeles como alternativa.
- PWA instalable mediante `manifest.webmanifest`.
- Service Worker para uso offline después de la primera carga.
- Icono propio SVG.
- Estado de configuración recuperable desde una URL.
- Preparado para publicación como sitio estático en GitHub Pages.

### Publicar en GitHub Pages

GitHub Pages puede publicar directamente archivos estáticos desde un repositorio. Para este proyecto, basta con subir los archivos a la raíz y configurar Pages para publicar la rama principal. La PWA debe servirse mediante HTTPS (GitHub Pages lo proporciona) para que las funciones de instalación/service worker funcionen correctamente.

Documentación oficial:
- https://docs.github.com/en/pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
