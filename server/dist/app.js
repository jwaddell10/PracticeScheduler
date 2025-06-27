"use strict";
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// var indexRouter = require("./routes/index");
// var userRouter = require("./routes/user");
const practiceRouter = require("./routes/practice");
// const postRouter = require("./routes/post")
// const profileRouter = require("./routes/profile")
// const commentRouter = require("./routes/comment")
// import { apiRoutes } from './routes/api'
// import { errorHandler } from './middleware/errorHandler'
// Load environment variables
dotenv.config();
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Request logging middleware
// app.use((req: Request, res: Response, next: Function) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
//   next()
// })
// Basic routes
// app.get('/', (req: Request, res: Response) => {
//   res.json()
// })
// app.use("/")
// app.use("/user", userRouter);
app.use("/practice", practiceRouter);
// API routes
// app.use('/api', apiRoutes)
// Error handling middleware
// app.use(errorHandler)
// 404 handler
// app.use('*', (req: Request, res: Response) => {
//   res.status(404).json({ 
//     error: 'Route not found',
//     path: req.originalUrl,
//     method: req.method
//   })
// })
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Visit: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
module.exports = app;
