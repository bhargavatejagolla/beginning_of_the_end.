#!/usr/bin/env python
# coding: utf-8

# In[2]:


import pandas as pd

# Load dataset
df = pd.read_csv("DataSet.csv")

# Shape
print("Dataset Shape:", df.shape)

# Memory usage
memory_mb = df.memory_usage(deep=True).sum() / 1024**2
print(f"Memory Usage: {memory_mb:.2f} MB")

# First look
print(df.head())


# In[3]:


# Datatype summary
print(df.dtypes.value_counts())

# Object columns
object_cols = df.select_dtypes(include=['object']).columns

print("\nObject Columns:")
print(object_cols)

print("\nNumber of Object Columns:", len(object_cols))


# In[4]:


# Inspect object/string columns deeply

for col in object_cols:
    print(f"\n{'='*60}")
    print(f"Column: {col}")
    print(f"{'='*60}")

    print("\nUnique Values:")
    print(df[col].unique()[:20])  # first 20 unique values

    print("\nValue Counts:")
    print(df[col].value_counts(dropna=False).head(10))

    print("\nMissing Values:")
    print(df[col].isna().sum())


# In[5]:


# Missing value percentage per column

missing_percent = (df.isnull().sum() / len(df)) * 100

# Convert to dataframe
missing_df = pd.DataFrame({
    'Column': missing_percent.index,
    'MissingPercent': missing_percent.values
})

# Sort descending
missing_df = missing_df.sort_values(by='MissingPercent', ascending=False)

# Show top 20 most missing columns
print("\nTop 20 Columns with Highest Missing Values:\n")
print(missing_df.head(20))

# Count fully empty columns
full_empty_cols = missing_df[missing_df['MissingPercent'] == 100]

print(f"\nFully Empty Columns: {len(full_empty_cols)}")

# Columns with >90% missing
high_missing_cols = missing_df[missing_df['MissingPercent'] > 90]

print(f"Columns with >90% missing: {len(high_missing_cols)}")

# Columns with 0 missing
no_missing_cols = missing_df[missing_df['MissingPercent'] == 0]

print(f"Columns with NO missing values: {len(no_missing_cols)}")


# In[6]:


# Target distribution

target_counts = df['F3924'].value_counts()

print("Target Distribution:\n")
print(target_counts)

# Percentage distribution
target_percent = (target_counts / len(df)) * 100

print("\nTarget Percentage:\n")
print(target_percent)

# Fraud ratio
fraud_ratio = target_counts[1] / len(df)

print(f"\nFraud Ratio: {fraud_ratio:.4f}")


# In[9]:


# Detect binary-like columns
from IPython.core.interactiveshell import InteractiveShell
InteractiveShell.ast_node_interactivity = "all"
binary_cols = []

for col in df.columns:
    unique_vals = df[col].dropna().unique()

    # Check if only 0 and 1 exist
    if set(unique_vals).issubset({0, 1}):
        binary_cols.append(col)

print(f"Total Binary Columns: {len(binary_cols)}")

# Show first 30 binary columns
print("\nSample Binary Columns:")
print(binary_cols[:30])


# In[10]:


# Analyze activation rate of binary columns

binary_stats = []

for col in binary_cols:
    ones = (df[col] == 1).sum()
    zeros = (df[col] == 0).sum()

    binary_stats.append({
        'Column': col,
        'Ones': ones,
        'Zeros': zeros,
        'ActivationRate': ones / len(df)
    })

binary_stats_df = pd.DataFrame(binary_stats)

# Sort by lowest activation rate
binary_stats_df = binary_stats_df.sort_values(by='ActivationRate')

print("\nLowest Activation Binary Features:\n")
print(binary_stats_df.head(20))

print("\nHighest Activation Binary Features:\n")
print(binary_stats_df.tail(20))


# In[11]:


from sklearn.feature_selection import VarianceThreshold

# Separate target
X = df.drop(columns=['F3924'])

# Select only numeric columns
X_numeric = X.select_dtypes(include=['number'])

# Fill NaN temporarily ONLY for variance inspection
X_temp = X_numeric.fillna(-999)

# Variance calculation
variance = X_temp.var()

variance_df = pd.DataFrame({
    'Column': variance.index,
    'Variance': variance.values
})

# Sort ascending
variance_df = variance_df.sort_values(by='Variance')

print("Lowest Variance Features:\n")
print(variance_df.head(30))

