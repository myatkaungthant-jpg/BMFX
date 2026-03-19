import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Download, FileSpreadsheet, FileText, Upload, Trash2, Plus, X, Loader2, File as FileIcon, Search, Lock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { ConfirmModal } from '../components/ConfirmModal';

interface Resource {
  id: string;
  title: string;
  file_url: string;
  file_path: string;
  file_type: string;
  file_size: string;
  created_at: string;
}

export function Resources() {
  const { profile, loading: authLoading } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; resource: Resource | null }>({
    isOpen: false,
    resource: null
  });

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (profile?.role === 'free') {
      setLoading(false);
      return;
    }
    fetchResources();
  }, [profile?.id, authLoading]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile || !newTitle) return;

    try {
      setUploading(true);
      
      // 1. Upload file to Storage
      const fileExt = newFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `vault/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, newFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      // 3. Save metadata to Database
      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          title: newTitle,
          file_url: publicUrl,
          file_path: filePath,
          file_type: fileExt?.toUpperCase() || 'FILE',
          file_size: formatBytes(newFile.size),
          created_by: profile?.id
        });

      if (dbError) throw dbError;

      setIsUploadModalOpen(false);
      setNewFile(null);
      setNewTitle('');
      fetchResources();
    } catch (error) {
      console.error('Error uploading resource:', error);
      alert('Failed to upload resource. Make sure you have the correct permissions and the "resources" bucket exists.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (resource: Resource) => {
    setDeleteConfirm({ isOpen: true, resource });
  };

  const confirmDelete = async () => {
    const resource = deleteConfirm.resource;
    if (!resource) return;

    try {
      // 1. Delete from Storage
      const { error: storageError } = await supabase.storage
        .from('resources')
        .remove([resource.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // 2. Delete from Database
      const { error: dbError } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id);

      if (dbError) throw dbError;

      // Update local state
      setResources(prev => prev.filter(r => r.id !== resource.id));
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource. Make sure you have admin permissions.');
    } finally {
      setDeleteConfirm({ isOpen: false, resource: null });
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (['XLS', 'XLSX', 'CSV', 'SPREADSHEET'].includes(type)) return FileSpreadsheet;
    if (['PDF', 'DOC', 'DOCX', 'TXT'].includes(type)) return FileText;
    return FileIcon;
  };

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Resource Vault</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Downloadable tools, templates, and cheat sheets.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            {isAdmin && (
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#9CD5FF] dark:bg-emerald-600 text-zinc-900 dark:text-white font-bold rounded-xl hover:opacity-90 transition-all shrink-0"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Upload</span>
              </button>
            )}
          </div>
        </div>
        
        {profile?.role === 'free' ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center px-6">
            <div className="w-20 h-20 bg-[#7AB8E5]/10 dark:bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-[#7AB8E5]/20 dark:border-emerald-500/20">
              <Lock size={40} className="text-[#7AB8E5] dark:text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Premium Resource Vault</h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">
              Our Resource Vault contains exclusive trading tools, templates, and spreadsheets. Upgrade to a Student account to unlock instant access.
            </p>
            <button className="px-8 py-4 bg-[#7AB8E5] dark:bg-emerald-600 text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-blue-500/20 dark:shadow-emerald-500/20">
              Become a Student Member
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-zinc-400" size={32} />
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500">
              {searchTerm ? `No resources matching "${searchTerm}"` : 'No resources available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.map((res) => {
              const Icon = getFileIcon(res.file_type);
              return (
                <div key={res.id} className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-zinc-950 rounded-xl group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition-colors">
                      <Icon size={24} className="text-[#9CD5FF] dark:text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-bold">{res.title}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">{res.file_type} • {res.file_size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={res.file_url} 
                      download 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Download size={20} />
                    </a>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteClick(res)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-bold">Upload New Resource</h2>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleUpload} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-600 dark:text-zinc-400">Resource Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Trading Journal 2024"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-600 dark:text-zinc-400">File</label>
                  <div className="relative group">
                    <input
                      type="file"
                      required
                      onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full px-4 py-8 bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-2 group-hover:border-[#9CD5FF] dark:group-hover:border-emerald-500 transition-colors">
                      <Upload className="text-zinc-400 group-hover:text-[#9CD5FF] dark:group-hover:text-emerald-500 transition-colors" size={32} />
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        {newFile ? newFile.name : 'Click or drag to upload'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !newFile || !newTitle}
                    className="flex-1 px-4 py-3 bg-[#9CD5FF] dark:bg-emerald-600 text-zinc-900 dark:text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Uploading...
                      </>
                    ) : (
                      'Upload'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Delete Resource"
          message={`Are you sure you want to delete "${deleteConfirm.resource?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ isOpen: false, resource: null })}
          isDestructive={true}
        />
      </div>
    </Layout>
  );
}
