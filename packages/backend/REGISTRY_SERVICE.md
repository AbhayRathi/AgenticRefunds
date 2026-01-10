# Registry Service Documentation

## Overview

The Registry Service provides a Dynamic Bazaar for Agentic Commerce, stored in MongoDB Atlas. It enables agents to discover services, check their on-chain reputation, and validate every transaction schema using Zod before any funds are spent.

## Key Features

### 1. **Vector Search Discovery** (768-dim, cosine similarity)
Natural language queries like "I need someone to deliver food fast" automatically find relevant tools using MongoDB Atlas Vector Search.

### 2. **Zod Schema Validation**
Every tool must pass strict Zod validation before being added to the registry, preventing malformed tool calls that could drain funds.

### 3. **Reputation Index** ("Killer Moat Logic")
Cross-references tools with past incidents (Cold/Late/Missing/Wrong) to calculate dynamic reputation scores.

### 4. **Automatic Reliability Filtering**
Tools with reliability scores below 0.5 are automatically filtered out or flagged for negotiation.

## Types and Schemas

### X402Tool Schema
```typescript
{
  name: string;           // Tool name (required, min 1 char)
  version: string;        // Version (required, min 1 char)
  endpoint: string;       // Valid URL endpoint (required, must be valid URL)
  priceUsdc: number;      // Price in USDC (required, >= 0)
  category: ToolCategory; // Logistics | Food | Resolution
  reliabilityScore: number; // 0.0 to 1.0 (required, 0 <= score <= 1)
}
```

### AgentSession Schema
```typescript
{
  session_id: string;                    // Unique session identifier
  status: AgentSessionStatus;            // Planning | Paying | Monitoring | Resolving
  totalSpent: number;                    // Total amount spent (>= 0)
  thoughtLog: ThoughtLogEntry[];         // Array of thought log entries
}
```

### ThoughtLogEntry Schema
```typescript
{
  timestamp: number;     // Unix timestamp (positive integer)
  level: ThoughtLevel;   // info | warning | error | debug
  message: string;       // Log message (required, min 1 char)
}
```

## Usage

### Seeding the Registry

```bash
# From the backend package directory
npm run seed:registry
```

This will populate the database with three sample tools:
- **Midnight Burritos** (Food, $10 USDC, 0.9 reliability)
- **Rocket Couriers** (Logistics, $2 USDC, 0.95 reliability)
- **Shield Verify** (Resolution, $0 USDC, 1.0 reliability)

### Service API

```typescript
import { RegistryService } from './services/registry';

const registry = new RegistryService(MONGODB_URI);
await registry.connect();

// Vector search for tools
const tools = await registry.vectorSearchTools(queryEmbedding, limit);

// Get tools by category
const foodTools = await registry.getToolsByCategory('Food');

// Check merchant reputation
const reputation = await registry.getMerchantReputation('Midnight Burritos');
console.log(`Reputation Score: ${reputation.reputationScore}`);
console.log(`Total Incidents: ${reputation.totalIncidents}`);

// Get tools flagged for negotiation (reliability < 0.5)
const flaggedTools = await registry.getToolsFlaggedForNegotiation();

// Insert a new tool (with Zod validation)
await registry.insertTool({
  name: 'New Service',
  version: '1.0.0',
  endpoint: 'https://api.newservice.com',
  priceUsdc: 5,
  category: ToolCategory.LOGISTICS,
  reliabilityScore: 0.85
});
```

## MongoDB Atlas Setup

### Vector Search Index

To enable natural language search, create a vector search index in MongoDB Atlas:

1. Navigate to your MongoDB Atlas cluster
2. Go to the "Search" tab
3. Create a new search index with the following configuration:

```json
{
  "name": "tool_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [{
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }]
  }
}
```

### Collections

The service uses two collections:
- `x402_tools` - Stores tool registry
- `reputation_index` - Tracks incident history

## Testing

The service includes comprehensive tests covering:
- Tool validation and insertion
- Reliability filtering (ensures tools < 0.5 are filtered)
- Vector search with fallback
- Merchant reputation calculation
- Category filtering
- Zod schema validation

Run tests:
```bash
npm test -- src/__tests__/services/registry.test.ts
```

## Demo Pitch Points

For judges, highlight:

> "Our agent doesn't just hard-code API calls. It uses a **Dynamic Bazaar** stored in MongoDB. It discovers services using natural language, checks their **on-chain reputation**, and validates every transaction schema using **Zod** before a single cent is spent on the Base network."

### Key Differentiators:

1. **Security**: Zod validation prevents malformed tool calls
2. **Discovery**: Vector search enables natural language tool discovery
3. **Trust**: Reputation index creates accountability
4. **Reliability**: Automatic filtering of low-quality services