# Near-constant features
near_constant = variance_df[variance_df['Variance'] < 0.0001]

print(f"\nNear-Constant Features Count: {len(near_constant)}")


# In[12]:


# Duplicate row analysis

duplicate_rows = df.duplicated().sum()

print(f"Total Duplicate Rows: {duplicate_rows}")

# Duplicate percentage
duplicate_percent = (duplicate_rows / len(df)) * 100

print(f"Duplicate Percentage: {duplicate_percent:.2f}%")


# In[13]:


# Statistical summary for numeric columns

numeric_cols = df.select_dtypes(include=['number']).columns

summary = df[numeric_cols].describe().T

# Add skewness
summary['skewness'] = df[numeric_cols].skew()

# Sort by highest skewness
summary_sorted = summary.sort_values(by='skewness', ascending=False)

print("Top Highly Skewed Features:\n")
print(summary_sorted[['mean', 'std', 'min',
        '50%', 'max', 'skewness']].head(20))


# In[14]:


official_features = [
    'F115', 'F321', 'F527', 'F531', 'F670',
    'F1692', 'F2082', 'F2122', 'F2582',
    'F2678', 'F2737', 'F2956', 'F3043',
    'F3836', 'F3887', 'F3889', 'F3891', 'F3894'
]

# Inspect official features
for col in official_features:
    print(f"\n{'='*70}")
    print(f"Feature: {col}")
    print(f"{'='*70}")

    print("\nDatatype:")
    print(df[col].dtype)

    print("\nMissing %:")
    print(round(df[col].isnull().mean() * 100, 2))

    print("\nUnique Values:")
    print(df[col].nunique())

    print("\nSample Values:")
    print(df[col].dropna().unique()[:10])


# In[15]:


# Backup original dataframe first
df_clean = df.copy()

# Find fully empty columns
full_empty_cols = df_clean.columns[df_clean.isnull().all()]

print(f"Fully Empty Columns: {len(full_empty_cols)}")

# Remove fully empty columns
df_clean = df_clean.drop(columns=full_empty_cols)

print("\nNew Shape After Removing Fully Empty Columns:")
print(df_clean.shape)


# In[16]:


# Remove useless index column

df_clean = df_clean.drop(columns=['Unnamed: 0'])

print("New Shape:")
print(df_clean.shape)


# In[17]:


# Convert F3888 to datetime

df_clean['F3888'] = pd.to_datetime(
    df_clean['F3888'],
    errors='coerce'
)

# Check conversion
print(df_clean['F3888'].head())

# Missing after conversion
print("\nMissing Dates:")
print(df_clean['F3888'].isnull().sum())


# In[18]:


# Create reference date (latest date in dataset)

reference_date = df_clean['F3888'].max()

print("Reference Date:", reference_date)

# Account age in days
df_clean['AccountAgeDays'] = (
    reference_date - df_clean['F3888']
).dt.days

# Account age in months
df_clean['AccountAgeMonths'] = (
    df_clean['AccountAgeDays'] / 30
)

# Quick check
print(
    df_clean[['F3888', 'AccountAgeDays', 'AccountAgeMonths']].head()
)


# In[19]:


from sklearn.preprocessing import LabelEncoder

# Categorical columns
categorical_cols = [
    'F2230',
    'F3886',
    'F3889',
    'F3890',
    'F3891',
    'F3892',
    'F3893'
]

# Store encoders
label_encoders = {}

# Encode categorical features
for col in categorical_cols:
    le = LabelEncoder()

    # Convert to string to safely handle NaN
    df_clean[col] = df_clean[col].astype(str)

    df_clean[col] = le.fit_transform(df_clean[col])

    label_encoders[col] = le

print("Categorical Encoding Complete.")

# Preview
print(df_clean[categorical_cols].head())


# In[20]:


# Separate target
target_col = 'F3924'

# Numeric columns
numeric_cols = df_clean.select_dtypes(include=['number']).columns.tolist()

# Remove target
numeric_cols.remove(target_col)

# Fill numeric missing values with median
# ONLY for moderate-missing features

for col in numeric_cols:
    missing_pct = df_clean[col].isnull().mean() * 100

    # Skip extremely sparse features (>70% missing)
    if missing_pct < 70:
        median_value = df_clean[col].median()
        df_clean[col] = df_clean[col].fillna(median_value)

print("Selective Numeric Imputation Complete.")


# In[21]:


# Remaining missing values check

remaining_missing = (
    df_clean.isnull().sum() / len(df_clean)
) * 100

