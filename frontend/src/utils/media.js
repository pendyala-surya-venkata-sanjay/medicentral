import { getApiOrigin } from '../api/axios';

export const resolveUploadUrl = (reportUrl) => {
  if (!reportUrl) return null;
  if (reportUrl.startsWith('http')) return reportUrl;

  let path = reportUrl;
  if (path.startsWith('/uploads/')) {
    path = path.slice('/uploads/'.length);
  } else if (path.startsWith('/')) {
    path = path.slice(1);
  }

  const origin = getApiOrigin();
  return `${origin}/api/uploads/${path}`;
};
