import "dotenv/config";
import app from "./src/app.js";

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`backend-contact running on http://localhost:${port}`);
});
