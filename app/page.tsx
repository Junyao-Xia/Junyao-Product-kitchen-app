import { AppHeader } from "@/components/AppHeader";
import { KitchenApp } from "@/components/KitchenApp";
import seedDinners from "@/data/dinners.json";
import seedIngredients from "@/data/ingredients.json";
import type { Dinner, SeedIngredient } from "@/lib/types";

export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-8 md:px-8 md:py-10">
        <KitchenApp
          seedIngredients={seedIngredients as SeedIngredient[]}
          dinners={seedDinners as Dinner[]}
        />
      </main>
    </>
  );
}
