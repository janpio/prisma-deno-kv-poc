import { Prisma, PrismaClient } from "../generated/client/deno/edge.ts";
import { load } from "https://deno.land/std@0.198.0/dotenv/mod.ts";

const envVars = await load();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: envVars.DATABASE_URL,
    },
  },
});

const xprisma = prisma.$extends({
  query: {
    $allOperations({ model, operation, args, query }) {
      //console.log(model, operation, args, query)
      return Promise.resolve({ id: 'foo' })
      //return query(args)
    },
  },
})

const dinosaurData: Prisma.DinosaurCreateInput[] = [
  {
    name: "Aardonyx",
    description: "An early stage in the evolution of sauropods.",
  },
  {
    name: "Abelisaurus",
    description: "Abel's lizard has been reconstructed from a single skull.",
  },
  {
    name: "Acanthopholis",
    description: "No, it's not a city in Greece.",
  },
];

/**
 * Seed the database.
 */

for (const u of dinosaurData) {
  const dinosaur = await xprisma.dinosaur.create({
    data: u,
  });
  console.log(`Created dinosaur with id: ${dinosaur.id}`);
}
console.log(`Seeding finished.`);

await xprisma.$disconnect();