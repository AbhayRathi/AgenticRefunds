# 🛡️ Delivery Shield - x402 Refund System

A Node/TypeScript monorepo implementing an automated refund system for delivery services using x402 protocol, RAG (Retrieval-Augmented Generation) with MongoDB Atlas Vector Search, Google Gemini AI, and Coinbase Developer Platform (CDP) for USDC transfers.

## 🌟 Features

- **x402 Protocol Integration**: Express middleware for payment protocol
- **RAG-Powered Policy Retrieval**: MongoDB Atlas Vector Search for intelligent refund policy matching
- **AI Decision Making**: Google Gemini AI evaluates delivery logs and determines refund eligibility
- **Automated USDC Transfers**: Coinbase CDP SDK for instant Base USDC refunds
- **React Dashboard**: Interactive UI with x402 button and latency simulation
- **Real-time Evaluation**: Analyzes delivery latency, temperature violations, and system errors
- **Partial & Full Refunds**: Smart percentage calculation based on matched policies

## 🏗️ Architecture

```
delivery-shield/
├── packages/
│   ├── shared/          # Shared TypeScript types and utilities
│   ├── backend/         # Express API with x402 middleware
│   │   ├── middleware/  # x402 payment middleware
│   │   ├── services/    # MongoDB, RAG, CDP services
│   │   ├── controllers/ # Refund logic controllers
│   │   └── routes/      # API routes
│   └── frontend/        # React dashboard with Vite
│       ├── components/  # X402Button, SimulateLatencyToggle, DashboardStats
│       └── services/    # API client
└── package.json         # Monorepo root
```

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas account with Vector Search enabled
- Google Gemini API key
- Coinbase Developer Platform account

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/AbhayRathi/AgenticRefunds.git
cd AgenticRefunds
npm install
```

### 2. Configure Backend

```bash
cd packages/backend
cp .env.example .env
```

Edit `packages/backend/.env`:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delivery_shield

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Coinbase CDP
CDP_API_KEY_NAME=your_cdp_api_key_name
CDP_PRIVATE_KEY=your_cdp_private_key
CDP_WALLET_ID=optional_wallet_id

# Server
PORT=3001
```

### 3. Configure Frontend

```bash
cd packages/frontend
cp .env.example .env
```

### 4. Build and Run

```bash
# From root directory
npm run build

# Start backend (from packages/backend)
cd packages/backend
npm run dev

# Start frontend (from packages/frontend, in new terminal)
cd packages/frontend
npm run dev
```

Access the dashboard at: `http://localhost:3000`

## 🔧 MongoDB Atlas Vector Search Setup

1. Create a MongoDB Atlas cluster
2. Create a database named `delivery_shield`
3. Create a collection named `refund_policies`
4. Create a Vector Search index named `vector_index`:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

## 🎮 Using the Dashboard

1. **View Statistics**: Monitor total orders, refunds, and amounts
2. **Simulate Latency**: Toggle to test late delivery scenarios
3. **Request Refund**: Click the x402 button to process a refund
4. **View Results**: See matched policies, refund amount, and transaction hash

## 🔌 API Endpoints

### Refunds

- `POST /api/refunds/evaluate` - Evaluate refund eligibility
- `POST /api/refunds/process` - Process a refund with USDC transfer
- `GET /api/refunds/status/:refundId` - Get refund status
- `POST /api/refunds/simulate` - Simulate delivery issues

### Health

- `GET /health` - Backend health check

## 🧪 Refund Policies

The system includes sample policies:

1. **Late Delivery**: 100% refund for >30 min delays
2. **Cold Food**: 50% refund for temperature violations
3. **System Errors**: 30% refund for multiple errors

## 🛠️ Development

```bash
# Build all packages
npm run build

# Run in development mode
npm run dev

# Lint code
npm run lint

# Run tests (if available)
npm run test
```

## 📦 Package Details

### @delivery-shield/shared
Common TypeScript types and interfaces used across packages.

### @delivery-shield/backend
Express server with:
- x402 payment middleware
- MongoDB Atlas integration
- Gemini AI RAG service
- CDP wallet management
- Refund processing logic

### @delivery-shield/frontend
React dashboard with:
- x402 refund button
- Latency simulation toggle
- Real-time statistics
- Transaction history

## 🔐 Security

- Environment variables for sensitive credentials
- x402 payment validation
- Secure wallet management with CDP
- Input validation on all endpoints

## 🚀 Deployment

### Backend (Railway/Render)
```bash
cd packages/backend
npm run build
npm start
```

### Frontend (Vercel/Netlify)
```bash
cd packages/frontend
npm run build
# Deploy dist/ folder
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- MongoDB Atlas for Vector Search capabilities
- Google Gemini for AI-powered reasoning
- Coinbase for CDP SDK and Base USDC support
- x402 protocol for payment standards

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API endpoint examples

---

Built with ❤️ for instant, fair, and automated refunds