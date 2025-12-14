import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import seedRoutes from "./testUtils/routes/seedRoutes.js";
import cors from "cors";
import { createAndConnectTestDB } from "./config/testDb.js";
import { seedData } from "./testUtils/seed/seed.js";
import client from "prom-client";

// configure env
dotenv.config();

//database config
if (["test-frontend-integration", "test-ui"].includes(process.env.NODE_ENV)) {
    createAndConnectTestDB();
} else if (process.env.NODE_ENV !== "test-backend-integration") {
    connectDB();
}
if (process.env.NODE_ENV === 'test-ui') {
    seedData();
}

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ⭐ PROMETHEUS METRICS SETUP (MUST COME BEFORE ROUTES)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ------------------------------------------------------
// 1) COUNTER
// ------------------------------------------------------
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"]
});
register.registerMetric(httpRequestCounter);

// Example Counter for product views
const productViewCounter = new client.Counter({
  name: "product_views_total",
  help: "Total product views by category",
  labelNames: ["category"]
});
register.registerMetric(productViewCounter);

// ------------------------------------------------------
// 2) GAUGE
// ------------------------------------------------------
// Gauge can go UP and DOWN
const activeUsersGauge = new client.Gauge({
  name: "active_users",
  help: "Number of currently active users"
});
register.registerMetric(activeUsersGauge);

// ------------------------------------------------------
// 3) HISTOGRAM
// ------------------------------------------------------
// Histogram is used for latency buckets
const requestDurationHistogram = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Request latency distribution",
  labelNames: ["method", "route"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5]
});
register.registerMetric(requestDurationHistogram);

// ------------------------------------------------------
// 4) SUMMARY
// ------------------------------------------------------
// Summary calculates quantiles (like percentiles)
const requestDurationSummary = new client.Summary({
  name: "http_request_duration_quantiles_seconds",
  help: "Request duration summary (quantiles)",
  labelNames: ["method", "route"],
  percentiles: [0.5, 0.9, 0.99] // median, p90, p99
});
register.registerMetric(requestDurationSummary);


// Logic to handle the metrics for each request
// ⭐ GLOBAL METRICS MIDDLEWARE — MUST COME BEFORE ROUTES
app.use((req, res, next) => {
  const endHistogram = requestDurationHistogram.startTimer();
  const endSummary = requestDurationSummary.startTimer();

  res.on("finish", () => {
    // 1) Count every HTTP request
    httpRequestCounter
      .labels(req.method, req.originalUrl, res.statusCode)
      .inc();

    // 2) Observe request duration
    endHistogram({ method: req.method, route: req.originalUrl });
    endSummary({ method: req.method, route: req.originalUrl });
  });

  next();
});

// ⭐ MAKE METRICS AVAILABLE IN ROUTES
app.locals.productViewCounter = productViewCounter;
app.locals.activeUsersGauge = activeUsersGauge;

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/payment", paymentRoutes);

if (process.env.NODE_ENV === "test-frontend-integration") {
    app.use("/api/v1/seed", seedRoutes);
}

// rest api
app.get('/', (req, res) => {
    res.send("<h1>Welcome to ecommerce app</h1>");
});

// ⭐ /metrics endpoint
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

// Start server
const PORT = process.env.PORT || 6060;
if (process.env.NODE_ENV !== "test-backend-integration") {
    app.listen(PORT, () => {
        console.log(`Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white);
    });
}

export default app;