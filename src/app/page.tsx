"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
         style={{
           backgroundImage: "url('/pokerback-ground.png')",
           backgroundSize: "cover",
           backgroundPosition: "center",
         }}>
      <div className="bg-black/70 p-8 rounded-xl text-white max-w-lg w-full">
        <h1 className="text-4xl font-bold text-center mb-8">ZK Poker Lobby</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800/80 p-4 rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Available Tables</h2>
            <div className="border border-gray-600 rounded p-3 mb-2 flex justify-between items-center">
              <div>
                <div className="font-medium">No Limit Holdem</div>
                <div className="text-gray-400 text-sm">Blinds: 100/200 - Players: 3/6</div>
              </div>
              <Link href="/poker-room" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                Join
              </Link>
            </div>
          </div>
          
          <div className="text-center">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
              onClick={() => console.log("Create new table clicked")}
            >
              Create New Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
