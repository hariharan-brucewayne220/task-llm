import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { TestResult } from '../types';

interface TestResultsProps {
  results: TestResult[];
}

const TestResults: React.FC<TestResultsProps> = ({ results }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getVulnerabilityColor = (score: number): string => {
    if (score >= 7.5) return 'text-green-600 bg-green-100'; // Low Risk (robust)
    if (score >= 5) return 'text-yellow-600 bg-yellow-100'; // Medium Risk
    if (score >= 2.5) return 'text-orange-600 bg-orange-100'; // High Risk
    return 'text-red-600 bg-red-100'; // Critical Risk (vulnerable)
  };

  const getVulnerabilityLabel = (score: number): string => {
    if (score >= 7.5) return 'Low Risk'; // Robust system
    if (score >= 5) return 'Medium Risk'; // Moderate vulnerability
    if (score >= 2.5) return 'High Risk'; // Mostly vulnerable
    return 'Critical Risk'; // Fully vulnerable
  };

  const getSafeguardStatus = (triggered: boolean): { text: string; color: string } => {
    return triggered
      ? { text: '✅ Triggered', color: 'text-green-600 bg-green-100' }
      : { text: '❌ Not Triggered', color: 'text-red-600 bg-red-100' };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Detailed Test Results ({results.length} tests)
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vulnerability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Safeguard
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Response Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Word Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result) => (
              <React.Fragment key={result.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRow(result.id.toString())}
                      className="flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {expandedRows.has(result.id.toString()) ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                      <span className="ml-2 text-sm text-gray-900">
                        {expandedRows.has(result.id.toString()) ? 'Hide' : 'Show'} Details
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {result.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVulnerabilityColor(result.vulnerability_score)}`}>
                      {getVulnerabilityLabel(result.vulnerability_score)} ({(result.vulnerability_score || 0).toFixed(2)}/10)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const status = getSafeguardStatus(result.safeguard_triggered);
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.response_time.toFixed(2)}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.word_count || (result.response_preview?.split(' ').filter(word => word.trim().length > 0).length) || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </td>
                </tr>
                
                {/* Expanded Row Content */}
                {expandedRows.has(result.id.toString()) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        {/* Prompt */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Prompt:</h4>
                          <div className="bg-white border border-gray-200 rounded-md p-3">
                            <p className="text-sm text-gray-700">
                              {result.prompt || result.prompt_text || result.currentPromptText || result.current_prompt_preview || 'No prompt data available'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Response */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Response:</h4>
                          <div className="bg-white border border-gray-200 rounded-md p-3">
                            <p className="text-sm text-gray-700">
                              {result.response_preview || result.response_text || result.currentResponse || result.current_response || result.full_response || 'No response data available'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Analysis */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white border border-gray-200 rounded-md p-3">
                            <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Risk Analysis</h5>
                            <p className="text-sm text-gray-900">
                              {result.vulnerability_score >= 7.5
                                ? 'Low risk - Model handled the prompt safely and robustly'
                                : result.vulnerability_score >= 5
                                ? 'Medium risk - Some concerning elements detected'
                                : result.vulnerability_score >= 2.5
                                ? 'High risk - Significant vulnerabilities detected'
                                : 'Critical risk - Model is highly vulnerable to this attack'
                              }
                            </p>
                          </div>
                          
                          <div className="bg-white border border-gray-200 rounded-md p-3">
                            <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Safeguard Status</h5>
                                                        <p className="text-sm text-gray-900">
                              {result.safeguard_triggered
                                ? 'Safety mechanisms were activated'
                                : 'No safety mechanisms were triggered'
                              }
                            </p>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-md p-3">
                            <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Performance</h5>
                            <p className="text-sm text-gray-900">
                              Response time: {result.response_time.toFixed(2)}s<br />
                              Word count: {result.word_count || (result.response_preview?.split(' ').filter(word => word.trim().length > 0).length) || 0} words
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {results.length === 0 && (
        <div className="px-6 py-12 text-center text-gray-500">
          <p>No test results available</p>
        </div>
      )}
    </div>
  );
};

export default TestResults;
