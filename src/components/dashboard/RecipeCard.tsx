interface RecipeInput {
  itemName: string;
  quantity: number;
}

interface Recipe {
  name: string;
  outputItemName: string;
  outputQuantity: number;
  processingTime: number;
  inputs: RecipeInput[];
}

interface RecipeCardProps {
  recipe: Recipe;
}

function formatProcessingTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{recipe.name}</h3>

      <div className="space-y-3">
        {/* Inputs */}
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Inputs
          </span>
          <ul className="mt-1 space-y-1">
            {recipe.inputs.map((input) => (
              <li key={input.itemName} className="text-sm text-gray-300">
                {input.quantity}x {input.itemName}
              </li>
            ))}
          </ul>
        </div>

        {/* Arrow separator */}
        <div className="flex items-center gap-2 text-gray-600">
          <div className="flex-1 border-t border-gray-800" />
          <span className="text-lg">&#8595;</span>
          <div className="flex-1 border-t border-gray-800" />
        </div>

        {/* Output */}
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Output
          </span>
          <p className="mt-1 text-sm text-emerald-400 font-medium">
            {recipe.outputQuantity}x {recipe.outputItemName}
          </p>
        </div>

        {/* Processing time */}
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Processing Time
          </span>
          <p className="mt-1 text-sm text-white">
            {formatProcessingTime(recipe.processingTime)}
          </p>
        </div>
      </div>
    </div>
  );
}
