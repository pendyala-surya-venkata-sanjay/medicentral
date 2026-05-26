import { AuditService } from '../modules/audit/audit.service.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 });
    const tenantId = req.query.tenantId || req.tenant?._id;
    const branchId = req.query.branchId || req.branch?._id;

    const result = await AuditService.list({
      tenantId,
      branchId,
      action: req.query.action,
      page,
      limit,
    });

    res.json(paginatedResponse(result.items, { page, limit, total: result.total }));
  } catch (error) {
    next(error);
  }
};

export default { listAuditLogs };
