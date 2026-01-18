export interface RecommendationResponse {
  student_projects: any[];
  startup_projects: any[];
  mentor_profiles: any[];
  research_projects: any[];
}

export interface SearchInput {
  query: string;
  top_n?: number;
}

import { RECOMMENDATION_API_BASE_URL } from '../config/apiConfig';

export class RecommendationService {
  static async getRecommendations(query: string, topN: number = 5): Promise<RecommendationResponse> {
    try {
      console.log(`🔍 Searching for: "${query}"`);
      
      const response = await fetch(`${RECOMMENDATION_API_BASE_URL}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          top_n: topN
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Log the results for debugging
      const totalResults = data.student_projects.length + 
                          data.startup_projects.length + 
                          data.mentor_profiles.length + 
                          data.research_projects.length;
      
      console.log(`✅ Found ${totalResults} results:`);
      console.log(`   Student Projects: ${data.student_projects.length}`);
      console.log(`   Startup Projects: ${data.startup_projects.length}`);
      console.log(`   Mentor Profiles: ${data.mentor_profiles.length}`);
      console.log(`   Research Projects: ${data.research_projects.length}`);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching recommendations:', error);
      
      // Return empty results instead of throwing
      return {
        student_projects: [],
        startup_projects: [],
        mentor_profiles: [],
        research_projects: []
      };
    }
  }

  static async debugQuery(query: string): Promise<any> {
    try {
      console.log(`🔍 Debugging query: "${query}"`);
      
      const response = await fetch(`${RECOMMENDATION_API_BASE_URL}/debug-query?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 Debug data:', data);
      return data;
    } catch (error) {
      console.error('❌ Error debugging query:', error);
      return null;
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${RECOMMENDATION_API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  static async getCollectionsInfo(): Promise<any> {
    try {
      const response = await fetch(`${RECOMMENDATION_API_BASE_URL}/collections-info`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching collections info:', error);
      throw error;
    }
  }
} 