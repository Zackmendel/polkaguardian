"use client";

import { useState, useEffect } from "react";
// Dynamically import @polkadot/extension-dapp and @polkadot/api with ssr: false
import dynamic from "next/dynamic";

const PolkadotExtension = dynamic(() => import("@polkadot/extension-dapp"), { ssr: false });
const PolkadotApi = dynamic(() => import("@polkadot/api"), { ssr: false });

export default function WalletSection() {
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<any | null>(null);
  const [api, setApi] = useState<any | null>(null); // Changed to any for dynamic import type compatibility
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState<any | null>(null); // New state for wallet data

  useEffect(() => {
    const setupApi = async () => {
      if (PolkadotApi && PolkadotApi.ApiPromise && PolkadotApi.WsProvider) {
        const { ApiPromise, WsProvider } = PolkadotApi as any; // Cast to any to access properties
        const provider = new WsProvider("wss://rpc.polkadot.io"); // Or your preferred Polkadot RPC
        const api = await ApiPromise.create({ provider });
        setApi(api);
      }
    };
    setupApi();
  }, []);

  const validateAddress = (addr: string) => {
    if (!addr) {
      return "Please enter an address.";
    }
    // A more robust validation would use @polkadot/util-crypto's checkAddress
    if (!/^([5]|[1-9A-HJ-NP-Za-km-z]){47}$/.test(addr) && !/^([5]|[1-9A-HJ-NP-Za-km-z]){48}$/.test(addr)) {
      return "Please enter a valid Polkadot address (47 or 48 characters, starting with 5 or a base58 encoded address).";
    }
    return null;
  };

  const fetchWalletData = async (targetAddress: string) => {
    setLoading(true);
    setWalletData(null); // Clear previous data
    try {
      const response = await fetch(`/api?address=${targetAddress}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setWalletData(data);
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
      setAddressError("Failed to fetch wallet data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = () => {
    const error = validateAddress(address);
    if (error) {
      setAddressError(error);
      return;
    }
    setAddressError(null);
    fetchWalletData(address);
  };

  const connectPolkadotExtension = async () => {
    setLoading(true);
    try {
      if (PolkadotExtension && PolkadotExtension.web3Enable && PolkadotExtension.web3Accounts) {
        const { web3Enable, web3Accounts } = PolkadotExtension as any; // Cast to any
        const extensions = await web3Enable("PolkaGuardian");
        if (extensions.length === 0) {
          alert("No Polkadot.js extension found. Please install it.");
          setLoading(false);
          return;
        }

        const accounts = await web3Accounts();
        if (accounts.length === 0) {
          alert("No accounts found in Polkadot.js extension. Please create one.");
          setLoading(false);
          return;
        }
        // For simplicity, select the first account. In a real app, provide a selection.
        setConnectedAccount(accounts[0]);
        setAddress(accounts[0].address); // Update the address input with the connected account
        alert(`Connected with Polkadot.js Extension: ${accounts[0].address}`);
        fetchWalletData(accounts[0].address); // Fetch data for the connected account
      } else {
        alert("Polkadot.js extension library not loaded yet. Please try again.");
      }
    } catch (error) {
      console.error("Error connecting Polkadot.js extension:", error);
      alert("Error connecting Polkadot.js extension.");
    } finally {
      setLoading(false);
    }
  };

  // Basic WalletConnect placeholder - requires a more comprehensive setup for v2
  const connectWalletConnect = () => {
    alert("WalletConnect integration is pending. Please note WalletConnect v1 is deprecated. We will implement v2 in future phases.");
    // Actual WalletConnect v2 integration would go here.
    // This typically involves generating a QR code and handling connection events.
  };

  return (
    <div className="p-4 bg-gray-100 rounded-2xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Connect Wallet or View Analytics</h2>
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl transition duration-300 ease-in-out disabled:opacity-50"
          onClick={connectWalletConnect}
          disabled={loading}
        >
          Connect via WalletConnect
        </button>
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-xl transition duration-300 ease-in-out disabled:opacity-50"
          onClick={connectPolkadotExtension}
          disabled={loading}
        >
          Connect via Polkadot.js Extension
        </button>
      </div>
      {connectedAccount && (
        <p className="text-green-600 mt-4">Connected: {connectedAccount.address} ({connectedAccount.meta.name})</p>
      )}
      <div className="mt-6 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
        <input
          type="text"
          placeholder="Or enter Polkadot address (e.g., 5GrwvaEF5zXb26FzE for testing)"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setAddressError(null); // Clear error on change
          }}
          className="flex-grow border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 ease-in-out text-gray-800"
          disabled={loading} // Disable input while connecting
        />
        <button
          onClick={handleAddressSubmit}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl transition duration-300 ease-in-out disabled:opacity-50"
          disabled={loading}
        >
          View Analytics
        </button>
      </div>
      {addressError && (
        <p className="text-red-500 text-sm mt-2">{addressError}</p>
      )}
      {walletData && (
        <div className="mt-6 bg-white p-4 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Wallet Analytics for {walletData.address}</h3>
          <p>Free Balance: {walletData.free}</p>
          <p>Reserved Balance: {walletData.reserved}</p>
          <p>Misc Frozen: {walletData.miscFrozen}</p>
          <p>Fee Frozen: {walletData.feeFrozen}</p>
          {/* Add more wallet data display here as needed */}
        </div>
      )}
    </div>
  );
}
