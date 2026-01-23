import { useEffect, useState } from 'react';
import { useAppState } from '../AppState';

interface LoadingScreenProps {
  visible: boolean;
  projectName?: string;
  projectDescription?: string;
}

export default function LoadingScreen({ visible, projectName, projectDescription }: LoadingScreenProps) {
  const [show, setShow] = useState(visible);
  const [fade, setFade] = useState(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const loadingMessage = useAppState((state) => state.data.loadingMessage);

  useEffect(() => {
    if (!visible) {
      // Loading is complete, show the button
      setIsLoadingComplete(true);
    } else {
      setShow(true);
      setFade(false);
      setIsLoadingComplete(false);
    }
  }, [visible]);

  const handleOpenDemo = () => {
    setFade(true);
    const timer = setTimeout(() => setShow(false), 200);
    return () => clearTimeout(timer);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 flex flex-col justify-center items-center bg-bg-primary z-[9999] transition-opacity duration-200 ${fade ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Project Name */}
      {projectName && (
        <div className={`text-text-primary text-2xl font-normal text-center mb-3 transition-opacity duration-200 ${fade ? 'opacity-0' : 'opacity-100'}`}>
          {projectName}
        </div>
      )}

      {/* Project Description */}
      {projectDescription && (
        <div className={`text-text-secondary text-base font-light text-center mb-20 max-w-lg transition-opacity duration-200 ${fade ? 'opacity-0' : 'opacity-100'}`}>
          {projectDescription}
        </div>
      )}

      {/* Bottom: Loading Status or Open Demo Button */}
      <div
        className={`absolute bottom-24 left-1/2 -translate-x-1/2 transition-opacity duration-200 ${fade ? 'opacity-0' : 'opacity-100'}`}
      >
        {isLoadingComplete ? (
          <button
            onClick={handleOpenDemo}
            className="px-8 py-3 text-sm font-normal text-text-primary bg-transparent border border-border-light rounded hover:bg-bg-hover transition-all duration-200"
          >
            Open Project
          </button>
        ) : (
          <div className="text-text-primary text-sm font-light text-center">
            {loadingMessage}
          </div>
        )}
      </div>
    </div>
  );
}
