import { PrismaClient } from "./generated/client/deno/edge.ts";
import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { load } from "https://deno.land/std@0.198.0/dotenv/mod.ts";

const envVars = await load();

/**
 * Initialize.
 */

const kv = await Deno.openKv("test")
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: envVars.DATABASE_URL,
    },
  },
}).$extends({
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

        console.log("created", args.data)
        result = args.data
      } else if (operation === 'findUnique') {
        const res = await kv.get(["dinosaurs", args.where.id])
        console.log(res)
        result = res.value
      } else if (operation === 'findMany') {
        const iter = kv.list<string>({ prefix: ["dinosaurs"] });
        result = [];
        for await (const res of iter) { console.log(res); result.push(res.value); }
        console.log({ result })
      } else if (operation === 'delete') {
        const res = await kv.delete(["dinosaurs", args.where.id])
        console.log(res)
        result = res
      } else {
        throw Error(`Operation ${operation} not supported`)
      }

      return Promise.resolve(result)
      //return query(args)
    },
  },
});
const app = new Application();
const router = new Router();

/**
 * Setup routes.
 */

router
  .get("/", (context) => {
    context.response.body = "Welcome to the Dinosaur API!";
  })
  .get("/dinosaur", async (context) => {
    // Get all dinosaurs.
    const dinosaurs = await prisma.dinosaur.findMany();
    context.response.body = dinosaurs;
  })
  .get("/dinosaur/:id", async (context) => {
    // Get one dinosaur by id.
    const { id } = context.params;
    const dinosaur = await prisma.dinosaur.findUnique({
      where: {
        id,
      },
    });
    context.response.body = dinosaur;
  })
  .post("/dinosaur", async (context) => {
    // Create a new dinosaur.
    const { name, description } = await context.request.body("json").value;
    const result = await prisma.dinosaur.create({
      data: {
        name,
        description,
      },
    });
    context.response.body = result;
  })
  .delete("/dinosaur/:id", async (context) => {
    // Delete a dinosaur by id.
    const { id } = context.params;
    const dinosaur = await prisma.dinosaur.delete({
      where: {
        id
      },
    });
    context.response.body = dinosaur;
  });

/**
 * Setup middleware.
 */

app.use(router.routes());
app.use(router.allowedMethods());

/**
 * Start server.
 */

await app.listen({ port: 8000 });