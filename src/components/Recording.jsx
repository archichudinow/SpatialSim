import { useState, useEffect } from 'react';
import recordingManager from '../utils/RecordingManager';
import GLBExporter from '../utils/GLBExporter';
import './Recording.css';

// Global state for visualization (shared with Scene)
let visualizationState = false;

export function Recording({ project, selectedOption, selectedScenario, onReload, isVRMode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);

  // Set project, option, and scenario IDs when they change
  useEffect(() => {
    if (project?.id && selectedOption?.id && selectedScenario?.id) {
      recordingManager.setProjectInfo(project.id, selectedOption, selectedScenario);
    }
  }, [project?.id, selectedOption?.id, selectedScenario?.id]);

  // Update recording status periodically
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        const status = recordingManager.getStatus();
        setFrameCount(status.frameCount);
        setDuration(status.duration);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    if (!selectedScenario) {
      setExportStatus('❌ No scenario selected');
      return;
    }
    recordingManager.startRecording();
    setIsRecording(true);
    setFrameCount(0);
    setDuration(0);
    setExportStatus('');
  };

  const handleStopRecording = () => {
    recordingManager.stopRecording();
    setIsRecording(false);
  };

  const handleExport = async () => {
    const data = recordingManager.exportJSON();

    // Validate before export
    const validation = GLBExporter.validateRecording(data);
    if (!validation.valid) {
      setExportStatus(`❌ ${validation.errors.join(', ')}`);
      return;
    }

    setIsExporting(true);
    setExportStatus('⏳ Exporting to GLB...');

    try {
      const glbBlob = await GLBExporter.exportToGLB(data);
      
      // Generate file name based on option and scenario
      const optionName = selectedOption?.name || 'option';
      const scenarioName = selectedScenario?.name || 'scenario';
      const uniqueId = Date.now();
      const fileName = `${optionName}_${scenarioName}_${uniqueId}`;
      
      GLBExporter.downloadGLB(glbBlob, { 
        ...data.metadata, 
        optionName, 
        scenarioName,
        fileName 
      });
      
      setExportStatus('✅ GLB exported successfully');

      // Reset after successful export
      setTimeout(() => {
        recordingManager.clear();
        setFrameCount(0);
        setDuration(0);
        setExportStatus('');
      }, 2000);
    } catch (error) {
      setExportStatus(`❌ Export failed: ${error.message}`);
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToSupabase = async () => {
    if (!project?.id || !selectedOption?.id || !selectedScenario?.id) {
      setExportStatus('❌ Missing project, option, or scenario');
      return;
    }

    if (frameCount === 0) {
      setExportStatus('❌ No frames to save');
      return;
    }

    setIsSaving(true);
    setExportStatus('⏳ Saving to database...');

    try {
      const result = await recordingManager.saveToSupabase();
      
      if (result.success) {
        setExportStatus(`✅ Saved to database`);
        
        // Reset after successful save
        setTimeout(() => {
          recordingManager.clear();
          setFrameCount(0);
          setDuration(0);
          setExportStatus('');
        }, 2000);
      } else {
        setExportStatus(`❌ Save failed: ${result.error}`);
      }
    } catch (error) {
      setExportStatus(`❌ Save failed: ${error.message}`);
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    recordingManager.clear();
    setFrameCount(0);
    setDuration(0);
    setExportStatus('');
  };

  const handleVisualizationToggle = (checked) => {
    setShowVisualization(checked);
    visualizationState = checked;
  };

  return (
    <div className="recording-panel">
      {project && (
        <div className="project-info">
          <h4>{project.name}</h4>
          {selectedOption && (
            <p className="text-xs text-text-muted">
              {selectedOption.name} {selectedScenario && `• ${selectedScenario.name}`}
            </p>
          )}
        </div>
      )}

      <div className="recording-header">
        <h3>Recording Control</h3>
      </div>

      <div className="recording-stats">
        <div className="stat">
          <span className="stat-label">Frames:</span>
          <span className="stat-value">{frameCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Duration:</span>
          <span className="stat-value">{duration.toFixed(1)}s</span>
        </div>
        <div className="stat">
          <span className="stat-label">Mode:</span>
          <span className="stat-value">{isVRMode ? 'VR' : 'PC'}</span>
        </div>
        {selectedOption && (
          <div className="stat">
            <span className="stat-label">Option:</span>
            <span className="stat-value">{selectedOption.name}</span>
          </div>
        )}
        {selectedScenario && (
          <div className="stat">
            <span className="stat-label">Scenario:</span>
            <span className="stat-value">{selectedScenario.name}</span>
          </div>
        )}
      </div>

      <div className="visualization-toggle">
        <label>
          <input
            type="checkbox"
            checked={showVisualization}
            onChange={(e) => handleVisualizationToggle(e.target.checked)}
            disabled={!isRecording}
          />
          <span>Show Gaze Points</span>
        </label>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#3399ff' }}></div>
            <span>Position</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff3366' }}></div>
            <span>Hit Points</span>
          </div>
        </div>
      </div>

      <div className="recording-controls">
        {!isRecording ? (
          <button
            className="btn btn-start"
            onClick={handleStartRecording}
            disabled={isExporting}
          >
            Start Recording
          </button>
        ) : (
          <button className="btn btn-stop" onClick={handleStopRecording}>
            Stop Recording
          </button>
        )}

        {frameCount > 0 && !isRecording && (
          <>
            <button
              className="btn btn-save"
              onClick={handleSaveToSupabase}
              disabled={isSaving || isExporting}
              title="Save recording to Supabase"
            >
              {isSaving ? 'Saving...' : 'Save to Database'}
            </button>
            <button
              className="btn btn-export"
              onClick={handleExport}
              disabled={isExporting || isSaving}
            >
              {isExporting ? 'Exporting...' : 'Export GLB'}
            </button>
            <button
              className="btn btn-clear"
              onClick={handleClear}
              disabled={isExporting || isSaving}
            >
              Clear
            </button>
          </>
        )}
      </div>

      {exportStatus && (
        <div className={`export-status ${exportStatus.includes('✅') ? 'success' : exportStatus.includes('❌') ? 'error' : 'loading'}`}>
          {exportStatus}
        </div>
      )}

      {/* Export visualization state for Scene component */}
      <div style={{ display: 'none' }} data-show-visualization={showVisualization} />
    </div>
  );
}

// Export getter for visualization state
export function getVisualizationState() {
  return visualizationState;
}

export default Recording;
