"""Export API endpoints."""
from flask import Blueprint, request, jsonify, send_file, make_response
from datetime import datetime
import json
import csv
import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.units import inch
from app.models import Assessment, TestResult
from app.services.metrics import MetricsService

bp = Blueprint('export', __name__)

@bp.route('/export/<int:assessment_id>/json', methods=['GET'])
def export_json(assessment_id):
    """Export assessment results as JSON."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        results = TestResult.query.filter_by(assessment_id=assessment_id).all()
        metrics = MetricsService.calculate_assessment_metrics(assessment)
        
        export_data = {
            'export_metadata': {
                'timestamp': datetime.utcnow().isoformat(),
                'assessment_id': assessment_id,
                'total_results': len(results)
            },
            'assessment': assessment.to_dict(),
            'metrics': metrics,
            'results': [r.to_dict() for r in results]
        }
        
        return jsonify(export_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/<int:assessment_id>/csv', methods=['GET'])
def export_csv(assessment_id):
    """Export assessment results as CSV."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        results = TestResult.query.filter_by(assessment_id=assessment_id).all()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Category', 'Prompt', 'Response Preview', 
            'Vulnerability Score', 'Risk Level', 'Safeguard Triggered',
            'Response Time', 'Word Count', 'Created At'
        ])
        
        # Write data rows
        for result in results:
            writer.writerow([
                result.id,
                result.category,
                result.prompt_text[:100] + '...' if len(result.prompt_text) > 100 else result.prompt_text,
                result.response_text[:100] + '...' if result.response_text and len(result.response_text) > 100 else result.response_text,
                result.vulnerability_score,
                result.risk_level,
                result.safeguard_triggered,
                result.response_time,
                result.word_count,
                result.created_at.isoformat() if result.created_at else ''
            ])
        
        # Create file response
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            attachment_filename=f'assessment_{assessment_id}_results.csv'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/<int:assessment_id>/report', methods=['GET'])
def export_report(assessment_id):
    """Export comprehensive assessment report."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        results = TestResult.query.filter_by(assessment_id=assessment_id).all()
        metrics = MetricsService.calculate_assessment_metrics(assessment)
        
        # Generate comprehensive report
        report = {
            'report_metadata': {
                'generated_at': datetime.utcnow().isoformat(),
                'assessment_id': assessment_id,
                'assessment_name': assessment.name,
                'total_tests': len(results)
            },
            'executive_summary': {
                'overall_score': assessment.overall_score,
                'safeguard_success_rate': assessment.safeguard_success_rate,
                'total_vulnerabilities': len([r for r in results if r.vulnerability_score > 6.0]),
                'high_risk_findings': len([r for r in results if r.risk_level == 'high']),
                'critical_findings': len([r for r in results if r.risk_level == 'critical'])
            },
            'detailed_metrics': metrics,
            'vulnerability_breakdown': MetricsService.get_vulnerability_breakdown(assessment_id),
            'category_analysis': MetricsService.get_category_analysis(assessment_id),
            'recommendations': MetricsService.generate_recommendations(assessment),
            'high_risk_results': [
                r.to_dict() for r in results 
                if r.vulnerability_score > 7.0
            ]
        }
        
        return jsonify(report)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/<int:assessment_id>/summary', methods=['GET'])
def export_summary(assessment_id):
    """Export assessment summary for integration with external systems."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        metrics = MetricsService.calculate_assessment_metrics(assessment)
        
        summary = {
            'assessment_id': assessment_id,
            'name': assessment.name,
            'status': assessment.status,
            'llm_provider': assessment.llm_provider,
            'model_name': assessment.model_name,
            'test_categories': assessment.test_categories,
            'started_at': assessment.started_at.isoformat() if assessment.started_at else None,
            'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
            'key_metrics': {
                'overall_vulnerability_score': assessment.overall_score,
                'safeguard_success_rate': assessment.safeguard_success_rate,
                'total_tests': assessment.total_prompts,
                'avg_response_time': assessment.avg_response_time
            },
            'risk_summary': metrics.get('risk_distribution', {}),
            'compliance_status': MetricsService.get_compliance_status(assessment)
        }
        
        return jsonify(summary)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/compare', methods=['POST'])
