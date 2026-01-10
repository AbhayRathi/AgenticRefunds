import { RegistryService } from '../../services/registry';
import { X402Tool, ToolCategory, X402ToolSchema } from '@delivery-shield/shared';
import { MongoClient } from 'mongodb';

// Mock MongoDB for testing
jest.mock('mongodb');

describe('RegistryService', () => {
  let registryService: RegistryService;
  let mockClient: jest.Mocked<MongoClient>;
  let mockCollection: any;
  let mockDb: any;

  beforeEach(() => {
    // Setup mock MongoDB client
    mockCollection = {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      insertMany: jest.fn(),
      updateOne: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      limit: jest.fn().mockReturnThis(),
      indexes: jest.fn().mockResolvedValue([])
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      db: jest.fn().mockReturnValue(mockDb)
    } as any;

    (MongoClient as jest.MockedClass<typeof MongoClient>).mockImplementation(() => mockClient);

    registryService = new RegistryService('mongodb://localhost:27017');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection', () => {
    it('should connect to MongoDB successfully', async () => {
      await registryService.connect();
      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should disconnect from MongoDB', async () => {
      await registryService.disconnect();
      expect(mockClient.close).toHaveBeenCalled();
    });
  });

  describe('Tool Management', () => {
    it('should insert a valid tool', async () => {
      const tool: X402Tool = {
        name: 'Test Tool',
        version: '1.0.0',
        endpoint: 'https://api.test.com',
        priceUsdc: 5,
        category: ToolCategory.FOOD,
        reliabilityScore: 0.8
      };

      await registryService.connect();
      await registryService.insertTool(tool);

      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('should reject tool with invalid reliability score', async () => {
      const invalidTool = {
        name: 'Bad Tool',
        version: '1.0.0',
        endpoint: 'https://api.test.com',
        priceUsdc: 5,
        category: ToolCategory.FOOD,
        reliabilityScore: 1.5 // Invalid: > 1
      };

      await registryService.connect();
      await expect(registryService.insertTool(invalidTool as X402Tool)).rejects.toThrow();
    });

    it('should reject tool with negative price', async () => {
      const invalidTool = {
        name: 'Free Tool',
        version: '1.0.0',
        endpoint: 'https://api.test.com',
        priceUsdc: -5, // Invalid: negative
        category: ToolCategory.FOOD,
        reliabilityScore: 0.8
      };

      await registryService.connect();
      await expect(registryService.insertTool(invalidTool as X402Tool)).rejects.toThrow();
    });
  });

  describe('Reliability Filtering', () => {
    it('should filter out tools with reliability < 0.5', async () => {
      const tools = [
        {
          name: 'Good Tool',
          version: '1.0.0',
          endpoint: 'https://api.good.com',
          priceUsdc: 5,
          category: ToolCategory.FOOD,
          reliabilityScore: 0.8
        },
        {
          name: 'Bad Tool',
          version: '1.0.0',
          endpoint: 'https://api.bad.com',
          priceUsdc: 5,
          category: ToolCategory.FOOD,
          reliabilityScore: 0.3
        }
      ];

      mockCollection.toArray.mockResolvedValue(tools.filter(t => t.reliabilityScore >= 0.5));

      await registryService.connect();
      const result = await registryService.getAllTools();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Good Tool');
    });

    it('should flag tools with reliability < 0.5 for negotiation', async () => {
      const flaggedTools = [
        {
          name: 'Unreliable Tool',
          version: '1.0.0',
          endpoint: 'https://api.unreliable.com',
          priceUsdc: 5,
          category: ToolCategory.FOOD,
          reliabilityScore: 0.3
        }
      ];

      mockCollection.toArray.mockResolvedValue(flaggedTools);

      await registryService.connect();
      const result = await registryService.getToolsFlaggedForNegotiation();

      expect(result.length).toBeGreaterThan(0);
      expect(result.every(tool => tool.reliabilityScore < 0.5)).toBe(true);
    });

    it('should include tools with reliability exactly 0.5', async () => {
      const tools = [
        {
          name: 'Borderline Tool',
          version: '1.0.0',
          endpoint: 'https://api.borderline.com',
          priceUsdc: 5,
          category: ToolCategory.FOOD,
          reliabilityScore: 0.5
        }
      ];

      mockCollection.toArray.mockResolvedValue(tools);

      await registryService.connect();
      const result = await registryService.getAllTools();

      expect(result).toHaveLength(1);
      expect(result[0].reliabilityScore).toBe(0.5);
    });

    it('should exclude tools with reliability just below 0.5', async () => {
      mockCollection.toArray.mockResolvedValue([]);

      await registryService.connect();
      const result = await registryService.getAllTools();

      // When filtering with >= 0.5, tools with 0.49 should be excluded
      expect(mockCollection.find).toHaveBeenCalledWith({ reliabilityScore: { $gte: 0.5 } });
    });
  });

  describe('Vector Search', () => {
    it('should perform vector search with reliability filtering', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const searchResults = [
        {
          name: 'Search Result',
          version: '1.0.0',
          endpoint: 'https://api.result.com',
          priceUsdc: 5,
          category: ToolCategory.FOOD,
          reliabilityScore: 0.9,
          score: 0.95
        }
      ];

      mockCollection.toArray.mockResolvedValue(searchResults);

      await registryService.connect();
      const result = await registryService.vectorSearchTools(queryEmbedding);

      expect(mockCollection.aggregate).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].reliabilityScore).toBeGreaterThanOrEqual(0.5);
    });

    it('should fall back to getAllTools if vector search fails', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      
      // Mock aggregate to throw an error
      mockCollection.aggregate.mockImplementation(() => {
        throw new Error('Vector search not available');
      });

      const fallbackTools = [
        {
          name: 'Fallback Tool',
          version: '1.0.0',
          endpoint: 'https://api.fallback.com',
          priceUsdc: 5,
          category: ToolCategory.FOOD,
          reliabilityScore: 0.8
        }
      ];

      mockCollection.toArray.mockResolvedValue(fallbackTools);

      await registryService.connect();
      const result = await registryService.vectorSearchTools(queryEmbedding);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Fallback Tool');
    });
  });

  describe('Merchant Reputation', () => {
    it('should calculate reputation based on incidents', async () => {
      const incidents = [
        {
          toolId: 'Test Tool',
          incidentType: 'Cold' as const,
          orderId: 'order-1',
          timestamp: Date.now(),
          severity: 0.3
        },
        {
          toolId: 'Test Tool',
          incidentType: 'Late' as const,
          orderId: 'order-2',
          timestamp: Date.now(),
          severity: 0.5
        }
      ];

      mockCollection.toArray.mockResolvedValue(incidents);

      await registryService.connect();
      const reputation = await registryService.getMerchantReputation('Test Tool');

      expect(reputation.totalIncidents).toBe(2);
      expect(reputation.coldIncidents).toBe(1);
      expect(reputation.lateIncidents).toBe(1);
      expect(reputation.averageSeverity).toBe(0.4);
      expect(reputation.reputationScore).toBeLessThan(1.0);
    });

    it('should return perfect reputation for tools with no incidents', async () => {
      mockCollection.toArray.mockResolvedValue([]);

      await registryService.connect();
      const reputation = await registryService.getMerchantReputation('Perfect Tool');

      expect(reputation.totalIncidents).toBe(0);
      expect(reputation.reputationScore).toBe(1.0);
      expect(reputation.averageSeverity).toBe(0);
    });

    it('should count incident types correctly', async () => {
      const incidents = [
        {
          toolId: 'Test Tool',
          incidentType: 'Cold' as const,
          orderId: 'order-1',
          timestamp: Date.now(),
          severity: 0.3
        },
        {
          toolId: 'Test Tool',
          incidentType: 'Cold' as const,
          orderId: 'order-2',
          timestamp: Date.now(),
          severity: 0.4
        },
        {
          toolId: 'Test Tool',
          incidentType: 'Late' as const,
          orderId: 'order-3',
          timestamp: Date.now(),
          severity: 0.5
        },
        {
          toolId: 'Test Tool',
          incidentType: 'Missing' as const,
          orderId: 'order-4',
          timestamp: Date.now(),
          severity: 0.6
        },
        {
          toolId: 'Test Tool',
          incidentType: 'Wrong' as const,
          orderId: 'order-5',
          timestamp: Date.now(),
          severity: 0.4
        }
      ];

      mockCollection.toArray.mockResolvedValue(incidents);

      await registryService.connect();
      const reputation = await registryService.getMerchantReputation('Test Tool');

      expect(reputation.coldIncidents).toBe(2);
      expect(reputation.lateIncidents).toBe(1);
      expect(reputation.missingIncidents).toBe(1);
      expect(reputation.wrongIncidents).toBe(1);
      expect(reputation.totalIncidents).toBe(5);
    });
  });

  describe('Tool Categories', () => {
    it('should filter tools by category', async () => {
      const foodTools = [
        {
          name: 'Food Tool',
          version: '1.0.0',
          endpoint: 'https://api.food.com',
          priceUsdc: 5,
          category: ToolCategory.FOOD,
          reliabilityScore: 0.9
        }
      ];

      mockCollection.toArray.mockResolvedValue(foodTools);

      await registryService.connect();
      const result = await registryService.getToolsByCategory(ToolCategory.FOOD);

      expect(mockCollection.find).toHaveBeenCalledWith({
        category: ToolCategory.FOOD,
        reliabilityScore: { $gte: 0.5 }
      });
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(ToolCategory.FOOD);
    });
  });

  describe('Zod Schema Validation', () => {
    it('should validate tool with correct schema', () => {
      const validTool = {
        name: 'Valid Tool',
        version: '1.0.0',
        endpoint: 'https://api.valid.com',
        priceUsdc: 5,
        category: ToolCategory.FOOD,
        reliabilityScore: 0.8
      };

      const result = X402ToolSchema.safeParse(validTool);
      expect(result.success).toBe(true);
    });

    it('should reject tool with invalid URL', () => {
      const invalidTool = {
        name: 'Invalid Tool',
        version: '1.0.0',
        endpoint: 'not-a-url',
        priceUsdc: 5,
        category: ToolCategory.FOOD,
        reliabilityScore: 0.8
      };

      const result = X402ToolSchema.safeParse(invalidTool);
      expect(result.success).toBe(false);
    });

    it('should reject tool with empty name', () => {
      const invalidTool = {
        name: '',
        version: '1.0.0',
        endpoint: 'https://api.test.com',
        priceUsdc: 5,
        category: ToolCategory.FOOD,
        reliabilityScore: 0.8
      };

      const result = X402ToolSchema.safeParse(invalidTool);
      expect(result.success).toBe(false);
    });
  });
});
