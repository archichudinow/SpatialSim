/**
 * Simple navigation hook to handle client-side routing
 * For production, consider using React Router
 */
export function useNavigate() {
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return navigate;
}

/**
 * Hook to get the current project ID from URL
 * @returns {string|null} Project UUID or null if on root
 */
export function useProjectId() {
  const path = window.location.pathname;
  
  // Match UUID pattern: /xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidPattern = /^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
  const match = path.match(uuidPattern);
  
  return match ? match[1] : null;
}
