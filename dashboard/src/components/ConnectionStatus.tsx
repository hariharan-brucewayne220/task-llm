'use client';

import React from 'react';
import { ConnectionTest } from '../types';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionTest: ConnectionTest | null;
  onTestConnection?: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, connectionTest, onTestConnection }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WebSocket Connection */}
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div>
            <p className="font-medium text-gray-900">WebSocket</p>
            <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>

        {/* LLM API Connection */}
        <div className="flex items-center space-x-3">
          {connectionTest ? (
            <>
              <div className={`w-3 h-3 rounded-full ${
                connectionTest.status === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  LLM API {connectionTest.provider && `(${connectionTest.provider})`}
                </p>
                {connectionTest.status === 'success' ? (
                  <p className="text-sm text-green-600">
                    Connected • {connectionTest.model} • {connectionTest.response_time?.toFixed(2)}s
                  </p>
                ) : (
                  <p className="text-sm text-red-600">
                    {connectionTest.error || 'Connection failed'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">LLM API</p>
                <p className="text-sm text-gray-500">Not tested yet</p>
              </div>
              <button 
                onClick={onTestConnection}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Test
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;