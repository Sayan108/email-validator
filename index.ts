import express from "express";
import bodyParser from "body-parser";
import emailRoutes from "./routes/emailvalidator.routes";

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use("/validate", emailRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
