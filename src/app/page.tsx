import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold mb-4">FarmCoop</h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl">
          The modern platform for Farming Simulator 25 communities. Send money
          and equipment to in-game farms through the web — no server join
          required.
        </p>

        <div className="flex gap-4 mb-16">
          <Link
            href="/login"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Web-to-Game Bridge</h3>
            <p className="text-gray-400 text-sm">
              Send money and equipment directly to in-game farms through the
              website. Works with local and hosted servers.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Discord Login</h3>
            <p className="text-gray-400 text-sm">
              Sign in with your Discord account. Your community already lives
              there — we meet you where you are.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Wallet & Marketplace</h3>
            <p className="text-gray-400 text-sm">
              Virtual wallet for instant transfers. Buy and sell equipment on
              the marketplace between players.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
