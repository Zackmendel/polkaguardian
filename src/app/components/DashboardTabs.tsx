"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState('wallet');
  const [monitoringData, setMonitoringData] = useState<any | null>(null);
  const [daoData, setDaoData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonitoringData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/monitoring');
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setMonitoringData(data);
      } catch (err: any) {
        console.error("Failed to fetch monitoring data:", err);
        setError(`Failed to load monitoring data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const fetchDaoData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/dao');
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 404 && errorData.error === "Democracy pallet not available on this chain.") {
            setError("DAO data not available on the connected chain.");
            return;
          }
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setDaoData(data);
      } catch (err: any) {
        console.error("Failed to fetch DAO data:", err);
        setError(`Failed to load DAO data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'monitoring' && !monitoringData) {
      fetchMonitoringData();
    } else if (activeTab === 'dao-insights' && !daoData) {
      fetchDaoData();
    }
  }, [activeTab, monitoringData, daoData]);

  const renderTabContent = () => {
    if (loading) {
      return <div className="p-6 bg-white rounded-b-lg shadow-md">Loading...</div>;
    }

    if (error) {
      return <div className="p-6 bg-white rounded-b-lg shadow-md text-red-600">Error: {error}</div>;
    }

    switch (activeTab) {
      case 'wallet':
        return (
          <div className="p-6 bg-white rounded-b-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Wallet Overview</h3>
            <p className="text-gray-700">[Placeholder for aggregated token balances, staking rewards, and governance participation. This data will be fetched by `WalletSection.tsx`.]</p>
          </div>
        );
      case 'monitoring':
        return (
          <div className="p-6 bg-white rounded-b-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Network & Validator Monitoring</h3>
            {monitoringData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <p><strong>Chain:</strong> {monitoringData.chain}</p>
                <p><strong>Node Name:</strong> {monitoringData.nodeName}</p>
                <p><strong>Node Version:</strong> {monitoringData.nodeVersion}</p>
                <p><strong>Connected Peers:</strong> {monitoringData.peers}</p>
                <p><strong>Validator Uptime:</strong> {monitoringData.validatorUptime}</p>
                <p><strong>Parachain Performance:</strong> {monitoringData.parachainPerformance}</p>
                <p><strong>XCM Transfers:</strong> {monitoringData.xcmTransfers}</p>
              </div>
            ) : (
              <p className="text-gray-700">No monitoring data available.</p>
            )}
          </div>
        );
      case 'dao-insights':
        return (
          <div className="p-6 bg-white rounded-b-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">DAO Proposals & Insights</h3>
            {daoData ? (
              <div>
                <p className="text-gray-700"><strong>Referendum Count:</strong> {daoData.referendumCount}</p>
                <h4 className="text-lg font-medium mt-4 mb-2">Proposals:</h4>
                {daoData.proposals.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-700">
                    {daoData.proposals.map((proposal: any) => (
                      <li key={proposal.index}>
                        <strong>Index:</strong> {proposal.index}, <strong>Proposer:</strong> {proposal.proposer}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">No active proposals.</p>
                )}
              </div>
            ) : (
              <p className="text-gray-700">No DAO insights data available.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full mt-10">
      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 text-lg font-medium ${activeTab === 'wallet' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => setActiveTab('wallet')}
        >
          Wallet
        </button>
        <button
          className={`py-3 px-6 text-lg font-medium ${activeTab === 'monitoring' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => setActiveTab('monitoring')}
        >
          Monitoring
        </button>
        <button
          className={`py-3 px-6 text-lg font-medium ${activeTab === 'dao-insights' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => setActiveTab('dao-insights')}
        >
          DAO Insights
        </button>
      </div>
      {renderTabContent()}
    </div>
  );
}
