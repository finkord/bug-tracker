import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * MyIssuesPage redirector.
 * My Issues has been unified directly into the main Personal Engineering Workspace on the Home page (/).
 */
export const MyIssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    navigate({ pathname: '/', search: location.search }, { replace: true });
  }, [navigate, location.search]);

  return null;
};
