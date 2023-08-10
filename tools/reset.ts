const kv = await Deno.openKv("test");

export async function resetKv() {
  const iter = kv.list({ prefix: [] });
  const promises = [];
  for await (const res of iter) {
    console.log("deleting", res.key)
    promises.push(kv.delete(res.key));
  }
  await Promise.all(promises);
}

if (import.meta.main) {
  if (
    !confirm(
      "This script deletes all data from the Deno KV database. Are you sure you'd like to continue?",
    )
  ) {
    close();
  }
  await resetKv();
  await kv.close();
}