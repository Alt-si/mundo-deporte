# Publicar en Google Play (app tipo TWA)

Una TWA es tu PWA empaquetada como app de Android: abre el sitio en pantalla completa, sin barra de direcciones.

## 0. Antes de empezar
- La web tiene que estar publicada en **HTTPS en la raíz de un dominio**. Con GitHub Pages eso significa crear el repositorio con el nombre exacto **`TU-USUARIO.github.io`** (no `guia-tv`). Así queda en `https://TU-USUARIO.github.io/`, y el archivo `/.well-known/assetlinks.json` queda en el lugar que Android exige. (Con un dominio propio también sirve.)
- Con la programación real funcionando (el cartel de demo no tiene que aparecer) y capturas nuevas: `python3 tools/make-screenshots.py https://TU-USUARIO.github.io/`.

## 1. Cuenta de desarrollador
play.google.com/console → pago único de USD 25 y verificación de identidad. Las cuentas personales nuevas suelen tener que hacer una **prueba cerrada con al menos 12 testers durante 14 días seguidos** antes de poder pasar a producción (verificá la exigencia vigente en la consola).

## 2. Generar el paquete .aab (la forma fácil)
1. Entrá a **pwabuilder.com**, pegá `https://TU-USUARIO.github.io/` y tocá "Package for stores" → **Android**.
2. Package ID: `ar.com.TU-USUARIO.guiatv` (el que elijas, no se puede cambiar después). Dejá que cree una **signing key nueva** y descargá el ZIP.
3. **Guardá el ZIP y la clave (.keystore + contraseñas) en un lugar seguro.** Sin ellas no podés actualizar la app.
   Alternativa por línea de comandos: `npm i -g @bubblewrap/cli`, luego `bubblewrap init --manifest=https://TU-USUARIO.github.io/manifest.webmanifest` y `bubblewrap build` (hay una plantilla en `play/twa-manifest.json`; requiere JDK y Android SDK).

## 3. Crear la app en Play Console
1. "Crear app": nombre, idioma español (Argentina), app, gratuita.
2. Completá la ficha con `play/STORE-LISTING.md` y subí el ícono 512, la imagen destacada y las capturas de `play/graphics/`.
3. Contenido de la app: política de privacidad (`https://TU-USUARIO.github.io/privacy.html`), anuncios = no, clasificación de contenido, seguridad de los datos = no recopila, público objetivo.
4. Producción o Prueba cerrada → "Crear versión" → subí el `.aab`. Dejá activado **Play App Signing**.

## 4. Verificar el dominio (sin esto se ve la barra del navegador)
1. Play Console → Configuración → Integridad de la app → Firma de apps: copiá el **SHA-256 del certificado de firma de la app**.
2. Pegalo en `.well-known/assetlinks.json` (junto con tu Package ID), hacé commit y push. Si PWABuilder generó otro `assetlinks.json` con su propia huella, agregá ambas huellas a la lista.
3. Comprobá que abre `https://TU-USUARIO.github.io/.well-known/assetlinks.json`.

## 5. Revisión y actualizaciones
Enviá a revisión (de horas a varios días). Los cambios de programación y de la web **no requieren nueva versión** de la app: se actualizan solos desde el sitio.

## Riesgos a tener en cuenta
- La programación proviene de sitios de terceros: revisá sus términos de uso antes de publicar una app en una tienda. Si Google o el dueño de los datos lo objetan, pueden pedirte retirarla.
- No uses logos de los canales ni de DIRECTV/Flow/Telecentro, y mantené el aviso de que la app no está afiliada.
