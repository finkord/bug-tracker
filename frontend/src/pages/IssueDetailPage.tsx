import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IssueDetailView } from '../components/issue-detail/index.js';

export const IssueDetailPage: React.FC = () => {
  const { key, id } = useParams<{ key?: string; id?: string }>();
  const issueKeyOrId = key || id;
  const navigate = useNavigate();

  useEffect(() => {
    if (!issueKeyOrId) {
      navigate('/projects');
    }
  }, [issueKeyOrId, navigate]);

  if (!issueKeyOrId) return null;

  return <IssueDetailView issueKeyOrId={issueKeyOrId} />;
};

export default IssueDetailPage;