remaining_missing = remaining_missing.sort_values(ascending=False)

print("Top Remaining Missing Columns:\n")

print(
    remaining_missing[remaining_missing > 0].head(20)
)

print("\nColumns Still Having Missing Values:")
print((remaining_missing > 0).sum())


# In[22]:


# Identify sparse binary-like columns

sparse_binary_cols = []

for col in df_clean.columns:

    # Skip target
    if col == 'F3924':
        continue

    unique_vals = df_clean[col].dropna().unique()

    # Binary columns
    if set(unique_vals).issubset({0, 1}):

        activation_rate = (df_clean[col] == 1).mean()

        # Sparse activation threshold
        if activation_rate < 0.05:
            sparse_binary_cols.append(col)

print("Sparse Binary Features:", len(sparse_binary_cols))

# Create aggregate fraud activation score
df_clean['SparseFraudSignalCount'] = (
    df_clean[sparse_binary_cols] == 1
).sum(axis=1)

# Quick inspection
print(
    df_clean[['SparseFraudSignalCount', 'F3924']].head()
)


# In[23]:


# Select numeric columns excluding target

numeric_features = df_clean.select_dtypes(include=['number']).columns.tolist()

exclude_cols = [
    'F3924',
    'AccountAgeDays',
    'AccountAgeMonths',
    'SparseFraudSignalCount'
]

numeric_features = [
    col for col in numeric_features
    if col not in exclude_cols
]

# Aggregate behavioral intensity features

df_clean['BehaviorMean'] = df_clean[numeric_features].mean(axis=1)

df_clean['BehaviorStd'] = df_clean[numeric_features].std(axis=1)

df_clean['BehaviorMax'] = df_clean[numeric_features].max(axis=1)

df_clean['BehaviorNonZeroCount'] = (
    df_clean[numeric_features] != 0
).sum(axis=1)

print("Behavioral Intensity Features Created.")

# Preview
print(
    df_clean[
        [
            'BehaviorMean',
            'BehaviorStd',
            'BehaviorMax',
            'BehaviorNonZeroCount',
            'F3924'
        ]
    ].head()
)


# In[24]:


# Composite fraud intelligence features

df_clean['RiskIntensityScore'] = (
    df_clean['SparseFraudSignalCount'] *
    df_clean['BehaviorStd']
)

df_clean['ActivityRiskScore'] = (
    df_clean['BehaviorNonZeroCount'] *
    df_clean['BehaviorMean']
)

# New account risk
df_clean['NewAccountRisk'] = (
    1 / (df_clean['AccountAgeDays'] + 1)
) * df_clean['SparseFraudSignalCount']

print("Composite Risk Features Created.")

# Preview
print(
    df_clean[
        [
            'RiskIntensityScore',
            'ActivityRiskScore',
            'NewAccountRisk',
            'F3924'
        ]
    ].head()
)


# In[25]:


# Engineered feature comparison

engineered_features = [
    'SparseFraudSignalCount',
    'BehaviorMean',
    'BehaviorStd',
    'BehaviorMax',
    'BehaviorNonZeroCount',
    'RiskIntensityScore',
    'ActivityRiskScore',
    'NewAccountRisk'
]

comparison = df_clean.groupby('F3924')[engineered_features].mean().T

comparison.columns = ['NormalAccounts', 'FraudAccounts']

comparison['Fraud_to_Normal_Ratio'] = (
    comparison['FraudAccounts'] /
    (comparison['NormalAccounts'] + 1e-6)
)

print("Fraud vs Normal Feature Comparison:\n")

print(comparison)


# In[26]:


# Stealth fraud intelligence features

df_clean['AnomalyDensity'] = (
    df_clean['SparseFraudSignalCount'] /
    (df_clean['BehaviorNonZeroCount'] + 1)
)

df_clean['RiskPerActivity'] = (
    df_clean['RiskIntensityScore'] /
    (df_clean['BehaviorMean'] + 1)
)

df_clean['SparseToBehaviorRatio'] = (
    df_clean['SparseFraudSignalCount'] /
    (df_clean['BehaviorStd'] + 1)
)

print("Stealth Fraud Features Created.")

# Preview
print(
    df_clean[
        [
            'AnomalyDensity',
            'RiskPerActivity',
            'SparseToBehaviorRatio',
            'F3924'
        ]
    ].head()
)


# In[28]:


