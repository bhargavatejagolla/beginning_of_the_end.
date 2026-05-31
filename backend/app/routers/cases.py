from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.case_manager import case_manager
from services.orchestrator import orchestrator
import io
from datetime import datetime

# Import reportlab components for PDF layout
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter(prefix="/cases", tags=["cases"])


class CaseCreate(BaseModel):
    account_id: str
    risk_score: float
    risk_level: str


class CaseUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


@router.post("/")
async def create_case(case: CaseCreate):
    case_id = await case_manager.create_case(case.account_id, case.risk_score, case.risk_level)
    return {"id": case_id}


@router.get("/")
async def list_cases():
    return await case_manager.get_cases()


@router.put("/{case_id}")
async def update_case(case_id: int, update: CaseUpdate):
    await case_manager.update_case(case_id, update.status, update.notes)
    return {"status": "updated"}


@router.get("/{account_id}/str")
async def export_str_pdf(account_id: int):
    try:
        # 1. Fetch complete investigation data from the orchestrator
        case_data = await orchestrator.investigate(account_id)
        
        # 2. Setup document template in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        
        styles = getSampleStyleSheet()
        
        # Custom premium styling
        title_style = ParagraphStyle(
            'STRTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1e3a8a'),
            spaceAfter=15,
            alignment=1 # Center
        )
        
        h2_style = ParagraphStyle(
            'STRH2',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=12,
            spaceAfter=8,
            borderPadding=4
        )
        
        body_style = ParagraphStyle(
            'STRBody',
            parent=styles['Normal'],
            fontSize=9.5,
            textColor=colors.HexColor('#334155'),
            leading=13,
            spaceAfter=6
        )

        meta_label_style = ParagraphStyle(
            'STRMetaLabel',
            parent=styles['Normal'],
            fontSize=9.5,
            textColor=colors.HexColor('#475569'),
            fontName='Helvetica-Bold'
        )

        alert_box_style = ParagraphStyle(
            'STRAlert',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#991b1b'),
            fontName='Helvetica-Bold',
            leading=14
        )

        elements = []
        
        # Header Banner
        header_data = [
            [Paragraph("<b>CYBERSHIELD INTELLIGENCE SYSTEM</b>", ParagraphStyle('H1', textColor=colors.white, fontSize=11, alignment=1))],
            [Paragraph("<b>SUSPICIOUS TRANSACTION REPORT (FIU-IND COMPLIANT)</b>", ParagraphStyle('H2', textColor=colors.white, fontSize=13, alignment=1))]
        ]
        header_table = Table(header_data, colWidths=[532])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1e3a8a')),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMMARGIN', (0,0), (-1,-1), 15),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 15))
        
        # Case Metadata Info Table
        meta_data = [
            [Paragraph("Report Timestamp:", meta_label_style), Paragraph(datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"), body_style),
             Paragraph("Regulatory Case ID:", meta_label_style), Paragraph(case_data["case_id"], body_style)],
            [Paragraph("Target Account ID:", meta_label_style), Paragraph(f"ACT-{case_data['account_id']}", body_style),
             Paragraph("Host Institution:", meta_label_style), Paragraph("Bank of India (BOI)", body_style)],
            [Paragraph("Ensemble Risk Score:", meta_label_style), Paragraph(f"<b>{case_data['risk_score']}%</b>", body_style),
             Paragraph("Severity Threshold:", meta_label_style), Paragraph(case_data['risk_level'], body_style)],
            [Paragraph("Fraud Pattern Type:", meta_label_style), Paragraph(case_data['fraud_type'], body_style),
             Paragraph("Classifier Confidence:", meta_label_style), Paragraph(f"{int(case_data['confidence']*100)}%", body_style)]
        ]
        meta_table = Table(meta_data, colWidths=[120, 146, 120, 146])
        meta_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
            ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#f8fafc')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 15))
        
        # Recommended Action Panel
        action_color = colors.HexColor('#fef2f2') if case_data['risk_score'] >= 70 else colors.HexColor('#f0fdf4')
        action_text = f"RECOMMENDED INCIDENT ACTION: {case_data['recommended_action']}"
        action_data = [[Paragraph(f"<font color='#991b1b'><b>{action_text}</b></font>", alert_box_style)]]
        action_table = Table(action_data, colWidths=[532])
        action_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), action_color),
            ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#f87171') if case_data['risk_score'] >= 70 else colors.HexColor('#4ade80')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        elements.append(action_table)
        elements.append(Spacer(1, 15))
        
        # Forensic Summary
        elements.append(Paragraph("<b>1. Neural Forensic Assessment Summary</b>", h2_style))
        elements.append(Paragraph(case_data["summary"], body_style))
        elements.append(Spacer(1, 10))
        
        # Victim Accounts and Linked Accounts
        elements.append(Paragraph("<b>2. Money Mule Graph Linkages & Network Victims</b>", h2_style))
        
        # Combine victims and linked accounts table
        link_headers = [
            Paragraph("<b>Identity</b>", meta_label_style),
            Paragraph("<b>Institution</b>", meta_label_style),
            Paragraph("<b>Assigned Balance / Amount</b>", meta_label_style),
            Paragraph("<b>Entity Class Type</b>", meta_label_style)
        ]
        
        link_rows = [link_headers]
        for v in case_data.get("victims", []):
            link_rows.append([
                Paragraph(f"ACT-{v['account_id']}", body_style),
                Paragraph(v['bank'], body_style),
                Paragraph(f"₹{v['amount']:,}", body_style),
                Paragraph("<b>VICTIM SOURCE (INFLOW)</b>", ParagraphStyle('VLabel', parent=body_style, textColor=colors.HexColor('#b91c1c')))
            ])
        for l in case_data.get("linked_accounts", []):
            link_rows.append([
                Paragraph(f"ACT-{l['account_id']}", body_style),
                Paragraph(l['bank'], body_style),
                Paragraph(f"₹{l['amount']:,}", body_style),
                Paragraph("CO-CONSPIRATOR MULE (OUTFLOW)", ParagraphStyle('LLabel', parent=body_style, textColor=colors.HexColor('#0369a1')))
            ])
            
        if len(link_rows) > 1:
            link_table = Table(link_rows, colWidths=[110, 130, 130, 162])
            link_table.setStyle(TableStyle([
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
                ('PADDING', (0,0), (-1,-1), 5),
            ]))
            elements.append(link_table)
        else:
            elements.append(Paragraph("No direct financial node linkages identified inside the 1-hop sub-graph.", body_style))
        elements.append(Spacer(1, 10))
        
        # Timeline Section
        elements.append(Paragraph("<b>3. Sequential Incident Audit Log (Timeline)</b>", h2_style))
        timeline_headers = [
            Paragraph("<b>Timestamp</b>", meta_label_style),
            Paragraph("<b>Forensic Event Description</b>", meta_label_style),
            Paragraph("<b>Node Category</b>", meta_label_style)
        ]
        timeline_rows = [timeline_headers]
        for item in case_data.get("timeline", []):
            timeline_rows.append([
                Paragraph(item["time"], body_style),
                Paragraph(item["description"], body_style),
                Paragraph(item["type"].upper(), body_style)
            ])
            
        timeline_table = Table(timeline_rows, colWidths=[100, 332, 100])
        timeline_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(timeline_table)
        
        # Build Document
        doc.build(elements)
        buffer.seek(0)
        
        # 3. Return streaming binary response
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=STR_CASE_{account_id}.pdf"}
        )
    except Exception as e:
        logger.error(f"STR PDF Generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"STR Generation error: {str(e)}")

