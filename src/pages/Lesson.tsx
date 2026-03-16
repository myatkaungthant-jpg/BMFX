import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { LessonPlayer } from '../components/LessonPlayer';
import { CheckCircle, FileText, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { LESSONS_DATA } from '../constants';

interface LessonContent {
  id: string;
  title: string;
  video_url: string;
  description: string;
}

interface Resource {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
}

export function Lesson() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);

  const [hasNextLesson, setHasNextLesson] = useState(false);

  useEffect(() => {
    if (courseId && lessonId) {
      fetchLessonAndProgress();
      checkNextLesson();
    }
  }, [profile, courseId, lessonId]);

  const checkNextLesson = async () => {
    if (!courseId || !lessonId) return;
    const nextId = (parseInt(lessonId) + 1).toString();
    const { data } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('order_index', parseInt(nextId))
      .maybeSingle();
    setHasNextLesson(!!data);
  };

  const fetchLessonAndProgress = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Lesson Content from Supabase
      const { data: dbLesson, error: dbError } = await supabase
        .from('lessons')
        .select('id, title, video_url, description')
        .eq('course_id', courseId)
        .eq('order_index', parseInt(lessonId || '0'))
        .maybeSingle();

      if (dbError) {
        console.error('Error fetching lesson from DB:', dbError);
      }

      if (dbLesson) {
        setLessonContent(dbLesson);
        
        // Fetch Resources for this lesson
        const { data: resData } = await supabase
          .from('lesson_resources')
          .select('id, title, file_url, file_type')
          .eq('lesson_id', dbLesson.id);
        
        setResources(resData || []);
      } else {
        // Fallback to constants
        const fallback = LESSONS_DATA[courseId || '']?.[lessonId || ''];
        if (fallback) {
          setLessonContent({
            id: `${courseId}-${lessonId}`, // Temporary ID for fallback
            title: fallback.title,
            video_url: fallback.videoUrl,
            description: fallback.description
          });
        }
        setResources([]);
      }

      // 2. Fetch Progress if logged in and we have a lesson ID
      if (profile && (dbLesson?.id || lessonId)) {
        const { data: progress, error: progressError } = await supabase
          .from('user_progress')
          .select('is_completed')
          .eq('user_id', profile.id)
          .eq('lesson_id', dbLesson?.id || lessonId)
          .maybeSingle();

        if (progressError && progressError.code !== 'PGRST116') throw progressError;
        setIsCompleted(progress?.is_completed || false);
      }
    } catch (error) {
      console.error('Error fetching lesson data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompletion = async () => {
    if (!profile || !lessonContent?.id) return;
    
    setUpdating(true);
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: profile.id,
          lesson_id: lessonContent.id,
          is_completed: newStatus,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id, lesson_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating progress:', error);
      setIsCompleted(!newStatus);
    } finally {
      setUpdating(false);
    }
  };

  const nextLessonId = (parseInt(lessonId || '0') + 1).toString();

  if (loading && !lessonContent) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-[#7AB8E5] dark:text-emerald-500" size={40} />
        </div>
      </Layout>
    );
  }

  const displayData = lessonContent || {
    title: 'Lesson Not Found',
    video_url: '',
    description: 'This lesson content is currently being prepared.'
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/courses" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm font-medium flex items-center gap-1 transition-colors">
            <ChevronLeft size={16} />
            Back to Curriculum
          </Link>
          
          <div className="flex items-center gap-2">
            {hasNextLesson && (
              <button 
                onClick={() => navigate(`/courses/${courseId}/lessons/${nextLessonId}`)}
                className="flex items-center gap-1 text-sm font-medium text-[#7AB8E5] dark:text-emerald-500 hover:text-[#9CD5FF] dark:hover:text-emerald-400 transition-colors"
              >
                Next Lesson
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{displayData.title}</h1>
            <p className="text-zinc-600 dark:text-zinc-400 capitalize">
              {courseId?.replace('-', ' ')} Module • Lesson {lessonId}
            </p>
          </div>
          <button 
            onClick={toggleCompletion}
            disabled={loading || updating}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              isCompleted 
                ? 'bg-[#9CD5FF]/10 dark:bg-emerald-500/10 text-[#7AB8E5] dark:text-emerald-500 border border-[#9CD5FF]/50 dark:border-emerald-500/50' 
                : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100'
            } disabled:opacity-50`}
          >
            {updating ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <CheckCircle size={20} className={isCompleted ? 'text-[#7AB8E5] dark:text-emerald-500' : 'text-zinc-400'} />
            )}
            {isCompleted ? 'Completed' : 'Mark as Complete'}
          </button>
        </div>

        <div className="mb-8 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black shadow-2xl">
          {displayData.video_url ? (
            <LessonPlayer 
              lessonId={lessonContent?.id || `${courseId}-${lessonId}`}
              title={displayData.title}
              videoUrl={displayData.video_url}
              initialProgress={0}
            />
          ) : (
            <div className="aspect-video flex items-center justify-center text-zinc-500">
              Video content coming soon...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4">About this Lesson</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {displayData.description}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="text-[#9CD5FF] dark:text-emerald-500" size={20} />
                Resources
              </h2>
              <div className="space-y-3">
                {resources.length > 0 ? (
                  resources.map((res) => (
                    <a 
                      key={res.id}
                      href={res.file_url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-[#9CD5FF] dark:hover:border-emerald-500 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-zinc-400 group-hover:text-[#7AB8E5] dark:group-hover:text-emerald-500" />
                        <span className="text-sm font-medium">{res.title}</span>
                      </div>
                      <Download size={16} className="text-zinc-400" />
                    </a>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-zinc-500 bg-white dark:bg-zinc-950/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    No additional resources for this lesson.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