# Correlation analysis on numeric features
import numpy as np
corr_sample = df_clean.select_dtypes(include=['number'])

# Remove target temporarily
corr_sample = corr_sample.drop(columns=['F3924'])

# Compute correlation matrix
corr_matrix = corr_sample.corr().abs()

# Upper triangle only
upper_triangle = corr_matrix.where(
    np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
)

# Find highly correlated features
high_corr_features = [
    column for column in upper_triangle.columns
    if any(upper_triangle[column] > 0.95)
]

print("Highly Correlated Features Count:")
print(len(high_corr_features))

print("\nSample Highly Correlated Features:")
print(high_corr_features[:30])


# In[30]:


from lightgbm import LGBMClassifier
from sklearn.model_selection import train_test_split

# Separate features and target

X = df_clean.drop(columns=['F3924', 'F3888'])  # remove raw datetime
y = df_clean['F3924']

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    stratify=y,
    random_state=42
)

# Lightweight baseline LightGBM
lgbm = LGBMClassifier(
    n_estimators=100,
    random_state=42,
    class_weight='balanced'
)

# Train
lgbm.fit(X_train, y_train)

print("LightGBM Training Complete.")


# In[31]:


# Feature Importance Extraction

importance_df = pd.DataFrame({
    'Feature': X_train.columns,
    'Importance': lgbm.feature_importances_
})

# Sort descending
importance_df = importance_df.sort_values(
    by='Importance',
    ascending=False
)

print("Top 30 Most Important Features:")
print(importance_df.head(30))


# In[32]:


# Keep only meaningful features

important_features = importance_df[
    importance_df['Importance'] > 0
]['Feature'].tolist()

# Always keep target
important_features.append('F3924')

# Create reduced dataframe
df_model = df_clean[important_features]

print("Original Shape:", df_clean.shape)
print("Reduced Shape:", df_model.shape)

print("\nFeatures Removed:")
print(df_clean.shape[1] - df_model.shape[1])


# In[34]:


from sklearn.model_selection import train_test_split

# Features and target

X = df_model.drop(columns=['F3924'])
y = df_model['F3924']

# Stratified split

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    stratify=y,
    random_state=42
)

print("Training Shape:", X_train.shape)
print("Testing Shape:", X_test.shape)

print("\nTraining Fraud Distribution:")
print(y_train.value_counts())

print("\nTesting Fraud Distribution:")
print(y_test.value_counts())


# In[36]:


# Create SMOTE-safe copies

X_train_smote_ready = X_train.copy()
X_test_smote_ready = X_test.copy()

# Fill remaining NaNs using median from training set

for col in X_train_smote_ready.columns:

    median_value = X_train_smote_ready[col].median()

    X_train_smote_ready[col] = (
        X_train_smote_ready[col]
        .fillna(median_value)
    )

    X_test_smote_ready[col] = (
        X_test_smote_ready[col]
        .fillna(median_value)
    )

print("Remaining NaNs in Train:")
print(X_train_smote_ready.isnull().sum().sum())

print("\nRemaining NaNs in Test:")
print(X_test_smote_ready.isnull().sum().sum())


# In[37]:


from imblearn.over_sampling import SMOTE

# Controlled SMOTE

smote = SMOTE(
    sampling_strategy=0.3,
    random_state=42,
    k_neighbors=3
)

X_train_smote, y_train_smote = smote.fit_resample(
    X_train_smote_ready,
    y_train
)

print("After SMOTE:")

print("\nFeature Shape:")
print(X_train_smote.shape)

print("\nClass Distribution:")
print(y_train_smote.value_counts())


# In[38]:


from lightgbm import LGBMClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score
)

# Final LightGBM model

lgbm_final = LGBMClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=8,
    num_leaves=31,
    class_weight='balanced',
    random_state=42
)

# Train
lgbm_final.fit(
    X_train_smote,
    y_train_smote
)

# Predict
y_pred = lgbm_final.predict(X_test_smote_ready)

# Probabilities
y_prob = lgbm_final.predict_proba(X_test_smote_ready)[:, 1]

print("Classification Report:\n")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:\n")
print(confusion_matrix(y_test, y_pred))

print("\nROC-AUC Score:")
print(roc_auc_score(y_test, y_prob))

print("\nPR-AUC Score:")
print(average_precision_score(y_test, y_prob))


# In[39]:


# Check suspiciously powerful features

top_features = importance_df.head(20)['Feature'].tolist()

print("Top Features Used By Model:\n")

