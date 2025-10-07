import WalletSection from "./components/WalletSection";
import DashboardTabs from "./components/DashboardTabs";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
      <header className="w-full max-w-4xl text-center mb-10">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">PolkaGuardian</h1>
        <p className="mt-3 text-xl text-gray-600">One dashboard for everything on Polkadot</p>
      </header>

      <main className="flex flex-col items-center justify-center w-full max-w-4xl px-4">
        <WalletSection />
        <DashboardTabs />
      </main>

      <footer className="w-full max-w-4xl text-center mt-20 text-gray-500 text-sm">
        <p>&copy; 2024 PolkaGuardian. All rights reserved.</p>
      </footer>
    </div>
  );
}
