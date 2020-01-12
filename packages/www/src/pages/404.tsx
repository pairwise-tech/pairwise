import { useEffect } from 'react';
import { navigate } from 'gatsby';

/**
 * Redirect 404 routes to the index route.
 */
export default (): any => {
  useEffect(() => {
    navigate(`/?notify=${encodeURIComponent("404: That page doesn't exist")}`);
  }, []);
  return null;
};
