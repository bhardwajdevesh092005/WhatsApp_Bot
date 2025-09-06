// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log the incoming request
  console.log(`${timestamp} - ${req.method} ${req.originalUrl} - IP: ${req.ip || req.connection.remoteAddress}`);
  
  // Log additional info for non-GET requests
  if (req.method !== 'GET') {
    console.log(`  Body size: ${JSON.stringify(req.body).length} bytes`);
    if (req.query && Object.keys(req.query).length > 0) {
      console.log(`  Query: ${JSON.stringify(req.query)}`);
    }
  }
  
  // Log the response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    
    console.log(`${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    
    // Log errors in more detail
    if (res.statusCode >= 400) {
      console.log(`  Error response for ${req.method} ${req.originalUrl}`);
    }
  });
  
  next();
};
