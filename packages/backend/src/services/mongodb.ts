import { MongoClient, Collection } from 'mongodb';
import { RefundPolicy } from '@delivery-shield/shared';

export class MongoDBService {
  private client: MongoClient;
  private dbName: string = 'delivery_shield';
  private collectionName: string = 'refund_policies';

  constructor(uri: string) {
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('Connected to MongoDB Atlas');
      
      // Create vector search index if it doesn't exist
      await this.ensureVectorSearchIndex();
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  private async ensureVectorSearchIndex(): Promise<void> {
    try {
      const db = this.client.db(this.dbName);
      const collection = db.collection(this.collectionName);
      
      // Check if index exists
      const indexes = await collection.indexes();
      const vectorIndexExists = indexes.some(idx => idx.name === 'vector_index');
      
      if (!vectorIndexExists) {
        console.log('Vector search index does not exist. Please create it manually in MongoDB Atlas UI.');
        console.log('Index definition:');
        console.log(JSON.stringify({
          name: 'vector_index',
          type: 'vectorSearch',
          definition: {
            fields: [{
              type: 'vector',
              path: 'embedding',
              numDimensions: 768,
              similarity: 'cosine'
            }]
          }
        }, null, 2));
      }
    } catch (error) {
      console.error('Error ensuring vector search index:', error);
    }
  }

  async getPoliciesCollection(): Promise<Collection<RefundPolicy>> {
    const db = this.client.db(this.dbName);
    return db.collection<RefundPolicy>(this.collectionName);
  }

  async vectorSearch(queryEmbedding: number[], limit: number = 5): Promise<RefundPolicy[]> {
    try {
      const collection = await this.getPoliciesCollection();
      
      const pipeline = [
        {
          $search: {
            index: 'vector_index',
            vectorSearch: {
              queryVector: queryEmbedding,
              path: 'embedding',
              numCandidates: 100,
              limit: limit
            }
          }
        },
        {
          $project: {
            _id: 0,
            id: 1,
            title: 1,
            description: 1,
            conditions: 1,
            refundPercentage: 1,
            score: { $meta: 'searchScore' }
          }
        }
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return results as RefundPolicy[];
    } catch (error) {
      console.error('Vector search error:', error);
      // Fallback to simple query if vector search fails
      return this.getAllPolicies(limit);
    }
  }

  async getAllPolicies(limit: number = 10): Promise<RefundPolicy[]> {
    const collection = await this.getPoliciesCollection();
    return collection.find({}).limit(limit).toArray();
  }

  async insertPolicy(policy: RefundPolicy): Promise<void> {
    const collection = await this.getPoliciesCollection();
    await collection.insertOne(policy as any);
  }

  async insertSamplePolicies(): Promise<void> {
    const collection = await this.getPoliciesCollection();
    const count = await collection.countDocuments();
    
    if (count === 0) {
      const samplePolicies: RefundPolicy[] = [
        {
          id: 'policy-1',
          title: 'Late Delivery Refund',
          description: 'Full refund for deliveries delayed by more than 30 minutes',
          conditions: [
            { type: 'DELIVERY_LATENCY' as any, threshold: 1800000, operator: 'GREATER_THAN' as any }
          ],
          refundPercentage: 100
        },
        {
          id: 'policy-2',
          title: 'Cold Food Partial Refund',
          description: 'Partial refund for cold food delivery',
          conditions: [
            { type: 'TEMPERATURE' as any, threshold: 50, operator: 'LESS_THAN' as any }
          ],
          refundPercentage: 50
        },
        {
          id: 'policy-3',
          title: 'System Error Refund',
          description: 'Partial refund for orders with system errors',
          conditions: [
            { type: 'ERROR_COUNT' as any, threshold: 2, operator: 'GREATER_THAN' as any }
          ],
          refundPercentage: 30
        }
      ];

      await collection.insertMany(samplePolicies as any);
      console.log('Sample policies inserted');
    }
  }
}
