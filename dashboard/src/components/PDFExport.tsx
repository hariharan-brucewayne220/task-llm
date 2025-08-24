import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AssessmentMetrics, ModelComparisonData } from '../types';

interface PDFExportProps {
  metrics: AssessmentMetrics | null;
  modelComparisons: ModelComparisonData[];
  testResults: any[];
  assessmentStatus: 'idle' | 'running' | 'paused' | 'completed';
  assessmentId?: number;
  onExportStart: () => void;
  onExportComplete: () => void;
}

const PDFExport: React.FC<PDFExportProps> = ({
  metrics,
  modelComparisons,
  testResults,
  assessmentStatus,
  assessmentId,
  onExportStart,
  onExportComplete
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const capturePlotlyChart = async (chartId: string): Promise<string | null> => {
    try {
      // For Plotly charts, we need to find the div containing the chart
      const chartContainer = document.getElementById(chartId);
      if (!chartContainer) {
        console.warn(`Chart container with id '${chartId}' not found`);
        return null;
      }

      // Find the Plotly div inside the container
      const plotlyDiv = chartContainer.querySelector('.plotly-div, .js-plotly-plot') as HTMLElement;
      if (!plotlyDiv) {
        console.warn(`Plotly chart not found in container '${chartId}'`);
        return null;
      }
      
      // Capture the Plotly chart
      const canvas = await html2canvas(plotlyDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: plotlyDiv.offsetWidth,
        height: plotlyDiv.offsetHeight
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error(`Failed to capture chart ${chartId}:`, error);
      return null;
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    onExportStart();
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Title Page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LLM Red Team Assessment Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      if (metrics) {
        // Calculate total tests from category breakdown
        const totalTests = metrics.category_breakdown 
          ? Object.values(metrics.category_breakdown).reduce((sum, category: any) => sum + (category.total_tests || 0), 0)
          : metrics.total_tests || 0;
        
        const summary = [
          `Assessment Status: ${assessmentStatus || 'Unknown'}`,
          `Total Tests: ${totalTests}`,
          `Safeguard Success Rate: ${metrics.safeguard_success_rate || 0}%`,
          `Overall Vulnerability Score: ${metrics.overall_vulnerability_score || 0}/10`,
          `Average Response Time: ${metrics.average_response_time || 0}s`,
          `Average Response Length: ${metrics.average_response_length || 0} words`
        ];
        
        summary.forEach(line => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 7;
        });
      }
      
      // Advanced Metrics Section
      if (metrics?.advanced_metrics_available) {
        yPosition += 10;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Advanced Metrics Analysis', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const advancedMetrics = [
          `BLEU Score (Factual): ${metrics.bleu_score_factual || 'N/A'}`,
          `Sentiment Bias Score: ${metrics.sentiment_bias_score || 'N/A'}`,
          `Consistency Score: ${metrics.consistency_score || 'N/A'}`
        ];
        
        advancedMetrics.forEach(metric => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(metric, 20, yPosition);
          yPosition += 7;
        });
      }
      
      // Capture and include charts
      const chartImages = {
        metricsRadialChart: await capturePlotlyChart('metrics-chart-radial'),
        metricsBarChart: await capturePlotlyChart('metrics-chart-bar'),
        modelMultiMetricChart: await capturePlotlyChart('model-comparison-chart-multi-metric'),
        modelRiskDistributionChart: await capturePlotlyChart('model-comparison-chart-risk-distribution'),
        modelScatterChart: await capturePlotlyChart('model-comparison-chart-scatter')
      };

      // Metrics Chart Section
      if (metrics && (chartImages.metricsRadialChart || chartImages.metricsBarChart)) {
        pdf.addPage();
        yPosition = 20;
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Assessment Metrics Overview', 20, yPosition);
        yPosition += 15;
        
        // Add metrics chart image
        const imgWidth = pageWidth - 40;
        const imgHeight = (imgWidth * 3) / 4; // 4:3 aspect ratio
        
        const chartImage = chartImages.metricsRadialChart || chartImages.metricsBarChart;
        if (chartImage) {
          pdf.addImage(chartImage, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        }
      }

      // Model Comparison Charts Section
      if (modelComparisons.length > 0) {
        // Multi-Metric Comparison Chart
        if (chartImages.modelMultiMetricChart) {
          pdf.addPage();
          yPosition = 20;
          
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Multi-Metric Model Comparison', 20, yPosition);
          yPosition += 15;
          
          const imgWidth = pageWidth - 40;
          const imgHeight = (imgWidth * 3) / 4;
          
          pdf.addImage(chartImages.modelMultiMetricChart, 'PNG', 20, yPosition, imgWidth, imgHeight);
        }
        
        // Risk Distribution Chart
        if (chartImages.modelRiskDistributionChart) {
          pdf.addPage();
          yPosition = 20;
          
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Risk Distribution Analysis', 20, yPosition);
          yPosition += 15;
          
          const imgWidth = pageWidth - 40;
          const imgHeight = (imgWidth * 3) / 4;
          
          pdf.addImage(chartImages.modelRiskDistributionChart, 'PNG', 20, yPosition, imgWidth, imgHeight);
        }
        
        
        // Additional Risk Analysis
        if (chartImages.modelRiskDistributionChart) {
          pdf.addPage();
          yPosition = 20;
          
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Additional Risk Analysis', 20, yPosition);
          yPosition += 15;
          
          const imgWidth = pageWidth - 40;
          const imgHeight = (imgWidth * 3) / 4;
          
          pdf.addImage(chartImages.modelRiskDistributionChart, 'PNG', 20, yPosition, imgWidth, imgHeight);
        }
        
        // Multi-Metric Overview
        if (chartImages.modelMultiMetricChart) {
          pdf.addPage();
          yPosition = 20;
          
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Multi-Metric Overview', 20, yPosition);
          yPosition += 15;
          
          const imgWidth = pageWidth - 40;
          const imgHeight = imgWidth; // Square for radar chart
          
          pdf.addImage(chartImages.modelMultiMetricChart, 'PNG', 20, yPosition, imgWidth, imgHeight);
        }
        
        // Model Comparison Summary Table
        pdf.addPage();
        yPosition = 20;
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Model Comparison Summary', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        modelComparisons.forEach((model, index) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${model.model_name || model.model || 'Unknown'}`, 20, yPosition);
          yPosition += 7;
          
          pdf.setFont('helvetica', 'normal');
          const modelMetrics = [
            `  Safeguard Rate: ${(model.safeguard_success_rate || 0).toFixed(2)}%`,
            `  Vulnerability Score: ${(model.overall_vulnerability_score || 0).toFixed(2)}/10`,
            `  Response Time: ${(model.average_response_time || 0).toFixed(2)}s`,
            `  Response Length: ${(model.average_response_length || 0).toFixed(0)} words`
          ];
          
          modelMetrics.forEach(metric => {
            pdf.text(metric, 20, yPosition);
            yPosition += 6;
          });
          
          yPosition += 5;
        });
      }
      
      // Test Results Section
      if (testResults.length > 0) {
        yPosition += 10;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Detailed Test Results', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        
        testResults.slice(0, 20).forEach((result, index) => {
          // Check if we need a new page for this test result
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Test header
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.text(`Test ${index + 1}: ${result.category.charAt(0).toUpperCase() + result.category.slice(1)}`, 20, yPosition);
          yPosition += 8;
          
          // Test metrics
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          const resultDetails = [
            `Risk Level: ${result.risk_level.charAt(0).toUpperCase() + result.risk_level.slice(1)}`,
            `Vulnerability Score: ${(result.vulnerability_score || 0).toFixed(2)}/10`,
            `Safeguard Triggered: ${result.safeguard_triggered ? 'Yes' : 'No'}`,
            `Response Time: ${(result.response_time || 0).toFixed(2)}s`
          ];
          
          resultDetails.forEach(detail => {
            pdf.text(`• ${detail}`, 25, yPosition);
            yPosition += 4;
          });
          
          yPosition += 3;
          
          // Prompt section
          if (result.prompt) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Prompt:', 25, yPosition);
            yPosition += 4;
            
            pdf.setFont('helvetica', 'normal');
            const promptLines = pdf.splitTextToSize(result.prompt, pageWidth - 50);
            promptLines.forEach((line: string) => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(line, 30, yPosition);
              yPosition += 4;
            });
            yPosition += 3;
          }
          
          // Response section
          const responseText = result.response_preview || result.response || 'No response available';
          if (responseText && responseText !== 'No response available') {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Response:', 25, yPosition);
            yPosition += 4;
            
            pdf.setFont('helvetica', 'normal');
            const responseLines = pdf.splitTextToSize(responseText, pageWidth - 50);
            responseLines.forEach((line: string) => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(line, 30, yPosition);
              yPosition += 4;
            });
            yPosition += 5;
          }
          
          // Add separator line between tests
          if (index < testResults.slice(0, 20).length - 1) {
            pdf.setDrawColor(200, 200, 200);
            pdf.line(20, yPosition, pageWidth - 20, yPosition);
            yPosition += 8;
          }
        });
      }
      
      // Assessment Summary Section - Always on new page
      if (metrics) {
        pdf.addPage();
        yPosition = 20;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Assessment Summary', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const summary = [
          'Assessment completed successfully with comprehensive vulnerability analysis.',
          `Safeguard Success Rate: ${metrics.safeguard_success_rate}%`,
          `Overall Vulnerability Score: ${metrics.overall_vulnerability_score}/10`,
          `Risk Distribution: Low(${metrics.risk_distribution.low}), Medium(${metrics.risk_distribution.medium}), High(${metrics.risk_distribution.high}), Critical(${metrics.risk_distribution.critical})`
        ];
        
        summary.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 7;
        });
      }
      
      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text('LLM Red Team Assessment Platform', pageWidth / 2, pageHeight - 5, { align: 'center' });
      }
      
      // Save PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`llm_red_team_assessment_${timestamp}.pdf`);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      onExportComplete();
    }
  };

  const [isGeneratingComprehensive, setIsGeneratingComprehensive] = useState(false);
  
  const generateComprehensiveReport = async () => {
    setIsGeneratingComprehensive(true);
    
    try {
      // Get assessment ID from props or test results
      const currentAssessmentId = assessmentId || 
        (testResults.length > 0 ? testResults[0].assessment_id : null);
      
      if (!currentAssessmentId) {
        alert('No assessment data available for comprehensive report');
        return;
      }
      
      // Check if report can be generated
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const checkResponse = await fetch(`${apiUrl}/api/reports/comprehensive/${currentAssessmentId}/check`);
      const checkData = await checkResponse.json();
      
      if (!checkData.available) {
        alert(`Cannot generate report: ${checkData.reason}`);
        return;
      }
      
      // Generate and download the report
      const reportResponse = await fetch(`${apiUrl}/api/reports/comprehensive/${currentAssessmentId}`);
      
      if (reportResponse.ok) {
        const blob = await reportResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprehensive_assessment_report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await reportResponse.json();
        alert(`Failed to generate report: ${error.error}`);
      }
    } catch (error) {
      console.error('Comprehensive report generation failed:', error);
      alert('Failed to generate comprehensive report. Please try again.');
    } finally {
      setIsGeneratingComprehensive(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button
        onClick={generatePDF}
        className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={(!metrics && modelComparisons.length === 0) || isGenerating}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{isGenerating ? 'Generating PDF...' : 'Export Full Report (PDF)'}</span>
      </button>
      
      <button
        onClick={generateComprehensiveReport}
        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={(!metrics && modelComparisons.length === 0) || isGeneratingComprehensive || assessmentStatus !== 'completed'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{isGeneratingComprehensive ? 'Generating Report...' : 'Comprehensive Report'}</span>
      </button>
    </div>
  );
};

export default PDFExport;
