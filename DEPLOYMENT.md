# Deployment Guide

This guide explains how to deploy the JEE College Recommendation System on Vercel (frontend) and Railway/Render (backend).

## Architecture

- **Frontend**: React + TypeScript + Vite → Vercel
- **Backend**: FastAPI + Python → Railway or Render
- **Database**: Excel files stored in the backend

## Frontend Deployment (Vercel)

### 1. Prepare Frontend

1. **Environment Variables**: Create `.env.local` file:
```bash
VITE_API_BASE_URL=https://your-backend-url.railway.app
```

2. **Build Configuration**: The `vercel.json` file is already configured.

### 2. Deploy to Vercel

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel --prod
```

4. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Add environment variable: `VITE_API_BASE_URL` = `https://your-backend-url.railway.app`

## Backend Deployment (Railway)

### 1. Prepare Backend

1. **Create `railway.json`**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **Update CORS** in `main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-url.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Deploy to Railway

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Login to Railway**:
```bash
railway login
```

3. **Initialize Project**:
```bash
railway init
```

4. **Deploy**:
```bash
railway up
```

5. **Get the URL**:
```bash
railway domain
```

## Alternative Backend Deployment (Render)

### 1. Prepare Backend

1. **Create `render.yaml`**:
```yaml
services:
  - type: web
    name: jee-college-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATA_FOLDER_PATH
        value: data
      - key: MAX_RECOMMENDATIONS
        value: 50
```

### 2. Deploy to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure the build and start commands
4. Deploy

## Data Files

### Option 1: Include in Repository
- Add your Excel files to the `data/` folder
- Commit them to Git (they're already in `.gitignore` for privacy)
- Deploy with the data

### Option 2: Upload After Deployment
- Deploy without data files
- Use the `/upload-excel` endpoint to upload files after deployment

## Environment Variables

### Frontend (Vercel)
- `VITE_API_BASE_URL`: Your backend URL

### Backend (Railway/Render)
- `DATA_FOLDER_PATH`: Path to data folder (default: data)
- `MAX_RECOMMENDATIONS`: Max recommendations to return (default: 50)
- `GEOCODING_TIMEOUT`: Geocoding timeout (default: 10)
- `LOG_LEVEL`: Logging level (default: INFO)

## Testing Deployment

1. **Test Backend**: Visit `https://your-backend-url.railway.app/docs`
2. **Test Frontend**: Visit your Vercel URL
3. **Test Integration**: Use the frontend to make API calls

## Troubleshooting

### CORS Issues
- Ensure CORS is configured correctly in `main.py`
- Check that the frontend URL is in the allowed origins

### Data Loading Issues
- Verify Excel files are in the correct location
- Check file permissions
- Review backend logs for errors

### Build Issues
- Ensure all dependencies are in `requirements.txt`
- Check Python version compatibility
- Verify build commands are correct

## Cost Considerations

- **Vercel**: Free tier available for frontend
- **Railway**: Free tier available, then $5/month
- **Render**: Free tier available, then $7/month

## Security Notes

- Never commit sensitive data files to Git
- Use environment variables for configuration
- Enable HTTPS for all endpoints
- Consider rate limiting for production use 