import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Student Layout & Pages
import { StudentLayout } from './components/layout/StudentLayout';
import { StudentHome } from './pages/student/StudentHome';
import { StudentLessons } from './pages/student/StudentLessons';
import { StudentLessonDetail } from './pages/student/StudentLessonDetail';
import { StudentTasks } from './pages/student/StudentTasks';
import { StudentTaskDetail } from './pages/student/StudentTaskDetail';
import { StudentResults } from './pages/student/StudentResults';
import { StudentResultDetail } from './pages/student/StudentResultDetail';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentNotifications } from './pages/student/StudentNotifications';

// Teacher Layout & Pages
import { TeacherLayout } from './components/layout/TeacherLayout';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherLessonsList } from './pages/teacher/TeacherLessonsList';
import { TeacherLessonBuilder } from './pages/teacher/TeacherLessonBuilder';
import { TeacherPendingReviews } from './pages/teacher/TeacherPendingReviews';
import { TeacherReviewSubmission } from './pages/teacher/TeacherReviewSubmission';
import { TeacherAssignmentsList } from './pages/teacher/TeacherAssignmentsList';
import { TeacherAssignmentBuilder } from './pages/teacher/TeacherAssignmentBuilder';
import { TeacherStudentsList } from './pages/teacher/TeacherStudentsList';
import { TeacherStudentProfile } from './pages/teacher/TeacherStudentProfile';
import { TeacherGroups } from './pages/teacher/TeacherGroups';
import { TeacherAnalytics } from './pages/teacher/TeacherAnalytics';
import { TeacherSubmissionsList } from './pages/teacher/TeacherSubmissionsList';
import { TeacherVocabulary } from './pages/teacher/TeacherVocabulary';
import { TeacherSettings } from './pages/teacher/TeacherSettings';

// Auth Components
import { PremiumLoadingScreen } from './components/auth/PremiumLoadingScreen';
import { StudentLogin } from './pages/student/StudentLogin';

const RootRedirect: React.FC = () => {
  const { role, user } = useAuth();
  if (role === 'TEACHER' || role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/app" replace />;
};

const StudentRouteWrapper: React.FC = () => {
  const { user, isLoading, initError, retryInit } = useAuth();

  if (isLoading) {
    return <PremiumLoadingScreen error={initError} onRetry={retryInit} />;
  }

  if (!user) {
    return <StudentLogin />;
  }

  return <StudentLayout />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            {/* Student Telegram WebApp Routes with Auth Guard */}
            <Route path="/app" element={<StudentRouteWrapper />}>
              <Route index element={<StudentHome />} />
              <Route path="lessons" element={<StudentLessons />} />
              <Route path="lessons/:id" element={<StudentLessonDetail />} />
              <Route path="tasks" element={<StudentTasks />} />
              <Route path="tasks/:id" element={<StudentTaskDetail />} />
              <Route path="results" element={<StudentResults />} />
              <Route path="results/:submissionId" element={<StudentResultDetail />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="notifications" element={<StudentNotifications />} />
            </Route>

            {/* Teacher & Admin Panel Routes */}
            <Route path="/admin" element={<TeacherLayout />}>
              <Route index element={<TeacherDashboard />} />
              <Route path="lessons" element={<TeacherLessonsList />} />
              <Route path="lessons/new" element={<TeacherLessonBuilder />} />
              <Route path="lessons/:id/edit" element={<TeacherLessonBuilder />} />
              <Route path="pending-reviews" element={<TeacherPendingReviews />} />
              <Route path="submissions" element={<TeacherSubmissionsList />} />
              <Route path="submissions/:id" element={<TeacherReviewSubmission />} />
              <Route path="assignments" element={<TeacherAssignmentsList />} />
              <Route path="assignments/new" element={<TeacherAssignmentBuilder />} />
              <Route path="assignments/:id/edit" element={<TeacherAssignmentBuilder />} />
              <Route path="students" element={<TeacherStudentsList />} />
              <Route path="students/:id" element={<TeacherStudentProfile />} />
              <Route path="groups" element={<TeacherGroups />} />
              <Route path="analytics" element={<TeacherAnalytics />} />
              <Route path="vocabulary" element={<TeacherVocabulary />} />
              <Route path="audit-logs" element={<TeacherSettings />} />
              <Route path="settings" element={<TeacherSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
