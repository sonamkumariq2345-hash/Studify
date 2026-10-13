export const getDashboardPath = (user) => {
  if (!user || user.status !== 'approved') return '/login';

  switch (user.role) {
    case 'admin':
      return '/admin/dashboard';
    case 'dean':
      return '/dean/dashboard';
    case 'teacher':
      return '/teacher/dashboard';
    case 'student':
      return '/student/dashboard';
    default:
      return '/login';
  }
};
