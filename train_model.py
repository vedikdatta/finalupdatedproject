# -*- coding: utf-8 -*-
"""
Created on Sat May 23 10:56:43 2026

@author: user
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, roc_auc_score, roc_curve,
    f1_score, precision_score, recall_score
)
import joblib, os, warnings
warnings.filterwarnings('ignore')

# ── 1. Load data ──────────────────────────────────────────────
df = pd.read_csv('data/ai4i2020_final_updated_dataset.csv')

# Always check shape first
print(f"Shape: {df.shape}")           # (10000, 17)
print(f"Columns:{df.columns.tolist()}")
print(f"Data types:{df.dtypes}")
print(f"First 3 rows:{df.head(3)}")

# Check for missing values
print(f"Missing values:{df.isnull().sum()}")

# Target distribution — VERY IMPORTANT
print(f"Failure distribution:{df['Machine failure'].value_counts()}")
print(f"Failure rate: {df['Machine failure'].mean()*100:.2f}%")

# Machine type distribution
print(f"Machine types:{df['Type'].value_counts()}")
# ── 2. Preprocess ─────────────────────────────────────────────

# Parse install_date (not used as feature but useful for analysis)
df['install_date'] = pd.to_datetime(
    df['install_date'], format='%d-%m-%Y', errors='coerce'
)

# ── Feature engineering ──────────────────────────────────────

# 1. Encode Type column: L → 0, M → 1, H → 2
le = LabelEncoder()
df['Type_encoded'] = le.fit_transform(df['Type'])
print(f"Type mapping: {dict(zip(le.classes_, le.transform(le.classes_)))}")
# → {'H': 0, 'L': 1, 'M': 2}

# 2. Temperature delta — physics-based feature
#    Low delta → poor heat dissipation → more failures
df['Temp_delta'] = (
    df['Process temperature [K]'] - df['Air temperature [K]']
)

# 3. Power = torque × rotational speed (physics)
#    Used in overstrain and power failure detection
df['Power'] = df['Torque [Nm]'] * df['Rotational speed [rpm]']

# ── Define feature list ───────────────────────────────────────
FEATURES = [
    'Air temperature [K]',
    'Process temperature [K]',
    'Rotational speed [rpm]',
    'Torque [Nm]',
    'Tool wear [min]',
    'idle_time',
    'cycle_time',
    'Type_encoded',
    'Temp_delta',       # engineered
    'Power',              # engineered
]

TARGET = 'Machine failure'

X = df[FEATURES].copy()
y = df[TARGET].copy()

print(f"Feature matrix shape: {X.shape}")
print(f"Target shape: {y.shape}")
print(f"Feature stats:{X.describe().round(2)}")
# ── 3. Train/test split ────────────────────────────────────────

# stratify=y → ensures both splits have ~3.39% failure rate
# Without stratify, you might get 0% failures in test set by chance
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,        # 80% train, 20% test
    random_state=42,
    stratify=y            # critical for imbalanced datasets
)

print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")
print(f"Train failures: {y_train.sum()} ({y_train.mean()*100:.1f}%)")
print(f"Test failures:  {y_test.sum()}  ({y_test.mean()*100:.1f}%)")
# Both should show ~3.39%

# ── 4. Feature scaling ────────────────────────────────────────

# StandardScaler: mean=0, std=1 for each feature
# Fit ONLY on training data, transform both
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)   # fit + transform
X_test_scaled  = scaler.transform(X_test)         # transform only

print(f"Scaled feature means (should be ~0): {X_train_scaled.mean(axis=0).round(3)}")
print(f"Scaled feature stds  (should be ~1): {X_train_scaled.std(axis=0).round(3)}")
# ── 5. Train Random Forest ────────────────────────────────────

rf = RandomForestClassifier(
    n_estimators=200,        # 200 trees — more = better but slower
    max_depth=12,            # max tree depth — prevents overfitting
    min_samples_split=10,    # need 10 samples to split a node
    min_samples_leaf=4,      # each leaf needs 4+ samples
    max_features='sqrt',     # use √n features per split (default)
    class_weight='balanced', # AUTO-adjusts for 3.39% minority class
    random_state=42,         # reproducibility
    n_jobs=-1               # use all CPU cores
)

rf.fit(X_train_scaled, y_train)
print("Random Forest trained!")

# ── Cross-validation (more reliable than single split) ────────
cv_scores = cross_val_score(
    rf, X_train_scaled, y_train,
    cv=5,                    # 5-fold cross validation
    scoring='f1'             # use F1 for imbalanced data
)
print(f"5-Fold CV F1 scores: {cv_scores.round(3)}")
print(f"Mean CV F1: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
# ── 6. Full evaluation ────────────────────────────────────────

y_pred      = rf.predict(X_test_scaled)
y_pred_prob = rf.predict_proba(X_test_scaled)[:, 1]

# Basic metrics
acc       = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall    = recall_score(y_test, y_pred)
f1        = f1_score(y_test, y_pred)
roc_auc   = roc_auc_score(y_test, y_pred_prob)

print(f"Accuracy:  {acc:.4f}  ({acc*100:.2f}%)")
print(f"Precision: {precision:.4f}  (of predicted failures, how many real?)")
print(f"Recall:    {recall:.4f}  (of real failures, how many caught?)")
print(f"F1 Score:  {f1:.4f}  (harmonic mean of precision/recall)")
print(f"ROC-AUC:   {roc_auc:.4f}  (1.0 = perfect, 0.5 = random)")

# Full classification report
print("Full Classification Report:")
print(classification_report(y_test, y_pred,
      target_names=['No Failure', 'Failure']))

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)
print("Confusion Matrix:")
print(f"  True Neg  (correctly said OK):      {cm[0][0]}")
print(f"  False Pos (false alarm):             {cm[0][1]}")
print(f"  False Neg (missed failure ← BAD):   {cm[1][0]}")
print(f"  True Pos  (correctly caught failure): {cm[1][1]}")
# ── 7. Visualize results ─────────────────────────────────────

fig, axes = plt.subplots(1, 3, figsize=(18, 5))
fig.suptitle('FactoryPulse AI — Model Evaluation', fontsize=14, fontweight='bold')

# ── Plot 1: Confusion Matrix ──────────────────────────────────
sns.heatmap(
    confusion_matrix(y_test, y_pred),
    annot=True, fmt='d', cmap='Blues',
    xticklabels=['No Failure', 'Failure'],
    yticklabels=['No Failure', 'Failure'],
    ax=axes[0]
)
axes[0].set_title('Confusion Matrix')
axes[0].set_xlabel('Predicted')
axes[0].set_ylabel('Actual')

# ── Plot 2: ROC Curve ─────────────────────────────────────────
fpr, tpr, _ = roc_curve(y_test, y_pred_prob)
axes[1].plot(fpr, tpr, color='steelblue', lw=2,
             label=f'ROC (AUC = {roc_auc:.3f})')
axes[1].plot([0,1], [0,1], '--', color='gray', label='Random')
axes[1].set_xlabel('False Positive Rate')
axes[1].set_ylabel('True Positive Rate')
axes[1].set_title('ROC Curve')
axes[1].legend()

# ── Plot 3: Feature Importance ────────────────────────────────
importances = pd.Series(rf.feature_importances_, index=FEATURES)
importances.sort_values().plot(kind='barh', ax=axes[2], color='steelblue')
axes[2].set_title('Feature Importance')
axes[2].set_xlabel('Importance Score')

plt.tight_layout()
plt.savefig('models/evaluation_charts.png', dpi=150, bbox_inches='tight')
plt.show()
print("Charts saved to models/evaluation_charts.png")
# ── 8. Isolation Forest ──────────────────────────────────────

iso = IsolationForest(
    n_estimators=200,       # 200 isolation trees
    contamination=0.04,    # expect ~4% anomalies (slightly above 3.39%)
    max_samples='auto',    # use min(256, n_samples) per tree
    random_state=42,
    n_jobs=-1
)

# Train on ALL scaled data (unsupervised — no labels)
X_all_scaled = scaler.transform(X)
iso.fit(X_all_scaled)

# Predict: -1 = anomaly, +1 = normal
df['anomaly']       = iso.predict(X_all_scaled)
df['anomaly_score'] = iso.decision_function(X_all_scaled)

n_anomalies = (df['anomaly'] == -1).sum()
print(f"Anomalies detected: {n_anomalies} ({n_anomalies/len(df)*100:.1f}%)")

# How many detected anomalies are actual failures?
overlap = df[(df['anomaly'] == -1) & (df['Machine failure'] == 1)]
print(f"Anomalies that are real failures: {len(overlap)}")
print(f"That is {len(overlap)/df['Machine failure'].sum()*100:.1f}% of all failures")
# ── 9. Save all models ───────────────────────────────────────

os.makedirs('models', exist_ok=True)

joblib.dump(rf,     'models/failure_model.pkl')
joblib.dump(iso,    'models/iso_forest.pkl')
joblib.dump(scaler, 'models/scaler.pkl')
joblib.dump(le,     'models/label_encoder.pkl')

print("All models saved:")
for f in os.listdir('models'):
    size = os.path.getsize(f'models/{f}') / 1024
    print(f"  models/{f}  ({size:.0f} KB)")

# ── Print final summary ──────────────────────────────────────
print("" + "="*50)
print("FINAL MODEL SUMMARY")
print("="*50)
print(f"Dataset:        10,000 records, 339 failures")
print(f"Features used:  {len(FEATURES)}")
print(f"Accuracy:       {acc*100:.2f}%")
print(f"F1 Score:       {f1:.4f}")
print(f"ROC-AUC:        {roc_auc:.4f}")
print(f"Recall:         {recall:.4f}  ← catches this % of real failures")
print(f"Anomalies:      {n_anomalies} ({n_anomalies/len(df)*100:.1f}%)")
