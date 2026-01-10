# 🛡️ Delivery Shield - x402 Refund System

A Node/TypeScript monorepo implementing an automated refund system for delivery services using x402 protocol, RAG (Retrieval-Augmented Generation) with MongoDB Atlas Vector Search, Google Gemini AI, and Coinbase Developer Platform (CDP) for USDC transfers.

![Delivery Shield Dashboard](https://github.com/user-attachments/assets/426f5058-4908-4b22-8ad6-2767efc6b128)

## 🌟 Features

- **x402 Protocol Integration**: Express middleware for payment protocol
- **RAG-Powered Policy Retrieval**: MongoDB Atlas Vector Search for intelligent refund policy matching
- **AI Decision Making**: Google Gemini AI evaluates delivery logs and determines refund eligibility
- **Automated USDC Transfers**: Coinbase CDP SDK for instant Base USDC refunds
- **React Dashboard**: Interactive UI with x402 button and latency simulation
- **Real-time Evaluation**: Analyzes delivery latency, temperature violations, and system errors
- **Partial & Full Refunds**: Smart percentage calculation based on matched policies

## 📸 Screenshots

### Dashboard - Initial State
![Dashboard Initial](https://github.com/user-attachments/assets/426f5058-4908-4b22-8ad6-2767efc6b128)

### Successful Refund (Late Delivery)
![Refund Success](https://github.com/user-attachments/assets/b3e770e4-b1bf-410e-b9c6-0d43a79b1aea)

### Rejected Refund (Normal Delivery)
![Refund Rejected](https://github.com/user-attachments/assets/c9ce10ba-9f68-4587-8de5-ee6388ffeed3)

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

**The fastest way to test without external dependencies:**

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start mock backend (terminal 1)
cd packages/backend
npm run dev:mock

# Start frontend (terminal 2)
cd packages/frontend
npm run dev
```

Visit `http://localhost:3000` to see the dashboard!

**For full setup with MongoDB, Gemini AI, and CDP, see [SETUP.md](./SETUP.md)**

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
2. **Simulate Latency**: Toggle ON to test late delivery scenarios (100% refund)
3. **Request Refund**: Click the x402 button to process a refund
4. **View Results**: See matched policies, refund amount, reasoning, and mock transaction hash
5. **Test Normal Delivery**: Toggle OFF to simulate successful deliveries (no refund)

### Example Flows

**Late Delivery (100% Refund)**
- Enable "Simulate Delivery Issues" toggle
- Click "Request Refund via x402"
- Result: Full refund approved with transaction hash

**Normal Delivery (No Refund)**
- Disable "Simulate Delivery Issues" toggle  
- Click "Request Refund via x402"
- Result: Refund rejected, order delivered successfully

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
- MongoDB Atlas integration with Vector Search
- Gemini AI RAG service
- CDP wallet management
- Refund processing logic
- **Mock server** for testing without external dependencies

### @delivery-shield/frontend
React dashboard with:
- x402 refund button component
- Latency simulation toggle
- Real-time statistics dashboard
- Refund result display with reasoning

## 📚 Documentation

- [SETUP.md](./SETUP.md) - Complete setup instructions for both mock and production
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture and data flow
- [Backend .env.example](./packages/backend/.env.example) - Environment variables reference
- [Frontend .env.example](./packages/frontend/.env.example) - Frontend configuration

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