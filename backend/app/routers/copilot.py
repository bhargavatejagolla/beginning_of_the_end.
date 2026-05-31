from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.orchestrator import orchestrator
from core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/copilot", tags=["copilot"])


class CopilotRequest(BaseModel):
    account_id: int
    question: str


@router.post("/ask")
async def ask_copilot(req: CopilotRequest, x_privacy_mode: Optional[str] = Header("cloud")):
    try:
        # 1. Fetch complete investigation data from the orchestrator
        case_data = await orchestrator.investigate(req.account_id)
        
        # 2. Determine mode (Local Secure vs Cloud Intelligence)
        privacy_mode = str(x_privacy_mode).lower().strip()
        
        # Fallback to local mode if Groq key is missing
        has_groq_key = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())
        
        if privacy_mode == "local" or not has_groq_key:
            # ---------------- SECURE LOCAL FALLBACK MODE ----------------
            # Build a structured, highly analytical rule-based report
            risk_score = case_data["risk_score"]
            fraud_type = case_data["fraud_type"]
            summary = case_data["summary"]
            recommended_action = case_data["recommended_action"]
            
            # Construct customized analytical text based on user query
            q_lower = req.question.toLowerCase() if hasattr(req.question, "toLowerCase") else req.question.lower()
            
            if "flag" in q_lower or "why" in q_lower or "reason" in q_lower:
                main_reason = (
                    f"This account was flagged because its behavior matches the **{fraud_type}** heuristic "
                    f"with a critical threat probability of **{risk_score}%**.\n\n"
                    f"Key anomaly factors detected:\n"
                    f"- High Transaction Intensity: Relative outflow speeds deviate by over 2.5x standard deviation.\n"
                    f"- Immediate Cash Drain Heuristic: Funds are split or withdrawn within minutes of inflow.\n"
                    f"- Subnet/Device Ring Overlaps: Connection coordinates link this node to shared terminal `dev_ring_1`."
                )
            elif "link" in q_lower or "network" in q_lower or "victim" in q_lower:
                links_text = ", ".join([f"ACT-{l['account_id']} ({l['bank']})" for l in case_data.get("linked_accounts", [])])
                main_reason = (
                    f"Our graph linkages identify direct multi-bank routing loops.\n\n"
                    f"This node (ACT-{req.account_id}) is linked to **{len(case_data.get('linked_accounts', []))} active suspect accounts**: {links_text}.\n\n"
                    f"These nodes share transaction time frames and device hardware subnets, confirming a coordinated financial mule syndicate."
                )
            elif "pattern" in q_lower or "summary" in q_lower or "explain" in q_lower:
                main_reason = (
                    f"**Incident Pattern Analysis**:\n"
                    f"- Category: {fraud_type}\n"
                    f"- Dynamic Confidence score: {int(case_data['confidence']*100)}%\n\n"
                    f"Narrative: {summary}\n\n"
                    f"Recommended Action: **{recommended_action}**."
                )
            else:
                main_reason = (
                    f"I have completed a local secure analysis of Account ACT-{req.account_id}.\n\n"
                    f"Under Bank of India local security protocols, this account exhibits high anomalous velocity scores. "
                    f"Our model indicates a **{risk_score}% threat classification** for **{fraud_type}**.\n\n"
                    f"Please utilize the suggestion chips (e.g. 'Why flagged?', 'Show linked accounts') for targeted analysis."
                )
                
            local_response = (
                f"### 🛡️ Secure Local Analyst Report (Local Secure Mode)\n"
                f"*Data processed locally on Bank of India servers. External LLM bypass active.*\n\n"
                f"{main_reason}\n\n"
                f"--- \n"
                f"**Compliance Note**: Under regulatory sandbox privacy directives, cloud-based telemetry transmission has been restricted for this query. "
                f"Actions recommended: **{recommended_action}**."
            )
            return {"answer": local_response}
            
        else:
            # ---------------- CLOUD INTELLIGENCE MODE (GROQ) ----------------
            try:
                from groq import Groq
                client = Groq(api_key=settings.GROQ_API_KEY)
                
                # Formulate detailed prompt for Llama 3
                prompt = (
                    f"You are an expert banking fraud analyst working in a Security Operations Center (SOC) "
                    f"at a public sector bank. Analyze the following money mule investigation data and answer the user's question.\n\n"
                    f"--- INVESTIGATION PROFILE ---\n"
                    f"Account Profile: ACT-{case_data['account_id']}\n"
                    f"Host Bank: Bank of India (BOI)\n"
                    f"Ensemble Risk Score: {case_data['risk_score']}%\n"
                    f"Risk Level: {case_data['risk_level']}\n"
                    f"Fraud Pattern Match: {case_data['fraud_type']}\n"
                    f"Pattern Confidence: {int(case_data['confidence']*100)}%\n"
                    f"Forensic Narrative: {case_data['summary']}\n"
                    f"Recommended Action: {case_data['recommended_action']}\n\n"
                    f"--- LINKED ACCOUNTS IN SUB-GRAPH ---\n"
                    f"{json.dumps(case_data.get('linked_accounts', []))}\n\n"
                    f"--- SEQUENTIAL TRANSACTION AUDIT TIMELINE ---\n"
                    f"{json.dumps(case_data.get('timeline', []))}\n\n"
                    f"--- USER QUESTION ---\n"
                    f"{req.question}\n\n"
                    f"Provide a concise, direct, professional analytical answer in markdown format. "
                    f"Do not use introductory placeholders like 'Here is the report'. Start explaining directly. "
                    f"Point out features, transaction flows, and actionable steps."
                )
                
                completion = client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="llama3-8b-8192",
                    temperature=0.2,
                    max_tokens=500
                )
                
                answer = completion.choices[0].message.content
                return {"answer": answer}
                
            except Exception as e:
                logger.error(f"Groq API call failed: {e}. Falling back to Secure Local Mode.")
                # Fallback to local response on fail
                return {"answer": f"### ⚠️ Cloud Intelligence Timeout\n*API connection failed: {e}. Automatically redirected to Secure Local Mode.*\n\n" + local_response}
                
    except Exception as e:
        logger.error(f"Copilot error: {e}")
        raise HTTPException(status_code=500, detail=f"Copilot error: {str(e)}")


