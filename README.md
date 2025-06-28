# JEE College Recommendation System

A FastAPI-based backend system with React frontend for recommending colleges to JEE aspirants based on their ranks, preferences, and other criteria.

## Features

### Backend Features
- **Dynamic Data Loading**: Loads college and cutoff data from Excel files (.xlsx) placed in the `/data` folder
- **Smart Recommendations**: Uses multiple factors including rank, distance, institute type, and branch preferences
- **Distance Calculation**: Calculates distances between home state and colleges using geopy
- **File Upload**: API endpoint to upload and replace Excel data files
- **Comprehensive Filtering**: Filter by rank, category, gender, state, institute type, and branches
- **Docker Support**: Ready for containerized deployment

### Frontend Features
- **Modern React Interface**: Clean, responsive UI built with React and TypeScript
- **Interactive College Cards**: Detailed college information with quota breakdowns
- **Quick Stats Dashboard**: Real-time statistics showing IIT, NIT, IIIT, and GFTI options
- **Advanced Filtering**: Sort by match score, closing rank, or distance
- **CSV Export**: Download recommendations as CSV files
- **Dark/Light Theme**: Toggle between themes for better user experience
- **Real-time Search**: Filter colleges by institute type dynamically

### Quick Stats Dashboard

The application includes a comprehensive Quick Stats dashboard that provides real-time insights into your college recommendations:

- **IIT Options**: Number of Indian Institutes of Technology available
- **NIT Options**: Number of National Institutes of Technology available  
- **IIIT Options**: Number of Indian Institutes of Information Technology available
- **GFTI Options**: Number of Government Funded Technical Institutes available

This dashboard helps students quickly understand the distribution of different institute types in their recommendations and make informed decisions about their college choices.

## API Endpoints

### POST /predict-colleges
Accepts student preferences and returns matching college recommendations.

**Request Body:**
```json
{
  "rank": 23000,
  "category": "OBC",
  "gender": "Female-only",
  "home_state": "Tamil Nadu",
  "preferred_institutes": ["NIT", "IIIT"],
  "preferred_branches": ["CSE", "ECE"],
  "max_distance_km": 500,
  "priority_preference": "rank"
}
```

### GET /filters
Returns available filter options from the loaded Excel data.

### POST /upload-excel
Upload new Excel files to replace existing data.

### GET /data-summary
Get summary statistics of loaded data.

### GET /health
Health check endpoint.

## Installation

### Backend Setup

1. Clone the repository
2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Create data directory and add Excel files:
```bash
mkdir data
# Place your Excel files (iit_combined.xlsx, nit_combined.xlsx, etc.) in the data folder
```

4. Copy environment variables:
```bash
cp .env.example .env
```

5. Run the backend application:
```bash
uvicorn main:app --reload
```

### Frontend Setup

1. Navigate to the project directory and install Node.js dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and visit `http://localhost:5173` (or the port shown in the terminal)

### Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

2. Or build and run with Docker:
```bash
docker build -t jee-recommender .
docker run -p 8000:8000 -v ./data:/app/data jee-recommender
```

## Excel File Format

The system expects Excel files with the following columns (column names are flexible):

- **Institute/College Name**: Name of the institute
- **Branch/Course**: Academic branch/course name
- **Category**: Student category (GENERAL, OBC, SC, ST, EWS)
- **Gender**: Gender requirement (Male-only, Female-only, Gender-Neutral)
- **State**: State where the college is located
- **Quota**: Quota type (HS for home state, AI for all India)
- **Opening Rank**: Opening rank for admission
- **Closing Rank**: Closing rank for admission
- **Year**: Academic year for the data

## Recommendation Algorithm

The system uses a multi-factor scoring algorithm:

1. **Rank Safety**: Primary factor based on the gap between student rank and closing rank
2. **Institute Preference**: Bonus points for preferred institute types
3. **Branch Preference**: Bonus points for preferred branches
4. **Distance**: Proximity bonus for nearby colleges
5. **Home State Quota**: Additional points for home state colleges

## Environment Variables

- `DATA_FOLDER_PATH`: Path to the folder containing Excel files (default: "data")
- `MAX_RECOMMENDATIONS`: Maximum number of recommendations to return (default: 50)
- `GEOCODING_TIMEOUT`: Timeout for geocoding requests (default: 10)
- `LOG_LEVEL`: Logging level (default: "INFO")

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Data Requirements

🔥 **Important**: This system does NOT use hardcoded data. All college information must be provided through Excel files placed in the `/data` folder.

Place your Excel files with names like:
- `iit_combined.xlsx`
- `nit_combined.xlsx`
- `iiit_combined.xlsx`
- `gfti_combined.xlsx`

## Error Handling

The API includes comprehensive error handling for:
- Invalid input data
- Missing Excel files
- Geocoding failures
- Data processing errors

## Logging

The application logs all important events including:
- Data loading status
- Recommendation requests
- Error conditions
- Performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.