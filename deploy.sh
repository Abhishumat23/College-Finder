#!/bin/bash

echo "🚀 JEE College Recommendation System Deployment Script"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "📋 Deployment Steps:"
echo "1. Deploy Backend to Railway"
echo "2. Deploy Frontend to Vercel"
echo "3. Configure Environment Variables"
echo ""

read -p "Do you want to deploy the backend to Railway first? (y/n): " deploy_backend

if [ "$deploy_backend" = "y" ]; then
    echo "🔧 Deploying Backend to Railway..."
    
    # Check if Railway is logged in
    if ! railway whoami &> /dev/null; then
        echo "Please login to Railway first:"
        railway login
    fi
    
    # Initialize Railway project if not already done
    if [ ! -f ".railway" ]; then
        railway init
    fi
    
    # Deploy to Railway
    echo "Deploying to Railway..."
    railway up
    
    # Get the Railway URL
    echo "Getting Railway URL..."
    RAILWAY_URL=$(railway domain)
    echo "✅ Backend deployed to: $RAILWAY_URL"
    
    # Update vercel.json with the Railway URL
    sed -i.bak "s|https://your-backend-url.railway.app|$RAILWAY_URL|g" vercel.json
    echo "✅ Updated vercel.json with Railway URL"
fi

read -p "Do you want to deploy the frontend to Vercel? (y/n): " deploy_frontend

if [ "$deploy_frontend" = "y" ]; then
    echo "🎨 Deploying Frontend to Vercel..."
    
    # Check if Vercel is logged in
    if ! vercel whoami &> /dev/null; then
        echo "Please login to Vercel first:"
        vercel login
    fi
    
    # Deploy to Vercel
    echo "Deploying to Vercel..."
    vercel --prod
    
    echo "✅ Frontend deployed to Vercel!"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Go to your Vercel project dashboard"
    echo "2. Add environment variable: VITE_API_BASE_URL = $RAILWAY_URL"
    echo "3. Redeploy the frontend"
fi

echo ""
echo "🎉 Deployment complete!"
echo "📖 Check DEPLOYMENT.md for detailed instructions and troubleshooting." 