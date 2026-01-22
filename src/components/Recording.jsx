import { useState, useEffect } from 'react';
import recordingManager from '../utils/RecordingManager';
import GLBExporter from '../utils/GLBExporter';
import './Recording.css';

// Global state for visualization (shared with Scene)
let visualizationState = false;

export function Recording({ onFrameCapture }) {
  const [isRecording, setIsRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);

  // Recording metadata
  const [settings, setSettings] = useState({
    participant: 'P1',
    scenario: 'S1',
    color: '#FF5733',
  });

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
    recordingManager.startRecording(settings);
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
      GLBExporter.downloadGLB(glbBlob, data.metadata);
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

  const handleClear = () => {
    recordingManager.clear();
    setFrameCount(0);
    setDuration(0);
    setExportStatus('');
  };

  const handleSettingChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVisualizationToggle = (checked) => {
    setShowVisualization(checked);
    visualizationState = checked;
  };

  const participantOptions = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'];
  const scenarioOptions = ['S1', 'S1A', 'S1B', 'S2', 'S3', 'S4'];
  const colorOptions = [
    '#FF5733', // P1 - Red/Orange
    '#33FF57', // P2 - Green
    '#3357FF', // P3 - Blue
    '#FF33F5', // P4 - Magenta
    '#F5FF33', // P5 - Yellow
    '#33FFF5', // P6 - Cyan
    '#FF8C33', // P7 - Orange
    '#8C33FF', // P8 - Purple
    '#33FF8C', // P9 - Light Green
    '#FF3333', // P10 - Red
  ];

  return (
    <div className="recording-panel">
      <div className="recording-header">
        <h3>Recording Control</h3>
        <button
          className="settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
          disabled={isRecording}
          title="Recording settings"
        >
          ⚙️
        </button>
      </div>

      {showSettings && !isRecording && (
        <div className="recording-settings">
          <div className="setting-group">
            <label>Participant:</label>
            <select
              value={settings.participant}
              onChange={(e) => handleSettingChange('participant', e.target.value)}
            >
              {participantOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label>Scenario:</label>
            <select
              value={settings.scenario}
              onChange={(e) => handleSettingChange('scenario', e.target.value)}
            >
              {scenarioOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label>Color:</label>
            <select
              value={settings.color}
              onChange={(e) => handleSettingChange('color', e.target.value)}
            >
              {colorOptions.map((color) => (
                <option key={color} value={color}>
                  <span style={{ color }}>●</span> {color}
                </option>
              ))}
            </select>
            <div
              className="color-preview"
              style={{ backgroundColor: settings.color }}
            />
          </div>
        </div>
      )}

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
          <span className="stat-label">Participant:</span>
          <span className="stat-value">{settings.participant}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Scenario:</span>
          <span className="stat-value">{settings.scenario}</span>
        </div>
      </div>

      <div className="visualization-toggle">
        <label>
          <input
            type="checkbox"
            checked={showVisualization}
            onChange={(e) => handleVisualizationToggle(e.target.checked)}
            disabled={!isRecording}
          />
          <span>👁️ Show Gaze Points</span>
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
            🔴 Start Recording
          </button>
        ) : (
          <button className="btn btn-stop" onClick={handleStopRecording}>
            ⏹️ Stop Recording
          </button>
        )}

        {frameCount > 0 && !isRecording && (
          <>
            <button
              className="btn btn-export"
              onClick={handleExport}
              disabled={isExporting}
            >
              📥 Export GLB
            </button>
            <button
              className="btn btn-clear"
              onClick={handleClear}
              disabled={isExporting}
            >
              🗑️ Clear
            </button>
          </>
        )}
      </div>

      {exportStatus && (
        <div className={`export-status ${exportStatus.includes('✅') ? 'success' : exportStatus.includes('❌') ? 'error' : 'loading'}`}>
          {exportStatus}
        </div>
      )}

      <div className="recording-info">
        <p>📍 Record position (gaze origin) and lookAt (gaze focus) data</p>
        <p>💾 Export as GLB format with animation tracks</p>
        <p>👁️ Enable gaze point visualization while recording</p>
      </div>

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
