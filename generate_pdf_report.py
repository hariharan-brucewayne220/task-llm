#!/usr/bin/env python3
"""
PDF Report Generator for Red Team Assessment
Converts assessment results to professional PDF report
"""

import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, red, orange, yellow, green
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus.figures import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
import base64

class PDFReportGenerator:
    """Generate professional PDF reports from assessment results."""
    
    def __init__(self, assessment_data: dict, output_filename: str = None):
        self.data = assessment_data
        self.filename = output_filename or f"Red_Team_Assessment_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        self.styles = getSampleStyleSheet()
        self._create_custom_styles()
    
    def _create_custom_styles(self):
        """Create custom paragraph styles."""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#2563eb'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=HexColor('#1f2937'),
            spaceBefore=20,
            spaceAfter=10
        ))
        
        self.styles.add(ParagraphStyle(
            name='MetricStyle',
            parent=self.styles['Normal'],
            fontSize=11,
            leftIndent=20,
            spaceAfter=8
        ))
        
        self.styles.add(ParagraphStyle(
            name='FindingStyle',
            parent=self.styles['Normal'],
            fontSize=10,
            leftIndent=15,
            spaceAfter=6,
            alignment=TA_JUSTIFY
        ))
    
    def generate_report(self):
        """Generate the complete PDF report."""
        doc = SimpleDocTemplate(
            self.filename,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Build story (content)
        story = []
        
        # Title page
        story.extend(self._create_title_page())
        story.append(PageBreak())
        
        # Executive summary
        story.extend(self._create_executive_summary())
        story.append(PageBreak())
        
        # Detailed metrics
        story.extend(self._create_metrics_section())
        story.append(PageBreak())
        
        # Findings
        story.extend(self._create_findings_section())
        story.append(PageBreak())
        
        # Technical details
        story.extend(self._create_technical_section())
        
        # Build PDF
        doc.build(story)
        return self.filename
    
    def _create_title_page(self):
        """Create the title page."""
        content = []
        
        # Main title
        content.append(Paragraph("LLM Red Team Assessment Report", self.styles['CustomTitle']))
        content.append(Spacer(1, 30))
        
        # Model information
        metadata = self.data['assessment_metadata']
        model_info = f"""
        <b>Target Model:</b> {metadata['provider'].title()} - {metadata['model']}<br/>
        <b>Assessment Date:</b> {datetime.fromisoformat(metadata['timestamp']).strftime('%B %d, %Y at %H:%M UTC')}<br/>
        <b>Categories Tested:</b> {', '.join(metadata['categories_tested']).title()}<br/>
        <b>Total Prompts:</b> {metadata['total_prompts']}<br/>
        <b>Methodology:</b> {metadata['methodology']}
        """
        content.append(Paragraph(model_info, self.styles['Normal']))
        content.append(Spacer(1, 40))
        
        # Key metrics preview
        executive = self.data['executive_summary']
        metrics_preview = f"""
        <b>Key Results:</b><br/><br/>
        • <b>Overall Vulnerability Score:</b> {executive['overall_vulnerability_score']}/10<br/>
        • <b>Safeguard Success Rate:</b> {executive['safeguard_success_rate']}%<br/>
        • <b>Critical Findings:</b> {executive['critical_findings']}<br/>
        • <b>High Risk Findings:</b> {executive['high_risk_findings']}<br/>
        • <b>Total Vulnerabilities:</b> {executive['total_vulnerabilities']}
        """
        content.append(Paragraph(metrics_preview, self.styles['Normal']))
        content.append(Spacer(1, 50))
        
        # Footer
        footer_text = """
        <i>This report was generated using the PromptFoo red teaming methodology.<br/>
        All testing was conducted in a controlled environment for security research purposes.</i>
        """
        content.append(Paragraph(footer_text, self.styles['Normal']))
        
        return content
    
    def _create_executive_summary(self):
        """Create executive summary section."""
        content = []
        
        content.append(Paragraph("Executive Summary", self.styles['SectionHeader']))
        
        executive = self.data['executive_summary']
        detailed = self.data['detailed_metrics']
        
        summary_text = f"""
        This red team assessment evaluated the {self.data['assessment_metadata']['provider']} 
        {self.data['assessment_metadata']['model']} model across {len(self.data['assessment_metadata']['categories_tested'])} 
        vulnerability categories using the PromptFoo methodology. The assessment included 
        {self.data['assessment_metadata']['total_prompts']} carefully crafted prompts designed to 
        test the model's security safeguards and identify potential vulnerabilities.
        
        <br/><br/>
        
        <b>Overall Assessment:</b> The model achieved an overall vulnerability score of 
        {executive['overall_vulnerability_score']}/10, with safeguards successfully blocking 
        {executive['safeguard_success_rate']}% of potentially harmful prompts. 
        {executive['critical_findings'] + executive['high_risk_findings']} high-risk vulnerabilities 
        were identified during testing.
        """
        
        content.append(Paragraph(summary_text, self.styles['Normal']))
        content.append(Spacer(1, 20))
        
        # Risk level summary table
        risk_data = [['Risk Level', 'Count', 'Percentage']]
        total_risks = sum(detailed['risk_distribution'].values())
        
        for level, count in detailed['risk_distribution'].items():
            percentage = (count / total_risks * 100) if total_risks > 0 else 0
            risk_data.append([level.title(), str(count), f"{percentage:.1f}%"])
        
        risk_table = Table(risk_data, colWidths=[2*inch, 1*inch, 1*inch])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), HexColor('#ffffff')),
            ('GRID', (0, 0), (-1, -1), 1, black)
        ]))
        
        content.append(Paragraph("<b>Risk Distribution:</b>", self.styles['Normal']))
        content.append(Spacer(1, 10))
        content.append(risk_table)
        
        return content
    
    def _create_metrics_section(self):
        """Create detailed metrics section."""
        content = []
        
        content.append(Paragraph("Detailed Metrics & Analysis", self.styles['SectionHeader']))
        
        detailed = self.data['detailed_metrics']
        
        # Core metrics
        metrics_text = f"""
        <b>Safeguard Success Rate:</b> {detailed['safeguard_success_rate']}%<br/>
        <b>Average Response Time:</b> {detailed['average_response_time']:.3f} seconds<br/>
        <b>Overall Vulnerability Score:</b> {detailed['overall_vulnerability_score']}/10<br/>
        """
        content.append(Paragraph(metrics_text, self.styles['MetricStyle']))
        content.append(Spacer(1, 20))
        
        # Category breakdown
        content.append(Paragraph("Category Performance Analysis", self.styles['Heading3']))
        
        if 'category_breakdown' in detailed:
            cat_data = [['Category', 'Tests', 'Safeguard Rate', 'Avg Vuln Score']]
            
            for category, metrics in detailed['category_breakdown'].items():
                cat_data.append([
                    category.title(),
                    str(metrics['total_tests']),
                    f"{metrics['safeguard_success_rate']:.1f}%",
                    f"{metrics['avg_vulnerability_score']:.1f}/10"
                ])
            
            cat_table = Table(cat_data, colWidths=[1.5*inch, 1*inch, 1.2*inch, 1.3*inch])
            cat_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), HexColor('#ffffff')),
                ('GRID', (0, 0), (-1, -1), 1, black)
            ]))
            
            content.append(Spacer(1, 10))
            content.append(cat_table)
        
        return content
    
    def _create_findings_section(self):
        """Create findings and recommendations section."""
        content = []
        
        content.append(Paragraph("Assessment Findings", self.styles['SectionHeader']))
        
        findings = self.data['assessment_findings']
        
        # Strengths
        content.append(Paragraph("Strengths", self.styles['Heading3']))
        for i, strength in enumerate(findings['strengths'], 1):
            content.append(Paragraph(f"{i}. {strength}", self.styles['FindingStyle']))
        
        content.append(Spacer(1, 15))
        
        # Weaknesses
        content.append(Paragraph("Weaknesses", self.styles['Heading3']))
        for i, weakness in enumerate(findings['weaknesses'], 1):
            content.append(Paragraph(f"{i}. {weakness}", self.styles['FindingStyle']))
        
        content.append(Spacer(1, 15))
        
        # Potential Flaws
        content.append(Paragraph("Potential Flaws", self.styles['Heading3']))
        for i, flaw in enumerate(findings['potential_flaws'], 1):
            content.append(Paragraph(f"{i}. {flaw}", self.styles['FindingStyle']))
        
        return content
    
    def _create_technical_section(self):
        """Create technical details section."""
        content = []
        
        content.append(Paragraph("Technical Details", self.styles['SectionHeader']))
        
        # Methodology
        methodology_text = f"""
        <b>Testing Methodology:</b><br/>
        This assessment employed the PromptFoo red teaming framework, a professional 
        methodology for systematically evaluating LLM security. The framework tests 
        across multiple vulnerability categories using carefully crafted adversarial 
        prompts designed to bypass safety mechanisms.
        
        <br/><br/>
        
        <b>Vulnerability Categories Tested:</b><br/>
        • <b>Jailbreak:</b> Attempts to bypass AI safety guidelines<br/>
        • <b>Bias:</b> Detection of social, cultural, or demographic biases<br/>
        • <b>Hallucination:</b> Generation of false or fabricated information<br/>
        • <b>Privacy:</b> Potential leakage of sensitive information<br/>
        • <b>Manipulation:</b> Generation of misleading or persuasive content
        
        <br/><br/>
        
        <b>Scoring Methodology:</b><br/>
        Vulnerability scores are calculated based on:<br/>
        • Whether safety safeguards were triggered<br/>
        • Content analysis of responses<br/>
        • Strategy complexity and difficulty<br/>
        • Category-specific risk factors<br/>
        
        Scores range from 0 (fully secure) to 10 (highly vulnerable).
        """
        
        content.append(Paragraph(methodology_text, self.styles['Normal']))
        content.append(Spacer(1, 20))
        
        # Sample high-risk results
        if 'raw_results' in self.data:
            high_risk_results = [r for r in self.data['raw_results'] 
                               if r['vulnerability_score'] > 7.0][:5]
            
            if high_risk_results:
                content.append(Paragraph("High-Risk Test Results Sample", self.styles['Heading3']))
                
                for i, result in enumerate(high_risk_results, 1):
                    result_text = f"""
                    <b>Test #{i}:</b><br/>
                    <b>Category:</b> {result['category'].title()}<br/>
                    <b>Vulnerability Score:</b> {result['vulnerability_score']}/10<br/>
                    <b>Risk Level:</b> {result['risk_level'].title()}<br/>
                    <b>Safeguard Triggered:</b> {'Yes' if result['safeguard_triggered'] else 'No'}<br/>
                    <b>Prompt:</b> {result['prompt_text'][:200]}{'...' if len(result['prompt_text']) > 200 else ''}
                    """
                    content.append(Paragraph(result_text, self.styles['FindingStyle']))
                    content.append(Spacer(1, 10))
        
        # Footer
        footer_text = f"""
        <br/><br/>
        <i>Report generated on {datetime.now().strftime('%B %d, %Y at %H:%M UTC')} using 
        the PromptFoo Red Teaming Framework. This assessment is for security research 
        and improvement purposes only.</i>
        """
        content.append(Paragraph(footer_text, self.styles['Normal']))
        
        return content

def generate_pdf_from_json(json_file: str, output_file: str = None):
    """Generate PDF report from JSON assessment results."""
    try:
        with open(json_file, 'r') as f:
            assessment_data = json.load(f)
        
        generator = PDFReportGenerator(assessment_data, output_file)
        filename = generator.generate_report()
        
        print(f"PDF report generated: {filename}")
        print(f"File size: {os.path.getsize(filename):,} bytes")
        
        return filename
        
    except FileNotFoundError:
        print(f"ERROR: JSON file not found: {json_file}")
        return None
    except Exception as e:
        print(f"ERROR: Error generating PDF: {str(e)}")
        return None

if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) > 1:
        json_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        generate_pdf_from_json(json_file, output_file)
    else:
        print("Usage: python generate_pdf_report.py <assessment_results.json> [output.pdf]")
        print("\nExample:")
        print("python generate_pdf_report.py assessment_results_20241219_143052.json")