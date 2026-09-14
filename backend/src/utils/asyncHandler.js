export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const issueTitle = (issue) => (issue ? `${issue.year}-yil ${issue.number}-son` : '');
