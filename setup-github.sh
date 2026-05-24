#!/bin/bash
# Script automático: configura SSH para GitHub y hace push del repo Agente-Whats-Cotizaciones
# Generado para Alejandro (AE-ROD)
set -e

REPO_DIR="$HOME/Desktop/Agente-Whats-Cotizaciones"
EMAIL="alejandrrodriguez17@gmail.com"
SSH_KEY="$HOME/.ssh/id_ed25519"

echo ""
echo "============================================"
echo " Setup GitHub - AE-ROD/Agente-Whats-Cotizaciones"
echo "============================================"
echo ""

# 1. Verificar / generar SSH key
if [ -f "$SSH_KEY" ]; then
  echo "[1/5] Ya existe una SSH key en $SSH_KEY — la reutilizo."
else
  echo "[1/5] No encontré SSH key. Generando una nueva (ed25519)..."
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  ssh-keygen -t ed25519 -C "$EMAIL" -f "$SSH_KEY" -N ""
  echo "    ✓ SSH key creada."
fi

# 2. Asegurar que el ssh-agent esté corriendo y la key cargada
echo "[2/5] Cargando key al ssh-agent y al Keychain de macOS..."
eval "$(ssh-agent -s)" > /dev/null

# Asegurar config de ~/.ssh/config para que use el Keychain automáticamente
SSH_CONFIG="$HOME/.ssh/config"
if ! grep -q "UseKeychain yes" "$SSH_CONFIG" 2>/dev/null; then
  cat >> "$SSH_CONFIG" <<'EOF'

Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
EOF
  chmod 600 "$SSH_CONFIG"
  echo "    ✓ Configuré ~/.ssh/config para usar Keychain."
fi

ssh-add --apple-use-keychain "$SSH_KEY" 2>/dev/null || ssh-add "$SSH_KEY"

# 3. Copiar la public key al portapapeles y abrir GitHub
echo "[3/5] Copiando tu public key al portapapeles..."
pbcopy < "${SSH_KEY}.pub"
echo "    ✓ Lista para pegar."

echo ""
echo "============================================"
echo " ACCIÓN MANUAL — UN SOLO PASO"
echo "============================================"
echo " 1. Voy a abrirte la página de GitHub en 3 segundos."
echo " 2. En 'Title' escribe: MacBook Alejandro"
echo " 3. En 'Key' presiona Cmd+V (ya está copiada)."
echo " 4. Click 'Add SSH key' y vuelve a esta terminal."
echo "============================================"
sleep 3
open "https://github.com/settings/ssh/new"

echo ""
read -p ">>> Cuando termines en GitHub, presiona Enter aquí para continuar..."

# 4. Probar conexión
echo ""
echo "[4/5] Probando conexión con GitHub..."
ssh -o StrictHostKeyChecking=accept-new -T git@github.com || true
echo ""

# 5. Push
echo "[5/5] Haciendo push del repo..."
cd "$REPO_DIR"
BRANCH=$(git branch --show-current)
echo "    Branch actual: $BRANCH"
echo "    Remote: $(git remote get-url origin)"
echo ""
git push -u origin "$BRANCH"

echo ""
echo "============================================"
echo " ✓ ¡Listo! Tu rama '$BRANCH' está en GitHub."
echo "============================================"
echo " Puedes verla en:"
echo " https://github.com/AE-ROD/Agente-Whats-Cotizaciones/tree/$BRANCH"
echo ""
