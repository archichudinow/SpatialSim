import { useEffect } from 'react';
import { useAppState } from '../../AppState';
import { PROJECT_CONFIG } from '../../config/projectConfig';
import { enhanceAgentMetadata } from '../../services/agentProcessor';
import { loadGLBBatch, normalizeAgentDurations } from '../../services/glbLoaderService';

/**
 * LoadAgentData Component
 * 
 * Loads agent/participant GLB files and prepares them for AnimationMixer playback.
 * Now supports loading from Supabase Storage URLs.
 * 
 * GLB files contain:
 * - Preprocessed position/lookAt data (Y/Z swap and 0.01 scale already applied)
 * - Fixed participant colors in metadata
 * - Time-based animation keyframes
 */
export default function LoadAgentData() {
  const setRawData = useAppState((s) => s.actions.data.setRawData);
  const setMaxTime = useAppState((s) => s.actions.playback.setMaxTime);
  const setLoaderMessage = useAppState((s) => s.actions.data.setLoaderMessage);
  const setError = useAppState((s) => s.actions.data.setError);

  useEffect(() => {
    loadGLBFiles();
  }, []);

  const loadGLBFiles = async () => {
    try {
      setLoaderMessage('glbData', 'Loading agent data...');
      setError(null);

      // Get record URLs from project config (already loaded from Supabase)
      const recordUrls = PROJECT_CONFIG.recordsUrl;

      console.log('📂 Loading records:', recordUrls?.length || 0, 'files');

      if (!recordUrls || recordUrls.length === 0) {
        throw new Error('No agent records found in project configuration');
      }

      // For Supabase URLs, we already have the full list
      // For legacy local files, we need to fetch manifest first
      let glbUrls: string[];
      let fileNames: string[];
      
      if (recordUrls[0].includes('manifest.json')) {
        console.log('📄 Loading from manifest.json (legacy mode)');
        // Legacy: Load manifest.json first
        const manifestResponse = await fetch(recordUrls[0]);
        
        if (!manifestResponse.ok) {
          throw new Error(`Failed to load manifest: ${manifestResponse.statusText}`);
        }

        const manifest = await manifestResponse.json();
        const glbPath = `${PROJECT_CONFIG.recordsPath}/`;
        glbUrls = manifest.map((filename: string) => `${glbPath}${filename}`);
        fileNames = manifest;
      } else {
        console.log('🌐 Loading from Supabase URLs (direct mode)');
        // Supabase: URLs are already full paths
        glbUrls = recordUrls;
        fileNames = recordUrls.map(url => url.split('/').pop() || url);
      }

      console.log(`📦 Loading ${glbUrls.length} agent records...`);

      // Load GLB files using service
      const agents = await loadGLBBatch(
        fileNames,
        glbUrls[0].substring(0, glbUrls[0].lastIndexOf('/') + 1), // Extract base path
        (loadedCount, totalCount) => {
          const progress = Math.round((loadedCount / totalCount) * 100);
          setLoaderMessage('glbData', `Loading agent data... ${progress}%`);
        }
      );

      console.log(`✅ Loaded ${agents.length} agents`);

      // Sort agents by ID to maintain consistent ordering
      agents.sort((a, b) => a.id - b.id);

      // Normalize durations (this also calculates maxTime internally)
      normalizeAgentDurations(agents);
      
      // Calculate max time after normalization
      const maxTime = Math.max(...agents.map(agent => agent.meta.duration), 0);

      console.log(`⏱️  Max time: ${maxTime}s`);

      // Enhance agents with pre-computed metadata and helper functions
      const enhancedAgents = agents.map(agent => enhanceAgentMetadata(agent));

      // Set data in AppState
      setRawData(enhancedAgents);
      setMaxTime(maxTime);
      setLoaderMessage('glbData', null); // Clear message

    } catch (error) {
      console.error('❌ LoadAgentData error:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
      setLoaderMessage('glbData', 'Error loading agent data');
    }
  };

  return null;
}
