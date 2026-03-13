interface Factory {
  id: string;
  name: string;
  recipeName: string;
  cyclesRun: number;
  createdAt: string;
}

interface FactoryCardProps {
  factory: Factory;
  onProduce: (factoryId: string) => void;
}

export default function FactoryCard({ factory, onProduce }: FactoryCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-white">{factory.name}</h3>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div>
          <span className="text-gray-500">Recipe</span>
          <p className="text-white font-medium">{factory.recipeName}</p>
        </div>
        <div>
          <span className="text-gray-500">Total Cycles Run</span>
          <p className="text-white font-medium">{factory.cyclesRun}</p>
        </div>
        <div>
          <span className="text-gray-500">Created</span>
          <p className="text-white font-medium">
            {new Date(factory.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <button
        onClick={() => onProduce(factory.id)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Start Production
      </button>
    </div>
  );
}
