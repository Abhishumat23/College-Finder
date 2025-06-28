# Data Directory

Place your Excel (.xlsx) files in this directory.

## Expected Files:
- `iit_combined.xlsx` - IIT college data
- `nit_combined.xlsx` - NIT college data  
- `iiit_combined.xlsx` - IIIT college data
- `gfti_combined.xlsx` - GFTI college data

## Excel File Format:

Your Excel files should contain the following columns (column names are flexible):

| Column | Description | Example |
|--------|-------------|---------|
| Institute/College Name | Name of the institute | IIT Madras |
| Branch/Course | Academic branch | Computer Science and Engineering |
| Category | Student category | OBC, GENERAL, SC, ST, EWS |
| Gender | Gender requirement | Male-only, Female-only, Gender-Neutral |
| State | College location state | Tamil Nadu |
| City | College location city | Chennai |
| Quota | Quota type | HS (Home State), AI (All India) |
| Opening Rank | Opening cutoff rank | 1500 |
| Closing Rank | Closing cutoff rank | 2000 |
| Year | Academic year | 2023 |

## Notes:
- The system will automatically detect column variations
- All Excel files will be loaded automatically on startup
- Use the `/upload-excel` endpoint to add new files dynamically