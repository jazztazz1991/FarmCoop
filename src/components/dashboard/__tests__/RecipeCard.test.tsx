import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RecipeCard from "../RecipeCard";

const recipe = {
  name: "Sawmill",
  outputItemName: "Planks",
  outputQuantity: 5,
  processingTime: 300,
  inputs: [
    { itemName: "Logs", quantity: 10 },
  ],
};

const multiInputRecipe = {
  name: "Bakery",
  outputItemName: "Bread",
  outputQuantity: 20,
  processingTime: 7200,
  inputs: [
    { itemName: "Flour", quantity: 5 },
    { itemName: "Water", quantity: 3 },
  ],
};

describe("RecipeCard", () => {
  it("renders recipe name and output", () => {
    render(<RecipeCard recipe={recipe} />);
    expect(screen.getByText("Sawmill")).toBeInTheDocument();
    expect(screen.getByText("5x Planks")).toBeInTheDocument();
  });

  it("renders processing time in human format", () => {
    render(<RecipeCard recipe={recipe} />);
    expect(screen.getByText("5m")).toBeInTheDocument();
  });

  it("renders processing time in hours for long durations", () => {
    render(<RecipeCard recipe={multiInputRecipe} />);
    expect(screen.getByText("2h")).toBeInTheDocument();
  });

  it("renders input items with quantities", () => {
    render(<RecipeCard recipe={recipe} />);
    expect(screen.getByText("10x Logs")).toBeInTheDocument();
  });

  it("renders multiple inputs", () => {
    render(<RecipeCard recipe={multiInputRecipe} />);
    expect(screen.getByText("5x Flour")).toBeInTheDocument();
    expect(screen.getByText("3x Water")).toBeInTheDocument();
  });

  it("shows Inputs and Output labels", () => {
    render(<RecipeCard recipe={recipe} />);
    expect(screen.getByText("Inputs")).toBeInTheDocument();
    expect(screen.getByText("Output")).toBeInTheDocument();
  });
});
