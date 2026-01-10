# Delivery Shield - Technical Architecture

## System Overview

Delivery Shield is an automated refund system that uses AI and blockchain to instantly compensate customers for delivery issues.

## Key Components

### 1. x402 Protocol Middleware
- Validates payment headers
- Extracts payment information
- Attaches to Express requests
- Returns 402 Payment Required when needed

### 2. MongoDB Atlas Vector Search
- Stores refund policies with embeddings
- Performs semantic similarity search
- Enables intelligent policy matching
- Scales to thousands of policies

### 3. RAG Service (Gemini AI)
- Generates embeddings for queries
- Retrieves relevant policies via vector search
- Evaluates system logs against policy conditions
- Generates human-readable reasoning

### 4. CDP Wallet Service
- Manages Base network wallets
- Executes USDC transfers
- Tracks transaction hashes
- Handles wallet initialization

### 5. Refund Controller
- Orchestrates evaluation and transfer
- Calculates refund percentages
- Logs all transactions
- Returns detailed responses

## Data Flow

```
1. Customer Order → System Logs Generated
2. User Requests Refund → Frontend Sends Data
3. Backend Evaluates:
   a. Creates query from logs
   b. Generates embedding
   c. Searches policies in MongoDB
   d. Evaluates conditions
   e. Uses Gemini for reasoning
4. If Approved:
   a. Calculate refund amount
   b. Execute CDP transfer
   c. Return transaction hash
5. Frontend Displays Result
```

## Policy Evaluation

Policies contain:
- **Conditions**: Thresholds for metrics (latency, temperature, errors)
- **Operators**: GREATER_THAN, LESS_THAN, EQUAL_TO
- **Refund Percentage**: 0-100%

System calculates metrics from logs:
- Maximum delivery latency
- Minimum temperature
- Error count

Matches policies where ALL conditions are met.
Returns highest refund percentage.

## Security Considerations

1. **Environment Variables**: All secrets in .env files
2. **Wallet Management**: CDP handles private keys
3. **Input Validation**: All endpoints validate input
4. **Rate Limiting**: Should be added for production
5. **Authentication**: Should be added for production

## Scalability

1. **MongoDB Atlas**: Auto-scales with demand
2. **Vector Search**: Handles millions of policies
3. **Stateless Backend**: Easy horizontal scaling
4. **CDN Frontend**: Global distribution
5. **Async Processing**: Non-blocking operations

## Future Enhancements

1. **Machine Learning**: Train on historical refund data
2. **Multi-chain Support**: Add Ethereum, Polygon, etc.
3. **Real-time Notifications**: WebSocket updates
4. **Advanced Analytics**: Fraud detection, patterns
5. **Mobile App**: Native iOS/Android apps
