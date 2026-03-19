import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  User, 
  Mail, 
  Loader2, 
  UploadCloud, 
  Plus, 
  X,
  BookOpen,
  FolderArchive
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import { Toast } from '../components/Toast';
import { AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student';
  created_at: string;
  progress_count?: number;
}

interface Course {
  id: string;
  title: string;
}

export function Admin() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [profile?.id, authLoading]);

  // New Lesson Form State
  const [newLesson, setNewLesson] = useState({
    course_id: '',
    lesson_id: '',
    title: '',
    description: '',
    video_url: ''
  });

  // New Module Form State
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModule, setNewModule] = useState({
    id: '',
    title: '',
    description: '',
    level: 'Beginner',
    duration: ''
  });

  // Resource Upload State
  const [resourceFile, setResourceFile] = useState<File | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  useEffect(() => {
    // Check for contextual redirects from Curriculum page
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const courseId = params.get('courseId');

    if (action === 'add-lesson') {
      setIsModalOpen(true);
      if (courseId) {
        setNewLesson(prev => ({ ...prev, course_id: courseId }));
      }
    } else if (action === 'add-module') {
      setIsModalOpen(true);
      setIsAddingModule(true);
    }
  }, [location.search, courses.length]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Fetch all completed progress counts
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('user_id')
        .eq('is_completed', true);

      if (progressError) throw progressError;

      // Calculate counts per user
      const progressMap: Record<string, number> = {};
      progressData?.forEach(p => {
        progressMap[p.user_id] = (progressMap[p.user_id] || 0) + 1;
      });

      const enrichedUsers = profileData?.map(u => ({
        ...u,
        progress_count: progressMap[u.id] || 0
      })) || [];

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
      
      // Default course and suggest next lesson ID
      if (data && data.length > 0) {
        const defaultCourseId = data[0].id;
        setNewLesson(prev => ({ ...prev, course_id: defaultCourseId }));
        suggestNextLessonId(defaultCourseId);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const suggestNextLessonId = async (courseId: string) => {
    if (!courseId) return;
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('lesson_id')
        .eq('course_id', courseId)
        .order('order_index', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastId = parseInt(data[0].lesson_id);
        const nextId = (isNaN(lastId) ? 1 : lastId + 1).toString();
        setNewLesson(prev => ({ ...prev, lesson_id: nextId }));
      } else {
        setNewLesson(prev => ({ ...prev, lesson_id: '1' }));
      }
    } catch (error) {
      console.error('Error suggesting lesson ID:', error);
    }
  };


  const handleUploadLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let finalCourseId = newLesson.course_id;

      // Create new module if needed
      if (isAddingModule) {
        if (!newModule.id || !newModule.title) {
          throw new Error('Module ID and Title are required');
        }
        
        const { error: moduleError } = await supabase
          .from('courses')
          .insert({
            id: newModule.id,
            title: newModule.title,
            description: newModule.description,
            level: newModule.level,
            duration: newModule.duration,
            order_index: courses.length + 1
          });

        if (moduleError) throw moduleError;
        finalCourseId = newModule.id;
        await fetchCourses(); // Refresh courses list
      }

      const lessonUUID = `${finalCourseId}-${newLesson.lesson_id}`;
      
      // 1. Upload Lesson to DB
      const { error: lessonError } = await supabase
        .from('lessons')
        .upsert({
          id: lessonUUID,
          course_id: finalCourseId,
          lesson_id: newLesson.lesson_id,
          title: newLesson.title,
          description: newLesson.description,
          video_url: newLesson.video_url,
          order_index: parseInt(newLesson.lesson_id)
        });

      if (lessonError) throw lessonError;

      // 2. Handle Resource File Upload if present
      if (resourceFile) {
        const fileExt = resourceFile.name.split('.').pop();
        const fileName = `${lessonUUID}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${finalCourseId}/${fileName}`;

        const { error: storageError, data: storageData } = await supabase.storage
          .from('lesson-resources')
          .upload(filePath, resourceFile);

        if (storageError) throw storageError;

        const { data: { publicUrl } } = supabase.storage
          .from('lesson-resources')
          .getPublicUrl(filePath);

        // 3. Create metadata in lesson_resources
        const { error: resourceError } = await supabase
          .from('lesson_resources')
          .insert({
            lesson_id: lessonUUID,
            title: resourceFile.name.split('.')[0] || 'Lesson Notes',
            file_url: publicUrl,
            file_type: fileExt,
            file_size: resourceFile.size
          });

        if (resourceError) throw resourceError;
      }
      
      setIsModalOpen(false);
      setIsAddingModule(false);
      setResourceFile(null);
      setNewLesson({
        course_id: courses[0]?.id || 'alpha',
        lesson_id: '',
        title: '',
        description: '',
        video_url: ''
      });
      setNewModule({
        id: '',
        title: '',
        description: '',
        level: 'Beginner',
        duration: ''
      });
      setToast({ message: 'Lesson and resources uploaded successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Error uploading lesson:', error);
      setToast({ message: error.message || 'Failed to upload lesson.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalStudents: users.filter(u => u.role === 'student').length,
    totalAdmins: users.filter(u => u.role === 'admin').length,
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Manage users and platform content.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 dark:shadow-emerald-500/20"
          >
            <UploadCloud size={20} />
            Upload Video
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 font-medium">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                <ShieldAlert className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 font-medium">Admins</p>
                <p className="text-2xl font-bold">{stats.totalAdmins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                <BookOpen className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 font-medium">Video Modules</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Module Overview Section */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FolderArchive className="text-[#9CD5FF] dark:text-emerald-500" size={24} />
            Module Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {courses.map(course => (
              <div key={course.id} className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Module</p>
                <p className="font-bold text-sm truncate mb-2">{course.title}</p>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium uppercase">
                  <span>ID: {course.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Student Progress</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 w-full md:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Loader2 className="animate-spin mx-auto text-zinc-400" size={24} />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      No users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{user.full_name || 'Anonymous'}</p>
                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                              <Mail size={12} />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin' 
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-bold text-[#7AB8E5] dark:text-emerald-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-tight">
                          {user.progress_count || 0} Lessons
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <UploadCloud className="text-[#9CD5FF] dark:text-emerald-500" size={24} />
                  Upload New Lesson
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-zinc-500" />
                </button>
              </div>
              
              <form onSubmit={handleUploadLesson} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Module</label>
                    <button 
                      type="button"
                      onClick={() => setIsAddingModule(!isAddingModule)}
                      className="text-xs font-bold text-[#7AB8E5] dark:text-emerald-500 hover:underline"
                    >
                      {isAddingModule ? 'Select Existing' : '+ Add New Module'}
                    </button>
                  </div>

                  {isAddingModule ? (
                    <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Module ID (slug)</label>
                          <input 
                            type="text"
                            placeholder="e.g. money-market"
                            value={newModule.id}
                            onChange={(e) => setNewModule({...newModule, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500"
                            required={isAddingModule}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Module Title</label>
                          <input 
                            type="text"
                            placeholder="e.g. Money Market"
                            value={newModule.title}
                            onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500"
                            required={isAddingModule}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Level</label>
                          <select 
                            value={newModule.level}
                            onChange={(e) => setNewModule({...newModule, level: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Duration</label>
                          <input 
                            type="text"
                            placeholder="e.g. 2h 30m"
                            value={newModule.duration}
                            onChange={(e) => setNewModule({...newModule, duration: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500"
                            required={isAddingModule}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Module Description</label>
                        <textarea 
                          rows={2}
                          placeholder="Brief overview of the module..."
                          value={newModule.description}
                          onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <select 
                      value={newLesson.course_id}
                      onChange={(e) => {
                        const cid = e.target.value;
                        setNewLesson({...newLesson, course_id: cid});
                        suggestNextLessonId(cid);
                      }}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500"
                    >
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Lesson Number</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 1"
                      required
                      value={newLesson.lesson_id}
                      onChange={(e) => setNewLesson({...newLesson, lesson_id: e.target.value})}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Lesson Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Market Structure 101"
                      required
                      value={newLesson.title}
                      onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Video URL (YouTube or HLS)</label>
                  <input 
                    type="url" 
                    placeholder="https://www.youtube.com/watch?v=... or .m3u8"
                    required
                    value={newLesson.video_url}
                    onChange={(e) => setNewLesson({...newLesson, video_url: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea 
                    rows={3}
                    placeholder="What will students learn in this lesson?"
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Lesson Notes / Resource (Optional)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="resource-upload"
                      onChange={(e) => setResourceFile(e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                    />
                    <label 
                      htmlFor="resource-upload"
                      className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm cursor-pointer hover:border-[#9CD5FF] dark:hover:border-emerald-500 transition-colors"
                    >
                      <UploadCloud size={18} className="text-zinc-400" />
                      <span className={resourceFile ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}>
                        {resourceFile ? resourceFile.name : 'Select a file (PDF, Doc, etc.)'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Plus size={20} />
                    )}
                    {uploading ? 'Uploading...' : 'Add Lesson'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