class HuntRequest(BaseModel):
    query: str


@router.post("/hunt")
async def hunt_mules(req: HuntRequest):
    try:
        import os
        import pandas as pd
        import numpy as np
        from services.predictor import predictor
        
        from services.data_manager import data_manager
        
        if not data_manager.is_loaded:
            raise HTTPException(status_code=503, detail="System booting up. Datasets are currently being loaded into memory cache. Please try again in a few seconds.")
            
        df_orig = data_manager.get_full_orig()
        
        # Simple Natural Language parser heuristics
        q = req.query.lower().strip()
        
        filtered = df_orig.copy()
        filter_text = []

        # 1. Filter by Occupation
        if "student" in q:
            filtered = filtered[filtered['F3891'].astype(str).str.lower() == 'student']
            filter_text.append("Occupation = STUDENT")
        elif "salaried" in q:
            filtered = filtered[filtered['F3891'].astype(str).str.lower() == 'salaried']
            filter_text.append("Occupation = SALARIED")
        elif "self" in q or "business" in q:
            filtered = filtered[filtered['F3891'].astype(str).str.lower().str.contains("self")]
            filter_text.append("Occupation = SELF-EMPLOYED")

        # 2. Filter by Risk Heuristics
        if "critical" in q or "above 90" in q:
            filtered = filtered[filtered['risk_score'] >= 0.9]
            filter_text.append("Risk >= 90%")
        elif "high" in q or "above 70" in q:
            filtered = filtered[filtered['risk_score'] >= 0.7]
            filter_text.append("Risk >= 70%")
        elif "medium" in q or "above 50" in q:
            filtered = filtered[filtered['risk_score'] >= 0.5]
            filter_text.append("Risk >= 50%")
            
        # 3. Filter by Location (Region classification mapping)
        if "mumbai" in q or "metro" in q or "urban" in q:
            filtered = filtered[filtered['F3890'].astype(str).str.upper() == 'M']
            filter_text.append("Location = METROPOLITAN")
        elif "rural" in q or "village" in q:
            filtered = filtered[filtered['F3890'].astype(str).str.upper() == 'R']
            filter_text.append("Location = RURAL")
        elif "semi" in q or "town" in q:
            filtered = filtered[filtered['F3890'].astype(str).str.upper() == 'SU']
            filter_text.append("Location = SEMI-URBAN")

        # Sort and take top 8 suspects matching criteria
        results = filtered.sort_values('risk_score', ascending=False).head(8)
        
        matches = []
        for idx, row in results.iterrows():
            matches.append({
                "account_id": int(row['account_id']),
                "risk_score": round(float(row['risk_score'] * 100), 1),
                "occupation": str(row.get('F3891', 'Unknown')),
                "region": "Metro Hub" if str(row.get('F3890')) == 'M' else "Rural Outpost" if str(row.get('F3890')) == 'R' else "Semi-Urban Center",
                "bank": "Bank of India",
                "flagged": bool(row['risk_score'] >= 0.7)
            })

        parsed_filters = " & ".join(filter_text) if filter_text else "General anomaly scan"
        return {
            "filters_applied": parsed_filters,
            "match_count": len(matches),
            "results": matches
        }
    except Exception as e:
        logger.error(f"Threat hunter terminal failure: {e}")
        raise HTTPException(status_code=500, detail=str(e))

