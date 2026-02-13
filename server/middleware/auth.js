const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 1, success: false, message: 'Unauthorized' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 1, success: false, message: 'Unauthorized' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 1, success: false, message: 'Forbidden' });
  }
  next();
};

module.exports = { requireAuth, requireAdmin };
