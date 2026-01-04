#!/bin/bash

# ============================================
# Script de déploiement CRM MSDN Consulting
# ============================================

set -e

echo "🚀 Déploiement du CRM MSDN Consulting sur Cloudflare"
echo ""

# Vérifier que wrangler est installé
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler n'est pas installé. Installez-le avec: npm install -g wrangler"
    exit 1
fi

# Vérifier l'authentification
echo "📝 Vérification de l'authentification Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Non authentifié. Exécutez: wrangler login"
    exit 1
fi

echo "✅ Authentifié"
echo ""

# Demander confirmation
read -p "Voulez-vous déployer l'API Worker ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Déploiement de l'API Worker..."
    cd workers/api
    npm install --silent
    wrangler deploy
    cd ../..
    echo "✅ API Worker déployé"
    echo ""
fi

# Déployer le Cron Worker
read -p "Voulez-vous déployer le Cron Worker ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Déploiement du Cron Worker..."
    cd workers/cron
    npm install --silent
    wrangler deploy
    cd ../..
    echo "✅ Cron Worker déployé"
    echo ""
fi

# Déployer le frontend
read -p "Voulez-vous déployer le Frontend (Pages) ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Déploiement du Frontend..."
    cd frontend
    npx wrangler pages deploy . --project-name=crm-frontend
    cd ..
    echo "✅ Frontend déployé"
    echo ""
fi

echo "🎉 Déploiement terminé !"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Vérifiez que l'URL de l'API est correcte dans frontend/src/lib/api.js"
echo "  2. Testez l'application"
echo "  3. Configurez un domaine personnalisé (optionnel)"
echo ""
