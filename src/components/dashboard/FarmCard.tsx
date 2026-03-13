interface FarmCardProps {
  farm: {
    id: string;
    name: string;
    farmSlot: number;
    serverName: string;
  };
}

export default function FarmCard({ farm }: FarmCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white">{farm.name}</h4>
        <span className="text-xs text-gray-500">Slot {farm.farmSlot}</span>
      </div>
      <p className="text-xs text-gray-400">{farm.serverName}</p>
    </div>
  );
}
