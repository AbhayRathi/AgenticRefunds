# Delivery Shield - Setup Guide

This guide will help you set up and run the Delivery Shield x402 refund system.

## Quick Start (Using Mock Server)

The fastest way to test the system without external dependencies:

### 1. Install Dependencies

```bash
npm install
```

### 2. Build All Packages

```bash
npm run build
```

### 3. Start Mock Backend

```bash
cd packages/backend
npm run dev:mock
```

The mock server will start on `http://localhost:3001` and provides all API endpoints without requiring MongoDB, Gemini API, or CDP credentials.

### 4. Start Frontend (in a new terminal)

```bash
cd packages/frontend
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### 5. Test the System

1. Open `http://localhost:3000` in your browser
2. Toggle "Simulate Delivery Issues" ON to test late delivery refunds
3. Click "Request Refund via x402" to process a refund
4. Toggle OFF to test normal deliveries (no refund)
5. Watch the statistics update in real-time

## Full Setup (Production Features)

To use the complete system with MongoDB Atlas, Gemini AI, and CDP:

### 1. MongoDB Atlas Setup

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create a database named `delivery_shield`
4. Create a collection named `refund_policies`
5. Create a Vector Search index:
   - Index name: `vector_index`
   - Definition:
   ```json
   {
     "fields": [{
       "type": "vector",
       "path": "embedding",
       "numDimensions": 768,
       "similarity": "cosine"
     }]
   }
   ```

### 2. Google Gemini API Setup

1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the API key

### 3. Coinbase Developer Platform Setup

1. Sign up at https://portal.cdp.coinbase.com/
2. Create a new API key
3. Save the API Key Name and Private Key
4. (Optional) Create a wallet on Base Sepolia testnet
5. Note the Wallet ID

### 4. Configure Environment Variables

```bash
cd packages/backend
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delivery_shield
GEMINI_API_KEY=your_gemini_api_key
CDP_API_KEY_NAME=your_cdp_api_key_name
CDP_PRIVATE_KEY=your_cdp_private_key
CDP_WALLET_ID=your_wallet_id
PORT=3001
```

### 5. Start Production Backend

```bash
cd packages/backend
npm run dev
```

The server will:
- Connect to MongoDB Atlas
- Initialize RAG service with Gemini AI
- Initialize CDP wallet
- Insert sample refund policies
- Start on port 3001

### 6. Start Frontend

```bash
cd packages/frontend
npm run dev
```

## Project Structure

```
delivery-shield/
├── packages/
│   ├── shared/              # TypeScript types
│   │   ├── src/
│   │   │   ├── types.ts     # All shared interfaces and enums
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── backend/             # Express API
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   │   └── x402.ts  # x402 payment middleware
│   │   │   ├── services/
│   │   │   │   ├── mongodb.ts    # MongoDB Vector Search
│   │   │   │   ├── rag.ts        # Gemini RAG service
│   │   │   │   └── cdp.ts        # CDP wallet & transfers
│   │   │   ├── controllers/
│   │   │   │   └── refund.ts     # Refund logic
│   │   │   ├── routes/
│   │   │   │   └── refund.ts     # API routes
│   │   │   ├── index.ts          # Main server
│   │   │   └── mock-server.ts    # Mock server
│   │   └── package.json
│   │
│   └── frontend/            # React dashboard
│       ├── src/
│       │   ├── components/
│       │   │   ├── X402Button.tsx
│       │   │   ├── SimulateLatencyToggle.tsx
│       │   │   └── DashboardStats.tsx
│       │   ├── services/
│       │   │   └── api.ts        # API client
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
│
├── package.json             # Monorepo root
├── tsconfig.base.json       # Base TypeScript config
├── README.md
└── ARCHITECTURE.md
```

## API Endpoints

### Health Check
```
GET /health
```

### Refund Operations
```
POST /api/refunds/evaluate      # Evaluate refund eligibility
POST /api/refunds/process       # Process refund with transfer
GET  /api/refunds/status/:id    # Get refund status
POST /api/refunds/simulate      # Simulate delivery issues
```

## Development Workflow

### Build All Packages
```bash
npm run build
```

### Run in Development Mode
```bash
npm run dev
```

### Lint Code
```bash
npm run lint
```

## Testing Scenarios

### Scenario 1: Late Delivery (100% Refund)
1. Enable "Simulate Delivery Issues"
2. Click "Request Refund via x402"
3. Expected: Full refund ($24.98), status COMPLETED

### Scenario 2: Normal Delivery (No Refund)
1. Disable "Simulate Delivery Issues"
2. Click "Request Refund via x402"
3. Expected: $0.00 refund, status REJECTED

### Scenario 3: Multiple Orders
1. Process several refunds with different scenarios
2. Watch statistics update in real-time
3. Verify average refund percentage calculation

## Troubleshooting

### Backend won't start
- **MongoDB connection fails**: Check MONGODB_URI in .env
- **CDP initialization fails**: Verify CDP_API_KEY_NAME and CDP_PRIVATE_KEY
- **Port already in use**: Change PORT in .env

### Frontend build fails
- Run `npm run build` in packages/shared first
- Check that shared package built successfully
- Verify node_modules are installed

### Mock server recommended for testing
- Use `npm run dev:mock` to avoid external dependency issues
- Mock server provides same API endpoints
- Perfect for development and testing

## Production Deployment

### Backend (Railway/Render/Heroku)
```bash
cd packages/backend
npm run build
npm start
```

Set environment variables in the platform's dashboard.

### Frontend (Vercel/Netlify)
```bash
cd packages/frontend
npm run build
```

Deploy the `dist/` folder. Set `VITE_API_URL` environment variable to your backend URL.

## Security Notes

1. Never commit `.env` files
2. Use environment variables for all secrets
3. Rotate API keys regularly
4. Use HTTPS in production
5. Implement rate limiting
6. Add authentication for production

## Support

For issues:
1. Check the logs in terminal
2. Verify environment variables
3. Test with mock server first
4. Review ARCHITECTURE.md for system design

## Next Steps

1. Add user authentication
2. Implement real embedding generation
3. Add more refund policies
4. Create admin dashboard
5. Add webhook notifications
6. Implement fraud detection
7. Add multi-currency support

---

Happy coding! 🚀
