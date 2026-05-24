Despliega los cambios actuales a producción en Fly.io siguiendo estos pasos:

1. Corre `git status` para ver qué archivos cambiaron.

2. Si no hay cambios, informa al usuario que no hay nada que desplegar.

3. Si hay cambios, muestra un resumen breve de qué se modificó.

4. Corre `git add -A` para staging de todos los cambios.

5. Genera un mensaje de commit descriptivo en español basado en los archivos modificados (máximo 72 caracteres, sin comillas). Ejemplo: "feat: actualiza color del header y estilos del dashboard"

6. Corre `git commit -m "<mensaje generado>"`.

7. Corre `git push origin main`.

8. Corre `gh run list --repo AE-ROD/Agente-Whats-Cotizaciones --limit 1` para obtener el ID del pipeline.

9. Informa al usuario:
   - ✅ Push exitoso
   - 🚀 Pipeline corriendo en GitHub Actions
   - ⏱️ Los cambios estarán en https://franyelis-dashboard.fly.dev en aproximadamente 1-2 minutos
   - 🔗 Link directo al run: https://github.com/AE-ROD/Agente-Whats-Cotizaciones/actions
