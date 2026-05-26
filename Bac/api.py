from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dataset = None

@app.post("/upload-csv/")
def upload_csv(file: UploadFile = File(...)):
    global dataset
    if not file.filename.endswith('.csv'):
        return JSONResponse(status_code=400, content={"error": "Only CSV files are allowed."})
    content = file.file.read()
    df = pd.read_csv(io.BytesIO(content))
    dataset = df
    return {"columns": df.columns.tolist(), "rows": df.head(20).to_dict(orient="records")}

@app.get("/dashboard-data/")
def dashboard_data():
    global dataset
    if dataset is None:
        return JSONResponse(status_code=400, content={"error": "No dataset uploaded yet."})
    # Example: return summary stats for dashboard
    summary = dataset.describe(include='all').to_dict()
    return {"summary": summary, "columns": dataset.columns.tolist()}