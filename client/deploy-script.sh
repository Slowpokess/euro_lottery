#!/bin/bash

# Script to facilitate deploying changes to Railway and Vercel

echo "=== Collider Club Deployment Script ==="
echo "This script will help you deploy updates to Railway and Vercel"

# Step 1: Deploy to Railway
echo ""
echo "=== Step 1: Deploy Backend to Railway ==="
echo "Options:"
echo "1. Use Railway CLI"
echo "2. Manual deployment via Railway Dashboard"
echo "3. Skip this step"

read -p "Choose an option (1-3): " railway_option

case $railway_option in
  1)
    echo "Deploying to Railway via CLI..."
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
      echo "Railway CLI not found. Please install it first with: npm i -g @railway/cli"
      echo "Then login with: railway login"
      exit 1
    fi
    
    # Move to server directory
    cd server
    
    # Deploy to Railway
    railway up
    
    echo "Railway deployment initiated. Check Railway dashboard for status."
    ;;
  2)
    echo "Manual deployment steps:"
    echo "1. Go to https://railway.app/dashboard"
    echo "2. Select your Collider project"
    echo "3. Click 'Deploy' and select the latest commit"
    echo "4. Wait for deployment to complete"
    
    read -p "Press Enter once deployment is initiated..."
    ;;
  3)
    echo "Skipping Railway deployment."
    ;;
  *)
    echo "Invalid option. Skipping Railway deployment."
    ;;
esac

# Step 2: Deploy to Vercel
echo ""
echo "=== Step 2: Deploy Frontend to Vercel ==="
echo "Options:"
echo "1. Use Vercel CLI"
echo "2. Manual deployment via Vercel Dashboard"
echo "3. Skip this step"

read -p "Choose an option (1-3): " vercel_option

case $vercel_option in
  1)
    echo "Deploying to Vercel via CLI..."
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
      echo "Vercel CLI not found. Please install it first with: npm i -g vercel"
      echo "Then login with: vercel login"
      exit 1
    fi
    
    # Deploy to Vercel
    vercel --prod
    
    echo "Vercel deployment initiated. Check Vercel dashboard for status."
    ;;
  2)
    echo "Manual deployment steps:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Select your Collider project"
    echo "3. Click 'Deploy' and select the latest commit"
    echo "4. Wait for deployment to complete"
    
    read -p "Press Enter once deployment is initiated..."
    ;;
  3)
    echo "Skipping Vercel deployment."
    ;;
  *)
    echo "Invalid option. Skipping Vercel deployment."
    ;;
esac

echo ""
echo "=== Deployment Process Completed ==="
echo "Once deployments finish, test your application at:"
echo "Frontend: https://collidercluster.vercel.app"
echo "Backend: https://collider-back-production.up.railway.app"
echo ""
echo "To verify CORS is working correctly, open your browser's developer tools,"
echo "go to the Network tab, and check if API requests are successful."