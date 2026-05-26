export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  if (!name?.trim() || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (role && !['patient', 'doctor', 'staff'].includes(role)) {
    errors.push('Role must be patient, doctor, or hospital staff');
  }

  if (errors.length) {
    res.status(400);
    return next(new Error(errors.join('. ')));
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    res.status(400);
    return next(new Error('Email and password are required'));
  }
  next();
};

export const validatePrediction = (req, res, next) => {
  const { symptoms } = req.body;
  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    res.status(400);
    return next(new Error('At least one symptom is required'));
  }
  next();
};
