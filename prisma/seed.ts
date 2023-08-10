import { Prisma, PrismaClient } from "../generated/client/deno/edge.ts";
import { load } from "https://deno.land/std@0.198.0/dotenv/mod.ts";

const envVars = await load();

const kv = await Deno.openKv("test")

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: envVars.DATABASE_URL,
    },
  },
});

const xprisma = prisma.$extends({
  query: {
    async $allOperations({ model, operation, args, query }) {
      console.log(model, operation, args /*, query */)

      let result = null

      if (operation === 'create') {
        if (!args.data.id) {
          args.data.id = crypto.randomUUID()
        }

        const res = await kv.set(["dinosaurs", args.data.id], args.data)
        console.log(res)

        result = args.data
      } else if (operation === 'findMany') {
        const iter = kv.list<string>({ prefix: ["dinosaurs"] });
        result = [];
        for await (const res of iter) result.push(res);
        console.log({ result })
      }

      return Promise.resolve(result)
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

// current database state
const dinosaurs = await xprisma.dinosaur.findMany()
console.log({ dinosaurs })

for (const u of dinosaurData) {
  const dinosaur = await xprisma.dinosaur.create({
    data: u,
  });
  console.log(`Created dinosaur with id: ${dinosaur.id}`)
}
console.log(`Seeding finished.`);

const dinosaurs2 = await xprisma.dinosaur.findMany()
console.log({ dinosaurs2 })

await xprisma.$disconnect();
await kv.close();