import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { BookOpen, CheckCircle, PlayCircle, ChevronRight, Loader2, TrendingUp, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { LESSONS_DATA } from '../constants';

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    completedLessons: 0,
    totalLessons: 0,
    progress: 0
  });
  const [nextLesson, setNextLesson] = useState<{ courseId: string, lessonId: string, title: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch total lessons from Supabase
      const { count: total, error: totalError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;
      
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('course_id, lesson_id')
        .eq('user_id', profile!.id)
        .eq('is_completed', true);

      if (progressError) throw progressError;

      const completedCount = progressData.length;
      const totalCount = total || 0;
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      setStats({
        completedLessons: completedCount,
        totalLessons: totalCount,
        progress: progressPercent
      });

      // Find next lesson to resume from Supabase
      const { data: allLessons, error: allLessonsError } = await supabase
        .from('lessons')
        .select('id, course_id, lesson_id, title, order_index')
        .order('order_index', { ascending: true });
      
      if (allLessonsError) throw allLessonsError;

      const next = allLessons.find(l => !progressData.some(p => p.course_id === l.course_id && p.lesson_id === l.lesson_id));
      if (next) {
        setNextLesson({
          courseId: next.course_id,
          lessonId: next.lesson_id,
          title: next.title
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#9CD5FF] dark:text-emerald-500" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name?.split(' ')[0] || 'Trader'}!</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Track your progress and continue your trading journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 font-medium">Overall Progress</p>
                <p className="text-2xl font-bold">{stats.progress}%</p>
              </div>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
              <div 
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 font-medium">Lessons Completed</p>
                <p className="text-2xl font-bold">{stats.completedLessons} / {stats.totalLessons}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                <Award className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 font-medium">Current Rank</p>
                <p className="text-2xl font-bold">Student</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {nextLesson ? (
              <div className="bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl p-8 relative overflow-hidden shadow-xl group">
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 bg-white/20 dark:bg-black/10 text-xs font-bold rounded-full mb-4 backdrop-blur-sm">
                    RESUME LEARNING
                  </span>
                  <h2 className="text-3xl font-bold mb-2">{nextLesson.title}</h2>
                  <p className="text-zinc-400 dark:text-zinc-500 mb-6 max-w-md capitalize">
                    {nextLesson.courseId.replace('-', ' ')} Module • Lesson {nextLesson.lessonId}
                  </p>
                  <Link 
                    to={`/courses/${nextLesson.courseId}/lessons/${nextLesson.lessonId}`}
                    className="inline-flex items-center gap-2 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105"
                  >
                    <PlayCircle size={20} />
                    Continue Lesson
                  </Link>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7AB8E5]/20 dark:bg-emerald-500/20 blur-3xl -mr-20 -mt-20 rounded-full group-hover:bg-[#7AB8E5]/30 dark:group-hover:bg-emerald-500/30 transition-colors" />
              </div>
            ) : (
              <div className="bg-emerald-500 text-white rounded-2xl p-8 shadow-xl">
                <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
                <p className="mb-6 opacity-90">You have completed all available lessons. Stay tuned for more content!</p>
                <Link to="/courses" className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold transition-all hover:bg-zinc-100">
                  Browse Curriculum
                </Link>
              </div>
            )}

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="text-[#9CD5FF] dark:text-emerald-500" size={20} />
                Recent Announcements
              </h2>
              <div className="space-y-6">
                <div className="border-l-2 border-[#9CD5FF] dark:border-emerald-500 pl-4 py-1">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">March 15, 2026</p>
                  <h3 className="font-bold mb-1">New Alpha Module Lessons Added</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">We've just released three new lessons covering advanced liquidity concepts. Check them out in the curriculum!</p>
                </div>
                <div className="border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 py-1">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">March 10, 2026</p>
                  <h3 className="font-bold mb-1">Community Call Recording</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">The recording of our last weekly market breakdown is now available in the resources section.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BookOpen className="text-[#9CD5FF] dark:text-emerald-500" size={20} />
                Quick Links
              </h2>
              <div className="space-y-3">
                <Link to="/courses" className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-[#9CD5FF] dark:hover:border-emerald-500 transition-colors">
                  <span className="text-sm font-medium">Curriculum</span>
                  <ChevronRight size={16} className="text-zinc-400" />
                </Link>
                <Link to="/feed" className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-[#9CD5FF] dark:hover:border-emerald-500 transition-colors">
                  <span className="text-sm font-medium">Community Feed</span>
                  <ChevronRight size={16} className="text-zinc-400" />
                </Link>
                <Link to="/resources" className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-[#9CD5FF] dark:hover:border-emerald-500 transition-colors">
                  <span className="text-sm font-medium">Trading Resources</span>
                  <ChevronRight size={16} className="text-zinc-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
