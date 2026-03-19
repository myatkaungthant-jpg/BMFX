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
  const [nextLesson, setNextLesson] = useState<{ courseId: string, lessonId: string, title: string, isNew?: boolean } | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch total lessons count
      const { count: total, error: totalError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;
      
      // 2. Fetch user's completed progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('course_id, lesson_id, is_completed, updated_at')
        .eq('user_id', profile!.id);

      if (progressError) throw progressError;

      const completedLessons = progressData.filter(p => p.is_completed);
      const completedCount = completedLessons.length;
      const totalCount = total || 0;
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      setStats({
        completedLessons: completedCount,
        totalLessons: totalCount,
        progress: progressPercent
      });

      // 3. Find "Resume Learning" lesson
      // Fetch all lessons to have context
      const { data: allLessons, error: allLessonsError } = await supabase
        .from('lessons')
        .select('id, course_id, lesson_id, title, order_index')
        .order('order_index', { ascending: true });
      
      if (allLessonsError) throw allLessonsError;

      // Logic:
      // a. Find the lesson with the most recent updated_at in user_progress
      const mostRecentProgress = progressData.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];

      let targetLesson = null;

      if (mostRecentProgress) {
        if (mostRecentProgress.is_completed) {
          // If the most recent one is finished, find the next one in sequence (all modules)
          const currentIndex = allLessons.findIndex(l => l.course_id === mostRecentProgress.course_id && l.lesson_id === mostRecentProgress.lesson_id);
          targetLesson = allLessons[currentIndex + 1] || null;
        } else {
          // If it's not finished, resume it
          targetLesson = allLessons.find(l => l.course_id === mostRecentProgress.course_id && l.lesson_id === mostRecentProgress.lesson_id);
        }
      }

      // If no progress at all, show the first lesson ever
      if (!targetLesson && allLessons.length > 0) {
        targetLesson = { ...allLessons[0], isNew: true };
      }

      if (targetLesson) {
        setNextLesson({
          courseId: targetLesson.course_id,
          lessonId: targetLesson.lesson_id,
          title: targetLesson.title,
          isNew: (targetLesson as any).isNew
        });
      }

      // 4. Fetch Announcements (Admin posts + New Modules + New Lessons)
      await fetchAnnouncements();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      // Fetch recent admin posts
      const { data: posts } = await supabase
        .from('posts')
        .select('id, content, created_at')
        .eq('is_admin_post', true)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent modules
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      // Fetch recent lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, created_at, course_id')
        .order('created_at', { ascending: false })
        .limit(2);

      // Merge and sort
      const combined = [
        ...(posts?.map(p => ({ ...p, type: 'admin', title: 'Admin Update' })) || []),
        ...(courses?.map(c => ({ ...c, type: 'course', title: 'New Module', content: `Module "${c.title}" is now available. Get started now!` })) || []),
        ...(lessons?.map(l => ({ ...l, type: 'lesson', title: 'New Lesson', content: `New: "${l.title}" added to ${l.course_id.replace('-', ' ')} module.` })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAnnouncements(combined.slice(0, 4));
    } catch (err) {
      console.error('Error fetching announcements:', err);
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
                <p className="text-2xl font-bold">
                  {profile?.role === 'admin' ? 'Admin' : 
                   profile?.role === 'free' ? 'Free User' :
                   stats.completedLessons === 0 ? 'Student' :
                   stats.completedLessons < 3 ? 'Novice' :
                   stats.completedLessons < 8 ? 'Pro' : 'Elite'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {profile?.role === 'free' ? (
              <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl p-8 relative overflow-hidden shadow-xl">
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 bg-white/20 dark:bg-zinc-900/10 text-xs font-bold rounded-full mb-4 backdrop-blur-sm italic">
                    PREMIUM ACCESS
                  </span>
                  <h2 className="text-3xl font-bold mb-2">Unlock the Curriculum</h2>
                  <p className="text-zinc-400 dark:text-zinc-500 mb-6 max-w-md">
                    Become a Student member to access all 50+ professional trading lessons and start your journey.
                  </p>
                  <button className="inline-flex items-center gap-2 bg-[#7AB8E5] dark:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105">
                    Upgrade to Student
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7AB8E5]/20 dark:bg-emerald-500/10 blur-3xl -mr-20 -mt-20 rounded-full" />
              </div>
            ) : nextLesson ? (
              <div className="bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl p-8 relative overflow-hidden shadow-xl group">
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 bg-white/20 dark:bg-black/10 text-xs font-bold rounded-full mb-4 backdrop-blur-sm">
                    {nextLesson.isNew ? 'GET STARTED' : 'RESUME LEARNING'}
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
                    {nextLesson.isNew ? 'Start Lesson' : 'Continue Lesson'}
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
              <div className="max-h-[380px] overflow-y-auto pr-2 no-scrollbar">
                <div className="space-y-6">
                  {announcements.length > 0 ? announcements.map((ann, idx) => (
                    <div key={idx} className={`border-l-2 ${idx === 0 ? 'border-[#9CD5FF] dark:border-emerald-500' : 'border-zinc-200 dark:border-zinc-800'} pl-4 py-1`}>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">
                        {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <h3 className="font-bold mb-1">{ann.title}</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{ann.content}</p>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-zinc-500">
                      <p className="text-sm">No recent updates. Check back soon!</p>
                    </div>
                  )}
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
                <Link to="/community" className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-[#9CD5FF] dark:hover:border-emerald-500 transition-colors">
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
