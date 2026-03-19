import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { CheckCircle, Lock, PlayCircle, ChevronRight, Loader2, Pencil, X, Save, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { AnimatePresence } from 'motion/react';
import { Toast } from '../components/Toast';

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  order_index: number;
}

interface Lesson {
  id: string;
  course_id: string;
  lesson_id: string;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
}

export function Courses() {
  const { profile, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, [profile?.id, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (coursesError) throw coursesError;
      setCourses(coursesData);

      // Fetch Lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (lessonsError) throw lessonsError;
      setLessons(lessonsData);

      // Fetch Progress if profile exists
      if (profile) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('course_id, lesson_id')
          .eq('user_id', profile.id)
          .eq('is_completed', true);

        if (progressError) throw progressError;
        const completedSet = new Set(progressData.map(p => `${p.course_id}-${p.lesson_id}`));
        setCompletedLessons(completedSet);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('courses')
        .update({
          title: editingCourse.title,
          description: editingCourse.description,
          level: editingCourse.level,
          duration: editingCourse.duration,
        })
        .eq('id', editingCourse.id);

      if (error) throw error;
      
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? editingCourse : c));
      setEditingCourse(null);
      setToast({ message: 'Module updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating course:', error);
      setToast({ message: 'Failed to update module.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('lessons')
        .update({
          title: editingLesson.title,
          description: editingLesson.description,
          video_url: editingLesson.video_url,
        })
        .eq('id', editingLesson.id);

      if (error) throw error;
      
      setLessons(prev => prev.map(l => l.id === editingLesson.id ? editingLesson : l));
      setEditingLesson(null);
      setToast({ message: 'Lesson updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating lesson:', error);
      setToast({ message: 'Failed to update lesson.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this module and all its lessons? This action cannot be undone.')) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setLessons(prev => prev.filter(l => l.course_id !== courseId));
      setToast({ message: 'Module deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting course:', error);
      setToast({ message: 'Failed to delete module.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      setToast({ message: 'Lesson deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting lesson:', error);
      setToast({ message: 'Failed to delete lesson.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Curriculum</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Master the markets with our step-by-step training modules.</p>
          </div>
          {isAdmin && (
            <Link 
              to="/admin?action=add-module" 
              className="flex items-center justify-center gap-2 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/10 dark:shadow-emerald-500/10"
            >
              <Plus size={18} />
              Add Module
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#9CD5FF] dark:text-emerald-500" size={40} />
          </div>
        ) : (
          <div className="space-y-12 pb-20">
            {courses.map((course) => {
              const courseLessons = lessons
                .filter(l => l.course_id === course.id)
                .sort((a, b) => parseInt(a.lesson_id) - parseInt(b.lesson_id));
              
              const completedInCourse = courseLessons.filter((l) => completedLessons.has(`${course.id}-${l.lesson_id}`)).length;
              const progressPercentage = courseLessons.length > 0 
                ? Math.round((completedInCourse / courseLessons.length) * 100)
                : 0;

              return (
                <div key={course.id} className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-[#9CD5FF]/10 dark:bg-emerald-500/10 text-[#7AB8E5] dark:text-emerald-500 text-xs font-bold rounded uppercase tracking-wider">
                          {course.level}
                        </span>
                        <span className="text-zinc-400 text-xs">•</span>
                        <span className="text-zinc-500 text-xs font-medium">{course.duration}</span>
                        {isAdmin && (
                          <div className="flex items-center gap-1 ml-2">
                            <button 
                              onClick={() => setEditingCourse(course)}
                              className="p-1 text-zinc-400 hover:text-[#7AB8E5] dark:hover:text-emerald-500 transition-colors"
                              title="Edit Module"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCourse(course.id)}
                              className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                              title="Delete Module"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold">{course.title}</h2>
                      <p className="text-zinc-600 dark:text-zinc-400 mt-1">{course.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm font-bold text-zinc-900 dark:text-white">
                        {progressPercentage}% Complete
                      </div>
                      <div className="w-48 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#9CD5FF] dark:bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {courseLessons.map((lesson) => {
                      const id = lesson.lesson_id;
                      const isCompleted = completedLessons.has(`${course.id}-${id}`);
                      const lessonIndex = parseInt(id);
                      // Admin has everything unlocked. 
                      // For students: first lesson is always unlocked, others unlocked if previous is completed
                      const isUnlocked = (isAdmin || lessonIndex === 1 || completedLessons.has(`${course.id}-${lessonIndex - 1}`)) && profile?.role !== 'free';

                      return (
                        <Link 
                          key={lesson.id}
                          to={isUnlocked ? `/courses/${course.id}/lessons/${id}` : '#'}
                          className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                            isUnlocked 
                              ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-[#9CD5FF] dark:hover:border-emerald-500 hover:shadow-md' 
                              : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 opacity-60 cursor-not-allowed'
                          }`}
                          onClick={(e) => !isUnlocked && e.preventDefault()}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                              isCompleted 
                                ? 'bg-[#9CD5FF]/20 dark:bg-emerald-500/20 text-[#7AB8E5] dark:text-emerald-500' 
                                : isUnlocked 
                                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-[#9CD5FF]/10 dark:group-hover:bg-emerald-500/10 group-hover:text-[#7AB8E5] dark:group-hover:text-emerald-500' 
                                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
                            }`}>
                              {isCompleted ? <CheckCircle size={20} /> : isUnlocked ? <PlayCircle size={20} /> : <Lock size={20} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm md:text-base">{lesson.title}</h3>
                                {isAdmin && (
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditingLesson(lesson);
                                      }}
                                      className="p-1 text-zinc-400 hover:text-[#7AB8E5] dark:hover:text-emerald-500 transition-colors"
                                      title="Edit Lesson"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteLesson(lesson.id);
                                      }}
                                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                      title="Delete Lesson"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500">Lesson {id}</p>
                            </div>
                          </div>
                          {isUnlocked && (
                            <ChevronRight size={18} className="text-zinc-300 group-hover:text-[#7AB8E5] dark:group-hover:text-emerald-500 transition-colors" />
                          )}
                        </Link>
                      );
                    })}
                    
                    {isAdmin && (
                      <Link 
                        to={`/admin?action=add-lesson&courseId=${course.id}`}
                        className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-[#7AB8E5] dark:hover:text-emerald-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all font-medium text-sm"
                      >
                        <Plus size={16} />
                        Add Lesson to this Module
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Module Modal */}
        <AnimatePresence>
          {editingCourse && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div 
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Edit Module</h3>
                  <button 
                    onClick={() => setEditingCourse(null)}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleUpdateCourse} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Module Title</label>
                    <input 
                      type="text"
                      value={editingCourse.title}
                      onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                    <textarea 
                      value={editingCourse.description}
                      onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 transition-all min-h-[100px] resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Level</label>
                      <select 
                        value={editingCourse.level}
                        onChange={(e) => setEditingCourse({...editingCourse, level: e.target.value})}
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 transition-all"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Duration</label>
                      <input 
                        type="text"
                        value={editingCourse.duration}
                        onChange={(e) => setEditingCourse({...editingCourse, duration: e.target.value})}
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 transition-all"
                        placeholder="e.g. 4h 20m"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setEditingCourse(null)}
                      className="flex-1 px-6 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </AnimatePresence>
        {/* Edit Lesson Modal */}
        <AnimatePresence>
          {editingLesson && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div 
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Edit Lesson</h3>
                  <button 
                    onClick={() => setEditingLesson(null)}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleUpdateLesson} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Lesson Title</label>
                    <input 
                      type="text"
                      value={editingLesson.title}
                      onChange={(e) => setEditingLesson({...editingLesson, title: e.target.value})}
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Video URL</label>
                    <input 
                      type="url"
                      value={editingLesson.video_url}
                      onChange={(e) => setEditingLesson({...editingLesson, video_url: e.target.value})}
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                    <textarea 
                      value={editingLesson.description}
                      onChange={(e) => setEditingLesson({...editingLesson, description: e.target.value})}
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 transition-all min-h-[100px] resize-none"
                      required
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setEditingLesson(null)}
                      className="flex-1 px-6 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
