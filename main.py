from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import json
from pathlib import Path

from services.data_service import DataService
from services.recommendation_service import RecommendationService
from models.student_input import StudentInput
from models.college_response import CollegeResponse
from config.settings import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="JEE College Recommendation System",
    description="API for recommending colleges based on JEE ranks and preferences",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "https://*.vercel.app",   # Vercel deployments
        "https://*.railway.app",  # Railway deployments
        "https://*.render.com",   # Render deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
settings = get_settings()
data_service = DataService(settings.data_folder_path)
recommendation_service = RecommendationService(data_service)

@app.on_event("startup")
async def startup_event():
    """Initialize data on startup"""
    try:
        await data_service.load_all_data()
        logger.info("Data loaded successfully on startup")
    except Exception as e:
        logger.error(f"Failed to load data on startup: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "JEE College Recommendation API is running"}

@app.get("/filters")
async def get_filters():
    """Get available filter options from loaded data"""
    try:
        filters = await data_service.get_available_filters()
        return JSONResponse(content=filters)
    except Exception as e:
        logger.error(f"Error getting filters: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve filters")

@app.post("/predict-colleges", response_model=List[CollegeResponse])
async def predict_colleges(student_input: StudentInput):
    """Predict suitable colleges based on student preferences"""
    try:
        logger.info(f"Received prediction request: {student_input}")
        
        # Get college recommendations
        recommendations = await recommendation_service.get_recommendations(student_input)
        
        if not recommendations:
            return JSONResponse(
                status_code=200,
                content={
                    "message": "No colleges found matching your criteria",
                    "recommendations": []
                }
            )
        
        return recommendations
        
    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error predicting colleges: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to predict colleges")

@app.post("/upload-excel")
async def upload_excel_file(file: UploadFile = File(...)):
    """Upload and replace Excel data files"""
    try:
        if not file.filename.endswith('.xlsx'):
            raise HTTPException(status_code=400, detail="Only .xlsx files are allowed")
        
        # Save uploaded file
        file_path = os.path.join(settings.data_folder_path, file.filename)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Reload data with new file
        await data_service.load_all_data()
        
        logger.info(f"Successfully uploaded and loaded: {file.filename}")
        
        return JSONResponse(content={
            "message": f"File {file.filename} uploaded successfully",
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload file")

@app.get("/data-summary")
async def get_data_summary():
    """Get summary of loaded data"""
    try:
        summary = await data_service.get_data_summary()
        return JSONResponse(content=summary)
    except Exception as e:
        logger.error(f"Error getting data summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get data summary")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )