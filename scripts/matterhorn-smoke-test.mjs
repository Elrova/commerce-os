const apiKey = process.env.MATTERHORN_API_KEY;
if (!apiKey) {
  console.error("MATTERHORN_API_KEY est absente. Aucun appel n’a été effectué.");
  process.exitCode = 1;
} else {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch("https://matterhorn-wholesale.com/B2BAPI/ITEMS/?page=1&limit=1", {
      headers: { accept: "application/json", Authorization: apiKey, "user-agent": "ELROVA-Commerce-OS/1.0" },
      signal: controller.signal,
    });
    console.log(response.ok ? "Connexion Matterhorn réussie." : `Connexion Matterhorn refusée (HTTP ${response.status}).`);
    if (!response.ok) process.exitCode = 1;
  } catch {
    console.error("Matterhorn est indisponible ou le délai a été dépassé.");
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
  }
}