def export_comparison(assessment_ids):
    """Export comparison between multiple assessments."""
    try:
        data = request.get_json()
        assessment_ids = data.get('assessment_ids', [])
        
        if len(assessment_ids) < 2:
            return jsonify({
                'error': 'At least 2 assessments required for comparison'
            }), 400
        
        comparison = MetricsService.compare_assessments(assessment_ids)
        
        # Add export metadata
        comparison['export_metadata'] = {
            'generated_at': datetime.utcnow().isoformat(),
            'assessment_count': len(assessment_ids),
            'comparison_type': 'multi_assessment'
        }
        
        return jsonify(comparison)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/pdf', methods=['POST'])
def export_detailed_results_pdf():
    """Export detailed test results as PDF."""
    try:
        data = request.get_json()
        results = data.get('results', [])
        export_type = data.get('export_type', 'detailed_results')
        
        if not results:
            return jsonify({'error': 'No results provided'}), 400
        
        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        # Add title
        title = Paragraph(f"LLM Red Team Assessment - Detailed Test Results", title_style)
        elements.append(title)
        elements.append(Spacer(1, 12))
        
        # Add generation info
        info_style = styles['Normal']
        info = Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}<br/>Total Tests: {len(results)}", info_style)
        elements.append(info)
        elements.append(Spacer(1, 20))
        
        # Create table data
        table_data = [['#', 'Category', 'Risk Level', 'Vulnerability Score', 'Safeguards', 'Response Time', 'Word Count']]
        
        for i, result in enumerate(results, 1):
            risk_color = get_risk_color(result.get('vulnerability_score', 0))
            table_data.append([
                str(i),
                result.get('category', 'N/A'),
                result.get('risk_level', 'Unknown'),
                f"{result.get('vulnerability_score', 0):.2f}/10",
                'Yes' if result.get('safeguard_triggered', False) else 'No',
                f"{result.get('response_time', 0):.2f}s",
                str(result.get('word_count', 0))
            ])
        
        # Create table
        table = Table(table_data, colWidths=[0.5*inch, 1*inch, 1*inch, 1*inch, 0.8*inch, 0.8*inch, 0.8*inch])
        
        # Style the table
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(table)
        elements.append(PageBreak())
        
        # Add detailed breakdown for each result
        for i, result in enumerate(results, 1):
            elements.append(Paragraph(f"Test {i}: {result.get('category', 'Unknown')} Category", styles['Heading2']))
            elements.append(Spacer(1, 12))
            
            # Test details
            details = [
                f"<b>Risk Level:</b> {result.get('risk_level', 'Unknown')}",
                f"<b>Vulnerability Score:</b> {result.get('vulnerability_score', 0):.2f}/10",
                f"<b>Safeguards Triggered:</b> {'Yes' if result.get('safeguard_triggered', False) else 'No'}",
                f"<b>Response Time:</b> {result.get('response_time', 0):.2f} seconds",
                f"<b>Timestamp:</b> {result.get('timestamp', 'Unknown')}"
            ]
            
            for detail in details:
                elements.append(Paragraph(detail, styles['Normal']))
            elements.append(Spacer(1, 12))
            
            # Prompt
            elements.append(Paragraph("<b>Prompt:</b>", styles['Normal']))
            prompt_text = result.get('prompt', 'N/A')[:500] + ('...' if len(result.get('prompt', '')) > 500 else '')
            elements.append(Paragraph(prompt_text, styles['Normal']))
            elements.append(Spacer(1, 12))
            
            # Response
            elements.append(Paragraph("<b>Response:</b>", styles['Normal']))
            response_text = result.get('response', 'N/A')[:800] + ('...' if len(result.get('response', '')) > 800 else '')
            elements.append(Paragraph(response_text, styles['Normal']))
            
            if i < len(results):  # Don't add page break after last item
                elements.append(PageBreak())
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF data
        buffer.seek(0)
        pdf_data = buffer.getvalue()
        buffer.close()
        
        # Create response
        response = make_response(pdf_data)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=test-results-{datetime.utcnow().strftime("%Y%m%d")}.pdf'
        
        return response
        
    except Exception as e:
        import traceback
        print(f"PDF Export Error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500

def get_risk_color(score):
    """Get color based on vulnerability score."""
    if score >= 7.5:
        return colors.green
    elif score >= 5:
        return colors.yellow
    elif score >= 2.5:
        return colors.orange
    else:
        return colors.red