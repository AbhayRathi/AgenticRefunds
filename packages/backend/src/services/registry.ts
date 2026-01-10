import { MongoClient, Collection, Document } from 'mongodb';
import { X402Tool, ReputationIncident, X402ToolSchema, ToolCategory } from '@delivery-shield/shared';

export interface ToolDocument extends X402Tool {
  _id?: string;
  embedding?: number[];
}

export interface ReputationIndexDocument extends ReputationIncident {
  _id?: string;
}

export class RegistryService {
  private client: MongoClient;
  private dbName: string = 'delivery_shield';
  private toolsCollectionName: string = 'x402_tools';
  private reputationCollectionName: string = 'reputation_index';

  constructor(uri: string) {
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('RegistryService connected to MongoDB Atlas');
      
      // Ensure vector search index for tools
      await this.ensureVectorSearchIndex();
    } catch (error) {
      console.error('Failed to connect RegistryService to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  private async ensureVectorSearchIndex(): Promise<void> {
    try {
      const db = this.client.db(this.dbName);
      const collection = db.collection(this.toolsCollectionName);
      
      // Check if index exists
      const indexes = await collection.indexes();
      const vectorIndexExists = indexes.some(idx => idx.name === 'tool_vector_index');
      
      if (!vectorIndexExists) {
        console.log('Tool Vector search index does not exist. Please create it manually in MongoDB Atlas UI.');
        console.log('Index definition:');
        console.log(JSON.stringify({
          name: 'tool_vector_index',
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

  async getToolsCollection(): Promise<Collection<ToolDocument>> {
    const db = this.client.db(this.dbName);
    return db.collection<ToolDocument>(this.toolsCollectionName);
  }

  async getReputationCollection(): Promise<Collection<ReputationIndexDocument>> {
    const db = this.client.db(this.dbName);
    return db.collection<ReputationIndexDocument>(this.reputationCollectionName);
  }

  /**
   * Vector Search for tools based on natural language query
   * @param queryEmbedding - 768-dimensional embedding vector
   * @param limit - Maximum number of results to return
   * @returns Array of tools matching the query
   */
  async vectorSearchTools(queryEmbedding: number[], limit: number = 5): Promise<ToolDocument[]> {
    try {
      const collection = await this.getToolsCollection();
      
      const pipeline = [
        {
          $search: {
            index: 'tool_vector_index',
            vectorSearch: {
              queryVector: queryEmbedding,
              path: 'embedding',
              numCandidates: 100,
              limit: limit
            }
          }
        },
        {
          $match: {
            reliabilityScore: { $gte: 0.5 } // Filter out tools with reliability < 0.5
          }
        },
        {
          $project: {
            _id: 0,
            name: 1,
            version: 1,
            endpoint: 1,
            priceUsdc: 1,
            category: 1,
            reliabilityScore: 1,
            score: { $meta: 'searchScore' }
          }
        }
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return results as ToolDocument[];
    } catch (error) {
      console.error('Vector search error:', error);
      // Fallback to simple query if vector search fails
      return this.getAllTools(limit);
    }
  }

  /**
   * Get all tools with reliability score >= 0.5
   * @param limit - Maximum number of results to return
   * @returns Array of tools
   */
  async getAllTools(limit: number = 10): Promise<ToolDocument[]> {
    const collection = await this.getToolsCollection();
    return collection
      .find({ reliabilityScore: { $gte: 0.5 } })
      .limit(limit)
      .toArray();
  }

  /**
   * Get tools by category with reliability filtering
   * @param category - Tool category to filter by
   * @returns Array of tools in the specified category
   */
  async getToolsByCategory(category: string): Promise<ToolDocument[]> {
    const collection = await this.getToolsCollection();
    return collection
      .find({ 
        category: category as ToolCategory,
        reliabilityScore: { $gte: 0.5 }
      })
      .toArray();
  }

  /**
   * Killer Moat Logic: Get merchant reputation by cross-referencing with past incidents
   * @param toolId - The ID/name of the tool to check
   * @returns Reputation statistics including incident counts
   */
  async getMerchantReputation(toolId: string): Promise<{
    toolId: string;
    totalIncidents: number;
    coldIncidents: number;
    lateIncidents: number;
    missingIncidents: number;
    wrongIncidents: number;
    averageSeverity: number;
    reputationScore: number;
  }> {
    const reputationCollection = await this.getReputationCollection();
    
    // Get all incidents for this tool
    const incidents = await reputationCollection.find({ toolId }).toArray();
    
    const totalIncidents = incidents.length;
    const coldIncidents = incidents.filter(i => i.incidentType === 'Cold').length;
    const lateIncidents = incidents.filter(i => i.incidentType === 'Late').length;
    const missingIncidents = incidents.filter(i => i.incidentType === 'Missing').length;
    const wrongIncidents = incidents.filter(i => i.incidentType === 'Wrong').length;
    
    const averageSeverity = totalIncidents > 0
      ? incidents.reduce((sum, i) => sum + i.severity, 0) / totalIncidents
      : 0;
    
    // Calculate reputation score (1.0 = perfect, lower = worse)
    // Penalty based on incidents and severity
    const reputationScore = Math.max(0, 1.0 - (totalIncidents * 0.05) - (averageSeverity * 0.3));
    
    return {
      toolId,
      totalIncidents,
      coldIncidents,
      lateIncidents,
      missingIncidents,
      wrongIncidents,
      averageSeverity,
      reputationScore
    };
  }

  /**
   * Insert a new tool into the registry
   * @param tool - Tool data to insert
   */
  async insertTool(tool: X402Tool, embedding?: number[]): Promise<void> {
    // Validate tool with Zod schema
    const validatedTool = X402ToolSchema.parse(tool);
    
    const collection = await this.getToolsCollection();
    const toolDoc: ToolDocument = {
      ...validatedTool,
      embedding
    };
    await collection.insertOne(toolDoc);
  }

  /**
   * Insert a reputation incident
   * @param incident - Incident data to insert
   */
  async insertReputationIncident(incident: ReputationIncident): Promise<void> {
    const collection = await this.getReputationCollection();
    await collection.insertOne(incident);
  }

  /**
   * Update tool reliability score based on reputation
   * @param toolId - The tool ID/name to update
   * @param newScore - New reliability score
   */
  async updateToolReliability(toolId: string, newScore: number): Promise<void> {
    const collection = await this.getToolsCollection();
    await collection.updateOne(
      { name: toolId },
      { $set: { reliabilityScore: newScore } }
    );
  }

  /**
   * Get tools flagged for negotiation (reliability < 0.5)
   * @returns Array of tools with low reliability
   */
  async getToolsFlaggedForNegotiation(): Promise<ToolDocument[]> {
    const collection = await this.getToolsCollection();
    return collection.find({ reliabilityScore: { $lt: 0.5 } }).toArray();
  }
}
