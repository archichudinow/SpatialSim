import { useAppState } from '../../AppState';

/**
 * PlaybackControls
 * Floating UI for playback speed controls
 */
export default function PlaybackControls() {
  const speed = useAppState((s) => s.playback.speed);
  const setSpeed = useAppState((s) => s.actions.playback.setSpeed);
  const togglePlay = useAppState((s) => s.actions.playback.togglePlay);
  const isPlaying = useAppState((s) => s.playback.isPlaying);
  const maxTime = useAppState((s) => s.playback.maxTime);
  const clampStartTime = useAppState((s) => s.playback.clampStartTime);
  const clampEndTime = useAppState((s) => s.playback.clampEndTime);
  const loop = useAppState((s) => s.playback.loop);
  const setClampStartTime = useAppState((s) => s.actions.playback.setClampStartTime);
  const setClampEndTime = useAppState((s) => s.actions.playback.setClampEndTime);
  const setLoop = useAppState((s) => s.actions.playback.setLoop);

  const speedPresets = [
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1.0 },
    { label: '2x', value: 2.0 },
    { label: '4x', value: 4.0 },
    { label: '10x', value: 10.0 }
  ];

  return (
    <div className="fixed bottom-5 left-5 bg-bg-overlay border border-border rounded-md p-panel z-[999] font-mono text-sm text-text-primary min-w-[280px]">
      {/* Header */}
      <div className="mb-2 font-bold text-base text-text-accent">
        ⏱️ Playback Speed
      </div>

      {/* Speed Display */}
      <div className="mb-section p-2 bg-black/30 rounded-sm flex justify-between items-center">
        <span>Current:</span>
        <span className="text-text-warning font-bold text-lg">
          {speed.toFixed(2)}x
        </span>
      </div>

      {/* Speed Preset Buttons */}
      <div className="grid grid-cols-3 gap-1.5 mb-section">
        {speedPresets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => setSpeed(preset.value)}
            className={`
              py-1.5 px-2 rounded-sm cursor-pointer text-xs font-mono transition-all
              ${Math.abs(speed - preset.value) < 0.01
                ? 'bg-bg-active border border-border-active font-bold'
                : 'bg-bg-hover border border-border hover:bg-bg-active/50 hover:border-border-active'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Speed Input */}
      <div className="mb-section flex gap-1.5 items-center">
        <label className="text-xs text-text-secondary min-w-[50px]">
          Custom:
        </label>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-bg-tertiary rounded-sm outline-none cursor-pointer"
        />
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`
          w-full p-2 rounded-sm cursor-pointer text-sm font-mono font-bold transition-all mb-3
          ${isPlaying
            ? 'bg-accent-green/20 border border-accent-green text-accent-green hover:opacity-80'
            : 'bg-accent-red/20 border border-accent-red text-accent-red hover:opacity-80'
          }
        `}
      >
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>

      {/* Time Clamping Section */}
      <div className="mt-3 pt-3 border-t border-border-light">
        <div className="mb-2 font-bold text-sm text-text-accent">
          🎯 Time Range
        </div>

        {/* Start Time */}
        <div className="mb-2 flex gap-1.5 items-center">
          <label className="text-xs text-text-secondary min-w-[45px]">
            Start:
          </label>
          <input
            type="range"
            min="0"
            max={maxTime}
            step="0.1"
            value={clampStartTime}
            onChange={(e) => setClampStartTime(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-bg-tertiary rounded-sm outline-none cursor-pointer"
          />
          <span className="text-xs text-text-warning min-w-[40px] text-right">
            {clampStartTime.toFixed(1)}s
          </span>
        </div>

        {/* End Time */}
        <div className="mb-2 flex gap-1.5 items-center">
          <label className="text-xs text-text-secondary min-w-[45px]">
            End:
          </label>
          <input
            type="range"
            min="0"
            max={maxTime}
            step="0.1"
            value={clampEndTime !== null ? clampEndTime : maxTime}
            onChange={(e) => setClampEndTime(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-bg-tertiary rounded-sm outline-none cursor-pointer"
          />
          <span className="text-xs text-text-warning min-w-[40px] text-right">
            {(clampEndTime !== null ? clampEndTime : maxTime).toFixed(1)}s
          </span>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            setClampStartTime(0);
            setClampEndTime(null);
          }}
          className="w-full py-1 bg-white/5 border border-border text-text-secondary rounded-sm cursor-pointer text-xxs font-mono transition-all mb-2 hover:bg-bg-hover hover:text-text-primary"
        >
          Reset Range
        </button>

        {/* Loop Toggle */}
        <div
          className={`
            flex items-center gap-2 p-1.5 rounded-sm border cursor-pointer transition-all
            ${loop
              ? 'bg-accent-blue/10 border-accent-blue/30'
              : 'bg-black/20 border-border-light'
            }
            hover:${loop ? 'bg-accent-blue/20' : 'bg-bg-hover'}
          `}
          onClick={() => setLoop(!loop)}
        >
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
            className="cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <label className={`text-xs cursor-pointer select-none ${loop ? 'text-text-accent' : 'text-text-secondary'}`}>
            🔁 Loop Playback
          </label>
        </div>
      </div>
    </div>
  );
}