for feature in top_features:
    print(feature)


# In[40]:


# Fraud distribution in important features

important_check = [
    'BehaviorStd',
    'BehaviorMax',
    'SparseToBehaviorRatio',
    'F3912',
    'F2230'
]

for col in important_check:

    print("\n" + "="*50)
    print(f"Feature: {col}")

    print("\nNormal Mean:")
    print(df_model[df_model['F3924'] == 0][col].mean())

    print("\nFraud Mean:")
    print(df_model[df_model['F3924'] == 1][col].mean())


# In[41]:


# Remove suspicious feature

X_train_no_leak = X_train_smote.drop(columns=['F3912'])
X_test_no_leak = X_test_smote_ready.drop(columns=['F3912'])

# Train new model

lgbm_no_leak = LGBMClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=8,
    num_leaves=31,
    class_weight='balanced',
    random_state=42
)

lgbm_no_leak.fit(
    X_train_no_leak,
    y_train_smote
)

# Predict

y_pred_no_leak = lgbm_no_leak.predict(X_test_no_leak)

y_prob_no_leak = (
    lgbm_no_leak.predict_proba(X_test_no_leak)[:, 1]
)

# Metrics

print(classification_report(y_test, y_pred_no_leak))

print("\nROC-AUC:")
print(roc_auc_score(y_test, y_prob_no_leak))

print("\nPR-AUC:")
print(average_precision_score(y_test, y_prob_no_leak))


# In[43]:


from xgboost import XGBClassifier
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    average_precision_score
)

# XGBoost model

xgb_model = XGBClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=8,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=3,
    random_state=42,
    eval_metric='logloss'
)

# Train
xgb_model.fit(
    X_train_no_leak,
    y_train_smote
)

# Predict
y_pred_xgb = xgb_model.predict(X_test_no_leak)

y_prob_xgb = (
    xgb_model.predict_proba(X_test_no_leak)[:, 1]
)

# Metrics
print(classification_report(y_test, y_pred_xgb))

print("\nROC-AUC:")
print(roc_auc_score(y_test, y_prob_xgb))

print("\nPR-AUC:")
print(average_precision_score(y_test, y_prob_xgb))


# In[50]:


from sklearn.ensemble import VotingClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score
)

# Ensemble Model

ensemble_model = VotingClassifier(

    estimators=[

        ('lgbm', lgbm_no_leak),

        ('xgb', xgb_model)

    ],

    voting='soft'

)

# Train Ensemble

ensemble_model.fit(

    X_train_no_leak,

    y_train_smote

)

# Predictions

y_pred_ensemble = ensemble_model.predict(

    X_test_no_leak

)

# Probabilities

y_prob_ensemble = (

    ensemble_model.predict_proba(

        X_test_no_leak

    )[:, 1]

)

# Results

print(classification_report(

    y_test,

    y_pred_ensemble

))

print("\nConfusion Matrix:")

print(confusion_matrix(

    y_test,

    y_pred_ensemble

))

print("\nROC-AUC:")

print(roc_auc_score(

    y_test,

    y_prob_ensemble

))

print("\nPR-AUC:")

print(average_precision_score(

    y_test,

    y_prob_ensemble

))


# In[51]:


# Fraud probability scores

fraud_scores = y_prob_ensemble

# Risk labeling function


def risk_label(score):

    if score >= 0.90:
        return "CRITICAL RISK"

    elif score >= 0.70:
        return "HIGH RISK"

    elif score >= 0.40:
        return "MEDIUM RISK"

    else:
        return "LOW RISK"

# Create prediction dataframe


results_df = X_test_no_leak.copy()

results_df['ActualLabel'] = y_test.values

results_df['FraudProbability'] = fraud_scores

results_df['RiskLevel'] = (
    results_df['FraudProbability']
    .apply(risk_label)
)

# Sort highest risk first

results_df = results_df.sort_values(
    by='FraudProbability',
    ascending=False
)

print("Top High-Risk Accounts:")

print(
    results_df[
        ['FraudProbability', 'RiskLevel', 'ActualLabel']
    ].head(20)
)


# In[52]:


import joblib

# Save ensemble model
joblib.dump(
    ensemble_model,
    "cybershield_ensemble_model.pkl"
)

# Save important feature list
joblib.dump(
    X_train_no_leak.columns.tolist(),
    "cybershield_features.pkl"
)

print("Model and feature list saved.")


# In[ ]:




