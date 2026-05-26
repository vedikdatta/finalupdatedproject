"""
FactoryPulse AI — Backend Server
Loads pre-trained ML models, accepts CSV uploads, runs failure predictions,
and provides an intelligent chat assistant that answers questions about the data.
"""

import os, io, json, traceback, math
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# ── paths ────────────────────────────────────────────────────────────────────
BASE = Path(__file__).resolve().parent
FAILURE_MODEL_PATH  = BASE / "failure_model.pkl"
ISO_FOREST_PATH     = BASE / "iso_forest.pkl"
LABEL_ENCODER_PATH  = BASE / "label_encoder.pkl"
SCALER_PATH         = BASE / "scaler.pkl"

# ── load models ──────────────────────────────────────────────────────────────
failure_model  = joblib.load(FAILURE_MODEL_PATH)  if FAILURE_MODEL_PATH.exists()  else None
iso_forest     = joblib.load(ISO_FOREST_PATH)     if ISO_FOREST_PATH.exists()     else None
label_encoder  = joblib.load(LABEL_ENCODER_PATH)  if LABEL_ENCODER_PATH.exists()  else None
scaler         = joblib.load(SCALER_PATH)         if SCALER_PATH.exists()         else None

print("[OK] Models loaded:", {
    "failure_model": failure_model is not None,
    "iso_forest": iso_forest is not None,
    "label_encoder": label_encoder is not None,
    "scaler": scaler is not None,
})

# ── in-memory store for the current session CSV ──────────────────────────────
session_store: dict = {"df": None, "filename": None, "predictions": None, "summary": None}

# ── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(title="FactoryPulse AI Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXPECTED_FEATURES = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]",
    "Type_encoded",
    "Temp_delta",
    "Power",
    "cycle_time",
    "idle_time",
]


