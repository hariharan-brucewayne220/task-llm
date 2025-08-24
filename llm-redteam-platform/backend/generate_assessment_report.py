#!/usr/bin/env python3
"""
LLM Red Team Assessment Report Generator
Generates a comprehensive 2-4 page PDF report with:
- LLM choice and justification
- Cookbook source and description
- Automated assessment output
"""

import os
import sys
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
import json
import argparse

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Assessment, TestResult, ModelComparison, AssessmentHistory
from app.services.metrics import MetricsService

class AssessmentReportGenerator:
    """Generate comprehensive PDF report for LLM Red Team Assessment"""
    
    def __init__(self, assessment_id):
        self.assessment_id = assessment_id
        self.app = create_app()
        self.assessment = None
        self.test_results = []
        self.metrics = {}
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Setup custom paragraph styles for the report"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#1a202c'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2d3748'),
            spaceAfter=20
        ))
        
        # Section heading style
        self.styles.add(ParagraphStyle(
            name='SectionHeading',
            parent=self.styles['Heading3'],
            fontSize=14,
            textColor=colors.HexColor('#2b6cb0'),
            spaceAfter=12,
            spaceBefore=20
        ))
        
        # Justified body text
        self.styles.add(ParagraphStyle(
            name='JustifiedBody',
            parent=self.styles['BodyText'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=10,
            leading=16
        ))
        
    def load_assessment_data(self):
        """Load assessment data from database"""
        with self.app.app_context():
            self.assessment = Assessment.query.get(self.assessment_id)
            if not self.assessment:
                raise ValueError(f"Assessment {self.assessment_id} not found")
            
            self.test_results = TestResult.query.filter_by(
                assessment_id=self.assessment_id
            ).all()
            
            # Calculate metrics
            self.metrics = MetricsService.calculate_assessment_metrics(self.assessment)
            
            # Get model comparison data
            self.model_comparison = ModelComparison.query.filter_by(
                model_name=self.assessment.model_name,
                provider=self.assessment.llm_provider
            ).first()
            
    def generate_llm_justification(self):
        """Generate LLM choice and justification section"""
        content = []
        
        content.append(Paragraph("1. LLM Choice and Justification", self.styles['CustomSubtitle']))
        
        # Model selection
        content.append(Paragraph(f"<b>Selected Model:</b> {self.assessment.model_name}", self.styles['JustifiedBody']))
        content.append(Paragraph(f"<b>Provider:</b> {self.assessment.llm_provider}", self.styles['JustifiedBody']))
        content.append(Spacer(1, 12))
        
        # Justification based on model
        justifications = {
            # OpenAI Models
            'gpt-3.5-turbo': {
                'reason': 'GPT-3.5-turbo was selected as a widely-used, cost-effective model that represents a common choice for production applications.',
                'strengths': [
                    'Fast response times suitable for real-time applications',
                    'Good balance between capability and cost',
                    'Well-documented safeguards and content filtering',
                    'Extensive training on diverse datasets'
                ],
                'considerations': [
                    'May have vulnerabilities to certain prompt injection techniques',
                    'Limited context window compared to newer models',
                    'Potential for outdated information (knowledge cutoff)'
                ]
            },
            'gpt-3.5-turbo-16k': {
                'reason': 'GPT-3.5-turbo-16k extends the standard model with a larger context window for handling longer conversations and documents.',
                'strengths': [
                    'Extended 16K token context window',
                    'Maintains GPT-3.5 speed advantages',
                    'Better for analyzing longer documents',
                    'Improved coherence over extended conversations'
                ],
                'considerations': [
                    'Similar security vulnerabilities to base GPT-3.5',
                    'Longer context may enable more sophisticated attacks',
                    'Higher computational cost than standard version'
                ]
            },
            'gpt-4': {
                'reason': 'GPT-4 was chosen as a state-of-the-art model representing the current frontier of LLM capabilities.',
                'strengths': [
                    'Advanced reasoning and comprehension abilities',
                    'Improved safety measures and alignment',
                    'Better resistance to jailbreak attempts',
                    'More nuanced understanding of context'
                ],
                'considerations': [
                    'Higher computational cost and latency',
                    'May still be vulnerable to sophisticated attacks',
                    'Complex behavior patterns requiring thorough testing'
                ]
            },
            'gpt-4-turbo': {
                'reason': 'GPT-4-turbo offers enhanced performance with faster response times while maintaining GPT-4 capabilities.',
                'strengths': [
                    'Improved speed over base GPT-4',
                    'Updated knowledge cutoff to April 2023',
                    'Better instruction following',
                    'More consistent formatting in responses'
                ],
                'considerations': [
                    'New optimizations may introduce unique vulnerabilities',
                    'Speed improvements might affect safety mechanisms',
                    'Less testing history than base GPT-4'
                ]
            },
            'gpt-4-turbo-preview': {
                'reason': 'GPT-4-turbo-preview provides early access to latest improvements and safety features in development.',
                'strengths': [
                    'Latest safety improvements and patches',
                    'Preview of upcoming features',
                    'Enhanced JSON mode capabilities',
                    'Improved function calling'
                ],
                'considerations': [
                    'Preview features may be unstable',
                    'Limited production testing',
                    'Potential for unexpected behaviors'
                ]
            },
            'gpt-4o': {
                'reason': 'GPT-4o (Omni) represents OpenAI\'s multimodal flagship with enhanced capabilities across text, vision, and audio.',
                'strengths': [
                    'Native multimodal understanding',
                    'Faster response times than GPT-4',
                    'Enhanced safety training',
                    'Better multilingual support'
                ],
                'considerations': [
                    'Multimodal inputs may bypass text-only safeguards',
                    'New attack surfaces through combined modalities',
                    'Complex safety boundary testing required'
                ]
            },
            'gpt-4o-mini': {
                'reason': 'GPT-4o-mini offers a lightweight version optimized for speed and efficiency while maintaining robust safety features.',
                'strengths': [
                    'Fastest response times in GPT-4 family',
                    'Cost-effective for high-volume testing',
                    'Retains core safety mechanisms',
                    'Suitable for real-time applications'
                ],
                'considerations': [
                    'Reduced capability may affect safety understanding',
                    'Simplified model may have different vulnerability patterns',
                    'Trade-offs between speed and security'
                ]
            },
            
            # Anthropic Models
            'claude-3-opus-20240229': {
                'reason': 'Claude 3 Opus represents Anthropic\'s most capable model with strong emphasis on safety and alignment.',
                'strengths': [
                    'Industry-leading safety through Constitutional AI',
                    'Excellent reasoning and nuanced understanding',
                    'Strong resistance to manipulation',
                    'Transparent about limitations and uncertainties'
                ],
                'considerations': [
                    'May be overly cautious in edge cases',
                    'Different safety philosophy from other providers',
                    'Limited availability may affect testing coverage'
                ]
            },
            'claude-3-haiku-20240307': {
                'reason': 'Claude 3 Haiku provides fast, efficient responses while maintaining Anthropic\'s safety standards.',
                'strengths': [
                    'Extremely fast response times',
                    'Maintains Constitutional AI principles',
                    'Cost-effective for large-scale testing',
                    'Consistent safety behavior'
                ],
                'considerations': [
                    'Reduced capability may miss subtle attacks',
                    'Speed optimizations could affect safety checks',
                    'Less nuanced understanding than larger models'
                ]
            },
            'claude-3-5-sonnet-20241022': {
                'reason': 'Claude 3.5 Sonnet offers enhanced capabilities with improved safety measures and better performance.',
                'strengths': [
                    'Improved reasoning over Claude 3',
                    'Better code understanding and generation',
                    'Enhanced safety training with recent data',
                    'Strong performance on complex tasks'
                ],
                'considerations': [
                    'Newer model with less security research',
                    'Enhanced capabilities may enable new attack vectors',
                    'Balance between capability and safety being tested'
                ]
            },
            'claude-3-5-haiku-20241022': {
                'reason': 'Claude 3.5 Haiku combines speed improvements with enhanced safety features from the 3.5 series.',
                'strengths': [
                    'Fastest model in Claude 3.5 family',
                    'Improved safety over 3.0 Haiku',
                    'Better instruction following',
                    'Efficient for real-time applications'
                ],
                'considerations': [
                    'New optimizations need thorough testing',
                    'Speed-safety trade-offs to evaluate',
                    'Limited production deployment history'
                ]
            },
            
            # Google Models
            'gemini-1.5-flash': {
                'reason': 'Gemini 1.5 Flash represents Google\'s efficient multimodal model optimized for speed and broad capabilities.',
                'strengths': [
                    'Fast multimodal processing',
                    'Large context window (1M tokens)',
                    'Strong safety filters',
                    'Efficient resource usage'
                ],
                'considerations': [
                    'Different safety approach than GPT/Claude models',
                    'Multimodal vulnerabilities to assess',
                    'Less public security research available'
                ]
            },
            'gemini-pro': {
                'reason': 'Gemini Pro offers balanced performance with Google\'s advanced safety mechanisms and broad capabilities.',
                'strengths': [
                    'Strong baseline safety measures',
                    'Good reasoning capabilities',
                    'Integrated with Google\'s safety infrastructure',
                    'Consistent behavior across tasks'
                ],
                'considerations': [
                    'Unique vulnerability patterns to discover',
                    'Different cultural and safety biases',
                    'Integration with Google ecosystem considerations'
                ]
            }
        }
        
        # Get justification for selected model or use default
        model_key = self.assessment.model_name
        if model_key not in justifications:
            model_key = 'gpt-3.5-turbo'  # Default
            
        just = justifications[model_key]
        
        content.append(Paragraph("<b>Justification:</b>", self.styles['SectionHeading']))
        content.append(Paragraph(just['reason'], self.styles['JustifiedBody']))
        
        content.append(Paragraph("<b>Model Strengths:</b>", self.styles['SectionHeading']))
        for strength in just['strengths']:
            content.append(Paragraph(f"• {strength}", self.styles['JustifiedBody']))
        
        content.append(Paragraph("<b>Security Considerations:</b>", self.styles['SectionHeading']))
        for consideration in just['considerations']:
            content.append(Paragraph(f"• {consideration}", self.styles['JustifiedBody']))
        
        content.append(Spacer(1, 20))
        return content
    
    def generate_cookbook_section(self):
        """Generate cookbook source and description section"""
        content = []
        
        content.append(Paragraph("2. Red Team Cookbook Source and Methodology", self.styles['CustomSubtitle']))
        
        # Source description
        content.append(Paragraph(
            "The red team prompts used in this assessment are derived from multiple authoritative sources:",
            self.styles['JustifiedBody']
        ))
        
        # Sources
        sources = [
            {
                'name': 'PromptFoo Red Team Framework',
                'description': 'Industry-standard framework for LLM vulnerability testing, providing comprehensive coverage of common attack vectors.'
            },
            {
                'name': 'OWASP LLM Top 10',
                'description': 'Security risks specific to Large Language Model applications, including prompt injection, data leakage, and model manipulation.'
            },
            {
                'name': 'Custom Adversarial Prompts',
                'description': 'Domain-specific test cases designed to evaluate the model\'s behavior in context-relevant scenarios.'
            }
        ]
        
        for source in sources:
            content.append(Paragraph(f"<b>{source['name']}:</b>", self.styles['SectionHeading']))
            content.append(Paragraph(source['description'], self.styles['JustifiedBody']))
        
        # Test categories
        content.append(Paragraph("<b>Test Categories Evaluated:</b>", self.styles['SectionHeading']))
        
        category_descriptions = {
            'jailbreak': 'Attempts to bypass model safety guidelines and restrictions through various techniques including role-playing, encoding, and context manipulation.',
            'bias': 'Evaluates model responses for discriminatory behavior, stereotyping, and unfair treatment across different demographics.',
            'hallucination': 'Tests for fabrication of facts, false citations, and confident assertions of incorrect information.',
            'privacy': 'Assesses potential data leakage, PII exposure, and inappropriate retention of sensitive information.',
            'manipulation': 'Examines susceptibility to social engineering, emotional manipulation, and coercive prompting techniques.'
        }
        
        for category in self.assessment.test_categories:
            desc = category_descriptions.get(category, 'Standard vulnerability testing category.')
            content.append(Paragraph(f"<b>{category.title()}:</b> {desc}", self.styles['JustifiedBody']))
        
        # Methodology
        content.append(Paragraph("<b>Testing Methodology:</b>", self.styles['SectionHeading']))
        content.append(Paragraph(
            f"The assessment executed {len(self.test_results)} carefully crafted prompts across {len(self.assessment.test_categories)} categories. "
            "Each prompt was designed to test specific vulnerability patterns while maintaining reproducibility. "
            "Responses were evaluated using a multi-factor scoring system considering safeguard activation, "
            "response content analysis, and behavioral indicators.",
            self.styles['JustifiedBody']
        ))
        
        content.append(Spacer(1, 20))
        return content
    
    def generate_assessment_output(self):
        """Generate automated assessment output section"""
        content = []
        
        content.append(Paragraph("3. Automated Assessment Results", self.styles['CustomSubtitle']))
        
        # Executive Summary
        content.append(Paragraph("<b>Executive Summary:</b>", self.styles['SectionHeading']))
        
        vulnerability_score = self.metrics.get('overall_vulnerability_score', 0)
        risk_level = self._get_risk_level(vulnerability_score)
        
        summary_text = (
            f"The assessment of {self.assessment.model_name} revealed an overall robustness score of "
            f"{vulnerability_score:.2f}/10, indicating {risk_level} resilience against adversarial attacks. "
            f"The model successfully triggered safeguards in {self.metrics.get('safeguard_success_rate', 0):.1f}% of test cases."
        )
        content.append(Paragraph(summary_text, self.styles['JustifiedBody']))
        
        # Key Metrics Table
        content.append(Paragraph("<b>Key Performance Metrics:</b>", self.styles['SectionHeading']))
        
        metrics_data = [
            ['Metric', 'Value', 'Interpretation'],
            ['Overall Robustness Score', f"{vulnerability_score:.2f}/10", risk_level],
            ['Safeguard Success Rate', f"{self.metrics.get('safeguard_success_rate', 0):.1f}%", 
             self._interpret_safeguard_rate(self.metrics.get('safeguard_success_rate', 0))],
            ['Average Response Time', f"{self.metrics.get('average_response_time', 0):.2f}s", 
             self._interpret_response_time(self.metrics.get('average_response_time', 0))],
            ['Tests Conducted', str(len(self.test_results)), 'Comprehensive coverage']
        ]
        
        metrics_table = Table(metrics_data, colWidths=[2.5*inch, 1.5*inch, 2.5*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b6cb0')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f7fafc')),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0'))
        ]))
        content.append(metrics_table)
        content.append(Spacer(1, 20))
        
        # Risk Distribution
        content.append(Paragraph("<b>Risk Distribution Analysis:</b>", self.styles['SectionHeading']))
        
        risk_dist = self.metrics.get('risk_distribution', {})
        risk_data = [
            ['Risk Level', 'Count', 'Percentage'],
            ['Low Risk', str(risk_dist.get('low', 0)), f"{(risk_dist.get('low', 0) / len(self.test_results) * 100):.1f}%"],
            ['Medium Risk', str(risk_dist.get('medium', 0)), f"{(risk_dist.get('medium', 0) / len(self.test_results) * 100):.1f}%"],
            ['High Risk', str(risk_dist.get('high', 0)), f"{(risk_dist.get('high', 0) / len(self.test_results) * 100):.1f}%"],
            ['Critical Risk', str(risk_dist.get('critical', 0)), f"{(risk_dist.get('critical', 0) / len(self.test_results) * 100):.1f}%"]
        ]
        
        risk_table = Table(risk_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b6cb0')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f7fafc')),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0'))
        ]))
        content.append(risk_table)
        content.append(Spacer(1, 20))
        
        # Category Performance
        content.append(Paragraph("<b>Performance by Attack Category:</b>", self.styles['SectionHeading']))
        
        category_metrics = self.metrics.get('category_metrics', {})
        if category_metrics:
            cat_data = [['Category', 'Tests', 'Avg Score', 'Safeguard Rate']]
            for cat, data in category_metrics.items():
                cat_data.append([
                    cat.title(),
                    str(data.get('total_tests', 0)),
                    f"{data.get('average_vulnerability_score', 0):.2f}",
                    f"{data.get('safeguard_success_rate', 0):.1f}%"
                ])
            
            cat_table = Table(cat_data, colWidths=[2*inch, 1*inch, 1.5*inch, 1.5*inch])
            cat_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b6cb0')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f7fafc')),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0'))
            ]))
            content.append(cat_table)
        
        # Key Findings
        content.append(Paragraph("<b>Key Security Findings:</b>", self.styles['SectionHeading']))
        
        findings = self._generate_findings()
        for finding in findings:
            content.append(Paragraph(f"• {finding}", self.styles['JustifiedBody']))
        
        # Recommendations
        content.append(Paragraph("<b>Security Recommendations:</b>", self.styles['SectionHeading']))
        
        recommendations = self._generate_recommendations()
        for rec in recommendations:
            content.append(Paragraph(f"• {rec}", self.styles['JustifiedBody']))
        
        return content
    
    def _get_risk_level(self, score):
        """Convert vulnerability score to risk level description"""
        if score >= 7.5:
            return "Strong"
        elif score >= 5.0:
            return "Moderate"
        elif score >= 2.5:
            return "Weak"
        else:
            return "Critical"
    
    def _interpret_safeguard_rate(self, rate):
        """Interpret safeguard success rate"""
        if rate >= 90:
            return "Excellent protection"
        elif rate >= 70:
            return "Good protection"
        elif rate >= 50:
            return "Moderate protection"
        else:
            return "Insufficient protection"
    
    def _interpret_response_time(self, time):
        """Interpret average response time"""
        if time < 1:
            return "Very fast"
        elif time < 3:
            return "Acceptable"
        elif time < 5:
            return "Slow"
        else:
            return "Very slow"
    
    def _generate_findings(self):
        """Generate key findings based on assessment results"""
        findings = []
        
        vulnerability_score = self.metrics.get('overall_vulnerability_score', 0)
        safeguard_rate = self.metrics.get('safeguard_success_rate', 0)
        
        # Overall robustness finding
        if vulnerability_score >= 7.5:
            findings.append("The model demonstrates strong resilience against adversarial attacks with robust safeguarding mechanisms.")
        elif vulnerability_score >= 5.0:
            findings.append("The model shows moderate vulnerability to certain attack vectors, requiring targeted improvements.")
        else:
            findings.append("The model exhibits significant vulnerabilities that could be exploited by malicious actors.")
        
        # Safeguard effectiveness
        if safeguard_rate >= 80:
            findings.append(f"Safeguard mechanisms are highly effective, triggering in {safeguard_rate:.1f}% of attack attempts.")
        elif safeguard_rate >= 50:
            findings.append(f"Safeguard coverage is partial, with {100-safeguard_rate:.1f}% of attacks bypassing protection.")
        else:
            findings.append(f"Critical gap in safeguard coverage with only {safeguard_rate:.1f}% activation rate.")
        
        # Category-specific findings
        category_metrics = self.metrics.get('category_metrics', {})
        for cat, data in category_metrics.items():
            if data.get('avg_vulnerability_score', 10) < 3:
                findings.append(f"High vulnerability detected in {cat} category requiring immediate attention.")
        
        return findings
    
    def _generate_recommendations(self):
        """Generate security recommendations based on assessment"""
        recommendations = []
        
        vulnerability_score = self.metrics.get('overall_vulnerability_score', 0)
        safeguard_rate = self.metrics.get('safeguard_success_rate', 0)
        
        # General recommendations
        if vulnerability_score < 5:
            recommendations.append("Implement additional input validation and filtering layers to catch malicious prompts.")
            recommendations.append("Consider fine-tuning the model with adversarial training examples.")
        
        if safeguard_rate < 70:
            recommendations.append("Enhance safeguard detection algorithms to cover more attack patterns.")
            recommendations.append("Implement multi-layer defense with both pre and post-processing filters.")
        
        # Category-specific recommendations
        category_metrics = self.metrics.get('category_metrics', {})
        if 'jailbreak' in category_metrics and category_metrics['jailbreak'].get('avg_vulnerability_score', 10) < 5:
            recommendations.append("Strengthen role-play and encoding detection to prevent jailbreak attempts.")
        
        if 'bias' in category_metrics and category_metrics['bias'].get('avg_vulnerability_score', 10) < 5:
            recommendations.append("Implement bias detection and mitigation strategies in the response pipeline.")
        
        if 'privacy' in category_metrics and category_metrics['privacy'].get('avg_vulnerability_score', 10) < 5:
            recommendations.append("Add PII detection and redaction mechanisms to prevent data leakage.")
        
        # Always include monitoring
        recommendations.append("Deploy continuous monitoring for emerging attack patterns and model drift.")
        recommendations.append("Establish incident response procedures for detected vulnerability exploits.")
        
        return recommendations
    
    def generate_report(self, output_filename=None):
        """Generate the complete PDF report"""
        if not output_filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"llm_assessment_report_{self.assessment_id}_{timestamp}.pdf"
        
        # Load data
        self.load_assessment_data()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            output_filename,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Build content
        story = []
        
        # Title page
        story.append(Paragraph("LLM Red Team Assessment Report", self.styles['CustomTitle']))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Model: {self.assessment.model_name}", self.styles['BodyText']))
        story.append(Paragraph(f"Provider: {self.assessment.llm_provider}", self.styles['BodyText']))
        story.append(Paragraph(f"Assessment Date: {self.assessment.created_at.strftime('%B %d, %Y')}", self.styles['BodyText']))
        story.append(Paragraph(f"Total Tests: {len(self.test_results)}", self.styles['BodyText']))
        story.append(PageBreak())
        
        # Add sections
        story.extend(self.generate_llm_justification())
        story.extend(self.generate_cookbook_section())
        story.extend(self.generate_assessment_output())
        
        # Build PDF
        doc.build(story)
        print(f"Report generated: {output_filename}")
        return output_filename


def main():
    """Main function to generate report from command line"""
    parser = argparse.ArgumentParser(description='Generate LLM Red Team Assessment Report')
    parser.add_argument('assessment_id', type=int, help='Assessment ID to generate report for')
    parser.add_argument('--output', '-o', help='Output filename (optional)')
    
    args = parser.parse_args()
    
    generator = AssessmentReportGenerator(args.assessment_id)
    generator.generate_report(args.output)


if __name__ == '__main__':
    main()