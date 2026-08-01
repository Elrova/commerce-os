export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: new URL("./server-only-test-stub.mjs", import.meta.url).href, shortCircuit: true };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (!specifier.startsWith(".") || specifier.endsWith(".ts")) throw error;
    return nextResolve(`${specifier}.ts`, context);
  }
}
