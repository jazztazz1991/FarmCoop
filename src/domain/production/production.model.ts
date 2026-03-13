export interface RecipeDTO {
  id: string;
  name: string;
  outputItemId: string;
  outputItemName: string;
  outputQuantity: number;
  processingTime: number; // seconds
  inputs: RecipeInputDTO[];
}

export interface RecipeInputDTO {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface FactoryDTO {
  id: string;
  gameServerId: string;
  ownerId: string;
  recipeId: string;
  recipeName: string;
  name: string;
  cyclesRun: number;
  createdAt: string;
}

export interface ProductionOrderDTO {
  id: string;
  factoryId: string;
  cycles: number;
  status: string;
  startedAt: string | null;
  completesAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CreateFactoryInput {
  gameServerId: string;
  recipeId: string;
  name: string;
}

export interface StartProductionInput {
  cycles: number; // 1-10
}