def safe_float(v):
    try:
        return float(v)
    except (ValueError, TypeError):
        return np.nan


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add derived columns if missing."""
    df = df.copy()
    if "Temp_delta" not in df.columns:
        if "Process temperature [K]" in df.columns and "Air temperature [K]" in df.columns:
            df["Temp_delta"] = df["Process temperature [K]"] - df["Air temperature [K]"]
    if "Power" not in df.columns:
        if "Torque [Nm]" in df.columns and "Rotational speed [rpm]" in df.columns:
            df["Power"] = df["Torque [Nm]"] * df["Rotational speed [rpm]"] * 2 * np.pi / 60
    if "Type_encoded" not in df.columns:
        if "Type" in df.columns and label_encoder is not None:
            try:
                df["Type_encoded"] = label_encoder.transform(df["Type"])
            except Exception:
                df["Type_encoded"] = 0
        else:
            df["Type_encoded"] = 0
    for c in ["cycle_time", "idle_time"]:
        if c not in df.columns:
            df[c] = 0
    return df


def build_summary(df: pd.DataFrame) -> dict:
    """Build a rich statistical summary of the dataframe."""
    summary = {
        "rows": len(df),
        "columns": list(df.columns),
        "numeric_stats": {},
        "categorical_stats": {},
    }
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            desc = df[col].describe().to_dict()
            summary["numeric_stats"][col] = {
                k: round(float(v), 4) if isinstance(v, (float, np.floating)) else int(v)
                for k, v in desc.items()
            }
        else:
            vc = df[col].value_counts().head(10).to_dict()
            summary["categorical_stats"][col] = {str(k): int(v) for k, v in vc.items()}
    return summary


def clean_for_json(obj):
    if isinstance(obj, float) or isinstance(obj, np.floating):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
        return float(obj)
    elif isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, tuple):
        return tuple(clean_for_json(v) for v in obj)
    return obj


DATASET_PATH = Path(__file__).parent / "current_dataset.csv"


def process_dataframe(df, filename):
    df_eng = engineer_features(df)
    df_eng.fillna(0, inplace=True)

    session_store["df"] = df_eng
    session_store["filename"] = filename
    session_store["predictions"] = None
    session_store["anomalies"] = None
    session_store["summary"] = build_summary(df_eng)

    predictions = None
    anomalies = None
    available = [c for c in EXPECTED_FEATURES if c in df_eng.columns]
    missing = [c for c in EXPECTED_FEATURES if c not in df_eng.columns]

    if failure_model and len(missing) == 0:
        X = df_eng[EXPECTED_FEATURES].apply(pd.to_numeric, errors="coerce").fillna(0)
        X_arr = X.values
        if scaler:
            X_scaled = scaler.transform(X_arr)
        else:
            X_scaled = X_arr
        preds = failure_model.predict(X_scaled)
        proba = failure_model.predict_proba(X_scaled) if hasattr(failure_model, "predict_proba") else None
        predictions = {
            "labels": [int(p) for p in preds],
            "failure_count": int(sum(preds)),
            "no_failure_count": int(len(preds) - sum(preds)),
            "probabilities": [round(float(p[1]), 4) for p in proba] if proba is not None else None,
        }
        df_eng["_predicted_failure"] = preds
        if proba is not None:
            df_eng["_failure_probability"] = [round(float(p[1]), 4) for p in proba]

    if iso_forest and len(missing) == 0:
        X_anom = df_eng[EXPECTED_FEATURES].apply(pd.to_numeric, errors="coerce").fillna(0)
        anom_preds = iso_forest.predict(X_anom.values)
        anomalies = {
            "anomaly_count": int((anom_preds == -1).sum()),
            "normal_count": int((anom_preds == 1).sum()),
        }
        df_eng["_anomaly"] = anom_preds

    summary = build_summary(df_eng)
    session_store["predictions"] = predictions
    session_store["anomalies"] = anomalies
    session_store["summary"] = summary

    return {
        "success": True,
        "filename": filename,
        "rows": len(df_eng),
        "columns": list(df_eng.columns),
        "predictions": predictions,
        "anomalies": anomalies,
        "summary": summary,
        "missing_features": missing,
        "available_features": available,
    }


def load_saved_dataset():
    if DATASET_PATH.exists():
        try:
            df = pd.read_csv(DATASET_PATH)
            process_dataframe(df, "current_dataset.csv")
            print("[OK] Loaded saved dataset from disk into session.")
        except Exception as e:
            print(f"[Error] Failed to load saved dataset: {e}")


load_saved_dataset()


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": failure_model is not None,
        "dataset_loaded": session_store.get("df") is not None,
    }


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """Upload a CSV, save it to disk, run predictions, store in session."""
    try:
        raw = await file.read()

        with open(DATASET_PATH, "wb") as f:
            f.write(raw)

        df = pd.read_csv(io.BytesIO(raw))
        result = process_dataframe(df, file.filename)
        return clean_for_json(result)
    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@app.get("/dashboard-data")
def get_dashboard_data():
    df = session_store.get("df")
    if df is None:
        return {"has_data": False}

    try:
        total_production = len(df)

        if "_predicted_failure" in df.columns:
            failure_count = df["_predicted_failure"].sum()
            efficiency = max(0, 100 - (failure_count / total_production * 100))
            defect_rate = (failure_count / total_production) * 100
        else:
            efficiency = 95.0
            defect_rate = 2.35

        if "Power" in df.columns:
            energy_usage = round(df["Power"].sum() / 1000, 1)
        else:
            energy_usage = 450

        num_chunks = 8
        chunk_size = max(1, total_production // num_chunks)
        productionData = []
        times = ["12 AM", "3 AM", "6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"]
        for i in range(num_chunks):
            chunk = df.iloc[i * chunk_size : (i + 1) * chunk_size]
            actual = 0
            if "Rotational speed [rpm]" in df.columns and len(chunk) > 0:
                mean_val = chunk["Rotational speed [rpm]"].mean()
                if not pd.isna(mean_val):
                    actual = int(mean_val / 2)
            if actual == 0:
                actual = len(chunk) * 100
            productionData.append({
                "time": times[i] if i < len(times) else f"{i}h",
                "actual": actual,
                "target": actual + int(actual * 0.1),
            })

        machines = []
        if "Type" in df.columns:
            types = df["Type"].unique()
            for t in types:
                type_df = df[df["Type"] == t]
                failures = type_df["_predicted_failure"].sum() if "_predicted_failure" in type_df.columns else 0
                eff = max(0, 100 - (failures / len(type_df) * 100))
                status = "Running" if eff > 80 else ("Maintenance" if eff < 50 else "Warning")
                color = "#22c55e" if status == "Running" else ("#ef4444" if status == "Maintenance" else "#eab308")
                machines.append({
                    "name": f"Type {t} Line",
                    "status": status,
                    "efficiency": round(eff, 1),
                    "color": color,
                })
        else:
            machines = [{
                "name": "Main Unit",
                "status": "Running" if efficiency > 80 else "Warning",
                "efficiency": round(efficiency, 1),
                "color": "#22c55e",
            }]

        alertsData = []
        if "_predicted_failure" in df.columns and "_failure_probability" in df.columns:
            high_risk = (
                df[df["_predicted_failure"] == 1]
                .sort_values("_failure_probability", ascending=False)
                .head(5)
            )
            for idx, row in high_risk.iterrows():
                prob = row["_failure_probability"]
                alertsData.append({
                    "icon": "⚠️",
                    "iconBg": "#ef4444",
                    "title": f"High Failure Risk ({prob * 100:.1f}%)",
                    "desc": f"Anomaly detected at machine index {idx}",
                    "time": "Just now",
                    "badge": "High",
                    "badgeBg": "#ef4444",
                    "read": False,
                })
        if len(alertsData) == 0:
            alertsData.append({
                "icon": "✅",
                "iconBg": "#22c55e",
                "title": "All Systems Nominal",
                "desc": "No recent failures predicted",
                "time": "Just now",
                "badge": "Info",
                "badgeBg": "#22c55e",
                "read": False,
            })

        return clean_for_json({
            "has_data": True,
            "stats": {
                "totalProduction": total_production,
                "machineEfficiency": round(efficiency, 1),
                "energyUsage": energy_usage,
                "defectRate": round(defect_rate, 2),
            },
            "productionData": productionData,
            "machines": machines,
            "alertsData": alertsData,
        })
    except Exception as e:
        traceback.print_exc()
        return {"has_data": False, "error": str(e)}


@app.get("/prediction-data")
def get_prediction_data():
    try:
        df = session_store.get("df")
        if df is None or len(df) == 0:
            return {"has_data": False}

        avg_temp = df["Air temperature [K]"].mean() - 273.15 if "Air temperature [K]" in df.columns else 72.5
        max_vibration = df["Torque [Nm]"].max() / 10 if "Torque [Nm]" in df.columns else 3.2
        avg_pressure = df["Rotational speed [rpm]"].mean() / 30 if "Rotational speed [rpm]" in df.columns else 48.0

        failure_prob = df["_failure_probability"].mean() if "_failure_probability" in df.columns else 0.1
        overall_eff = max(45, 100 - (failure_prob * 100))

        overdue_maintenance = 0
        if "Tool wear [min]" in df.columns and "_anomaly" in df.columns:
            overdue_maintenance = int(((df["Tool wear [min]"] > 200) & (df["_anomaly"] == -1)).sum())

        error_state = bool(df["_predicted_failure"].max() == 1) if "_predicted_failure" in df.columns else False
        warning_state = bool(df["_anomaly"].min() == -1) if "_anomaly" in df.columns else False

        plantData = {
            "avgTemp": avg_temp,
            "maxVibration": max_vibration,
            "avgPressure": avg_pressure,
            "overallEfficiency": overall_eff,
            "maintenanceOverdueCount": overdue_maintenance,
            "errorState": error_state,
            "warningState": warning_state,
            "timestamp": "Live Data",
        }

        chunk_size = max(1, len(df) // 4)
        heatmap_data = []
        for i in range(4):
            chunk = df.iloc[i * chunk_size : (i + 1) * chunk_size]
            t = chunk["Air temperature [K]"].mean() - 273.15 if "Air temperature [K]" in df.columns else 70
            v = chunk["Torque [Nm]"].max() / 10 if "Torque [Nm]" in df.columns else 3
            p = chunk["Rotational speed [rpm]"].mean() / 30 if "Rotational speed [rpm]" in df.columns else 45
            e = 100 - (chunk["_predicted_failure"].mean() * 100) if "_predicted_failure" in df.columns else 80
            heatmap_data.append({"week": f"Week {i + 1}", "temp": t, "vib": v, "press": p, "eff": e})

        return clean_for_json({
            "has_data": True,
            "filename": session_store.get("filename", ""),
            "plantData": plantData,
            "heatmapData": heatmap_data,
        })
    except Exception as e:
        traceback.print_exc()
        return {"has_data": False, "error": str(e)}


# ── Chat endpoint ─────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str


@app.post("/chat")
async def chat(req: ChatRequest):
    """Answer questions about the uploaded CSV data using statistical analysis."""
    df = session_store.get("df")
    question = req.question.lower().strip()

    if df is None:
        return {"answer": "Please upload a CSV file first so I can analyze your data and answer questions about it."}

    try:
        answer = generate_answer(question, df, session_store)
        return {"answer": answer}
    except Exception as e:
        traceback.print_exc()
        return {"answer": f"I encountered an error analyzing your data: {str(e)}"}


# ── Q&A engine ────────────────────────────────────────────────────────────────

# Keywords that indicate a manufacturing / data-related question
MANUFACTURING_KEYWORDS = [
    "failure", "fail", "predict", "risk", "anomal", "outlier", "temperature",
    "torque", "speed", "rpm", "tool", "wear", "pressure", "vibration", "power",
    "energy", "efficiency", "defect", "maintenance", "machine", "column", "feature",
    "data", "dataset", "csv", "row", "average", "mean", "max", "min", "correlat",
    "health", "status", "summary", "overview", "describe", "count", "total",
    "sensor", "production", "manufacturing", "process", "air", "rotational",
    "cycle", "idle", "type", "model", "sample", "statistic", "distribution",
    "temp", "heat", "rotation", "predict", "result", "report", "insight",
    "how many", "show me", "what is", "what are", "tell me", "give me",
]

# Short greetings (5 words or fewer)
GREETINGS = [
    "hello", "hi", "hey", "good morning", "good evening",
    "good afternoon", "howdy", "greetings", "hi there", "hey there",
]

# Phrases indicating the user wants guidance on the assistant's capabilities
HELP_PHRASES = [
    "i want to understand", "help me", "what can you do",
    "how do i", "guide me", "explain how", "what do you do",
    "what can i ask", "how does this work", "get started",
    "i want to know", "i need help",
]


def generate_answer(question: str, df: pd.DataFrame, store: dict) -> str:
    """Rule-based intelligent Q&A engine over the dataframe."""
    q = question.lower().strip()

    summary     = store.get("summary", {})
    predictions = store.get("predictions")
    cols        = list(df.columns)
    num_cols    = [c for c in cols if pd.api.types.is_numeric_dtype(df[c]) and not c.startswith("_")]
    cat_cols    = [c for c in cols if not pd.api.types.is_numeric_dtype(df[c])]

    # ── Guard 1: Greeting ────────────────────────────────
    is_greeting = (
        any(q == g or q.startswith(g) for g in GREETINGS)
        and len(q.split()) <= 5
    )
    if is_greeting:
        return (
            "👋 **Hello! I'm FactoryPulse AI Assistant.**\n\n"
            "I'm specialised in analysing your **manufacturing sensor data**. "
            "Here's what I can help with:\n\n"
            "• 🔴 Failure predictions & risk analysis\n"
            "• 🔎 Anomaly detection results\n"
            "• 📊 Column statistics (temperature, torque, RPM, tool wear, etc.)\n"
            "• 🔗 Feature correlations\n"
            "• ✅ Overall system health status\n"
            "• 📋 Dataset overview & summaries\n\n"
            "Try asking: _\"How many failures are predicted?\"_ or _\"Give me a summary.\"_"
        )

    # ── Guard 2: Help / capability questions ─────────────
    is_help = any(phrase in q for phrase in HELP_PHRASES)
    if is_help:
        return (
            "🛠️ **Here's what I can help you understand:**\n\n"
            "Upload a manufacturing CSV and ask me things like:\n\n"
            "• _\"How many failures are predicted?\"_\n"
            "• _\"Are there any anomalies in the data?\"_\n"
            "• _\"What is the average torque?\"_\n"
            "• _\"Which features are most correlated?\"_\n"
            "• _\"What is the system health status?\"_\n"
            "• _\"Give me an overview of the dataset\"_\n"
            "• _\"Show me statistics for Tool wear\"_\n\n"
            "I work exclusively with **factory / manufacturing data** — "
            "I'm not able to answer general knowledge questions."
        )

    # ── Guard 3: Off-topic catch-all ─────────────────────
    is_on_topic = any(kw in q for kw in MANUFACTURING_KEYWORDS)
    if not is_on_topic:
        return (
            "⚠️ **Out-of-scope question detected.**\n\n"
            "I'm a specialised assistant for **factory manufacturing data analysis** only. "
            "I'm not able to answer general knowledge, political, geographical, "
            "or unrelated questions.\n\n"
            "Please ask me something about your uploaded dataset — such as failures, "
            "anomalies, sensor readings, machine health, or statistics.\n\n"
            "_Example: \"What is the failure rate?\" or \"Show me anomalies.\"_"
        )

    # ── General overview ─────────────────────────────────
    if any(w in q for w in ["overview", "summary", "describe", "tell me about", "what is this", "what data"]):
        msg = f"📊 **Dataset Overview — {store.get('filename', 'Uploaded CSV')}**\n\n"
        msg += f"• **Rows:** {len(df)}\n"
        msg += f"• **Columns:** {len(cols)}\n"
        msg += f"• **Numeric columns:** {', '.join(num_cols[:8])}\n"
        if cat_cols:
            msg += f"• **Categorical columns:** {', '.join(cat_cols[:5])}\n"
        if predictions:
            rate = round(predictions['failure_count'] / len(df) * 100, 1)
            msg += (
                f"\n🔴 **Failure Predictions:** {predictions['failure_count']} failures detected "
                f"out of {len(df)} samples ({rate}% failure rate)\n"
            )
        return msg

    # ── Failure / prediction questions ───────────────────
    if any(w in q for w in ["failure", "fail", "predict", "risk", "danger", "broken", "break"]):
        if predictions is None:
            return (
                "The uploaded data doesn't contain the required manufacturing features for failure prediction. "
                "The model expects columns like: Rotational speed, Torque, Tool wear, Temperature, etc."
            )
        msg = "🔍 **Failure Prediction Analysis**\n\n"
        msg += f"• **Total samples:** {predictions['failure_count'] + predictions['no_failure_count']}\n"
        msg += f"• 🟢 **No Failure:** {predictions['no_failure_count']}\n"
        msg += f"• 🔴 **Predicted Failure:** {predictions['failure_count']}\n"
        rate = predictions['failure_count'] / (predictions['failure_count'] + predictions['no_failure_count']) * 100
        msg += f"• **Failure Rate:** {rate:.1f}%\n\n"
        if predictions.get("probabilities"):
            probs = predictions["probabilities"]
            high_risk = [i for i, p in enumerate(probs) if p > 0.7]
            if high_risk:
                msg += (
                    f"⚠️ **{len(high_risk)} samples with >70% failure probability.** "
                    f"Highest risk at rows: {', '.join(str(r) for r in high_risk[:10])}\n"
                )
        return msg

    # ── Anomaly questions ────────────────────────────────
    if any(w in q for w in ["anomal", "outlier", "unusual", "abnormal", "irregular"]):
        if "_anomaly" not in df.columns:
            return "Anomaly detection was not run on this dataset. The model needs numeric manufacturing features."
        anom  = (df["_anomaly"] == -1).sum()
        total = len(df)
        msg   = "🔎 **Anomaly Detection Results**\n\n"
        msg  += f"• **Anomalies detected:** {anom} out of {total} ({round(anom / total * 100, 1)}%)\n"
        msg  += f"• **Normal samples:** {total - anom}\n"
        if anom > 0:
            anom_rows = df[df["_anomaly"] == -1].head(5)
            msg += "\n📋 Top anomaly rows:\n"
            for idx, row in anom_rows.iterrows():
                vals = [f"{c}: {row[c]}" for c in num_cols[:4] if c in row.index]
                msg += f"  Row {idx}: {', '.join(vals)}\n"
        return msg

    # ── Column-specific statistics ───────────────────────
    matched_col = None
    for col in cols:
        if col.lower() in q or col.lower().replace(" ", "") in q.replace(" ", ""):
            matched_col = col
            break
    if matched_col is None:
        for col in cols:
            col_words = col.lower().replace("[", "").replace("]", "").split()
            if any(w in q for w in col_words if len(w) > 2):
                matched_col = col
                break

    if matched_col and pd.api.types.is_numeric_dtype(df[matched_col]):
        desc = df[matched_col].describe()
        msg  = f"📈 **Statistics for '{matched_col}'**\n\n"
        msg += f"• Count: {int(desc['count'])}\n"
        msg += f"• Mean: {desc['mean']:.2f}\n"
        msg += f"• Std Dev: {desc['std']:.2f}\n"
        msg += f"• Min: {desc['min']:.2f}\n"
        msg += f"• Max: {desc['max']:.2f}\n"
        msg += f"• Median: {desc['50%']:.2f}\n"
        return msg
    elif matched_col:
        vc  = df[matched_col].value_counts().head(10)
        msg = f"📊 **Value distribution for '{matched_col}'**\n\n"
        for val, cnt in vc.items():
            msg += f"• {val}: {cnt} ({round(cnt / len(df) * 100, 1)}%)\n"
        return msg

    # ── Average / mean ───────────────────────────────────
    if any(w in q for w in ["average", "mean", "avg"]):
        msg = "📊 **Averages for numeric columns:**\n\n"
        for col in num_cols[:10]:
            msg += f"• {col}: {df[col].mean():.2f}\n"
        return msg

    # ── Max / highest ────────────────────────────────────
    if any(w in q for w in ["max", "maximum", "highest", "peak", "top"]):
        msg = "📈 **Maximum values:**\n\n"
        for col in num_cols[:10]:
            msg += f"• {col}: {df[col].max():.2f}\n"
        return msg

    # ── Min / lowest ─────────────────────────────────────
    if any(w in q for w in ["min", "minimum", "lowest"]):
        msg = "📉 **Minimum values:**\n\n"
        for col in num_cols[:10]:
            msg += f"• {col}: {df[col].min():.2f}\n"
        return msg

    # ── Correlation ──────────────────────────────────────
    if any(w in q for w in ["correlat", "relationship", "related"]):
        if len(num_cols) >= 2:
            corr  = df[num_cols].corr()
            pairs = []
            for i in range(len(num_cols)):
                for j in range(i + 1, len(num_cols)):
                    pairs.append((num_cols[i], num_cols[j], corr.iloc[i, j]))
            pairs.sort(key=lambda x: abs(x[2]), reverse=True)
            msg = "🔗 **Top correlations:**\n\n"
            for a, b, c in pairs[:8]:
                msg += f"• {a} ↔ {b}: {c:.3f}\n"
            return msg
        return "Not enough numeric columns to compute correlations."

    # ── Count / how many rows ────────────────────────────
    if any(w in q for w in ["how many", "count", "total", "number of", "rows"]):
        msg = f"📋 The dataset has **{len(df)} rows** and **{len(cols)} columns**.\n"
        if predictions:
            msg += f"\n• Predicted failures: {predictions['failure_count']}\n"
            msg += f"• Normal: {predictions['no_failure_count']}\n"
        return msg

    # ── Columns / features ───────────────────────────────
    if any(w in q for w in ["column", "feature", "field", "variable", "what columns"]):
        msg = "📋 **Available columns:**\n\n"
        for c in cols:
            dtype = "numeric" if pd.api.types.is_numeric_dtype(df[c]) else "categorical"
            msg += f"• `{c}` ({dtype})\n"
        return msg

    # ── Health / status ──────────────────────────────────
    if any(w in q for w in ["health", "status", "condition", "safe"]):
        if predictions:
            rate = predictions['failure_count'] / len(df) * 100
            if rate < 5:
                msg = f"✅ **System Health: GOOD** — Only {rate:.1f}% failure rate detected."
            elif rate < 15:
                msg = f"⚠️ **System Health: MODERATE** — {rate:.1f}% failure rate. Preventive maintenance recommended."
            else:
                msg = f"🔴 **System Health: CRITICAL** — {rate:.1f}% failure rate! Immediate action required."
            return msg
        return "Upload manufacturing data with the required features to get a health assessment."

    # ── Fallback: prompt user with what's available ───────
    msg  = f"I have your data loaded ({len(df)} rows, {len(cols)} columns). Here's what I can help with:\n\n"
    msg += "• Ask about **failures/predictions** — _\"How many failures are predicted?\"_\n"
    msg += "• Ask about **anomalies** — _\"Are there any anomalies?\"_\n"
    msg += "• Ask about **specific columns** — _\"Tell me about Torque\"_\n"
    msg += "• Ask for **statistics** — _\"What's the average temperature?\"_\n"
    msg += "• Ask about **correlations** — _\"Which features are correlated?\"_\n"
    msg += "• Ask about **health status** — _\"What's the system health?\"_\n"
    msg += "• Ask for an **overview** — _\"Give me a summary\"_\n"
    return msg


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)