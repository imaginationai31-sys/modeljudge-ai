const { createBuyerKey } = require("../backend/buyer-api");

(async () => {
  const [, , buyerId, name] = process.argv;
  if (!buyerId) {
    console.error("Usage: node scripts/create-buyer-key.js <buyer-id> [name]");
    process.exit(1);
  }
  const key = await createBuyerKey({ buyerId, name });
  console.log(JSON.stringify(key, null, 2));
  console.log("Store the api_key securely. It cannot be recovered later.");
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
