// Community Feed Page with Multi-Image Support
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Heart, MessageCircle, Image as ImageIcon, Send, Loader2, Pencil, Trash2, MoreHorizontal, X as CloseIcon, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { PostImageGrid } from '../components/PostImageGrid';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: Profile;
}

interface Like {
  user_id: string;
}

interface Post {
  id: string;
  content: string;
  image_urls: string[];
  created_at: string;
  user_id: string;
  is_admin_post: boolean;
  profiles: Profile;
  likes: Like[];
  comments: Comment[];
}

export function Feed() {
  const { profile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newCommentContent, setNewCommentContent] = useState<Record<string, string>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);

  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();

    const handleProfileUpdate = () => {
      fetchPosts();
    };
    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [profile?.id, authLoading]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url, role),
          likes (user_id),
          comments (*, profiles:user_id (id, full_name, avatar_url, role))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data as unknown) as Post[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      setSelectedImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Revoke the URL to avoid memory leaks
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    try {
      setUploadingImage(true);
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${profile?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath);

        return data.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Error uploading images:', error);
      return [];
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && selectedImages.length === 0) return;
    if (!profile) {
      setErrorMsg('You must be logged in to post.');
      return;
    }

    setErrorMsg(null);
    try {
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages(selectedImages);
        if (imageUrls.length === 0) throw new Error('Failed to upload images');
      }

      const { error } = await supabase.from('posts').insert({
        user_id: profile.id,
        content: newPostContent.trim(),
        image_urls: imageUrls,
        is_admin_post: profile.role === 'admin',
      });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to create post');
      }

      setNewPostContent('');
      setSelectedImages([]);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      fetchPosts();
    } catch (error: any) {
      console.error('Error creating post:', error);
      setErrorMsg(error.message || 'Failed to create post. Please try again.');
    }
  };

  const toggleLike = async (postId: string, hasLiked: boolean) => {
    if (!profile) return;

    try {
      if (hasLiked) {
        await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: profile.id });
      } else {
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: profile.id });
      }
      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const content = newCommentContent[postId];
    if (!content?.trim() || !profile) return;

    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: profile.id,
        content: content.trim(),
      });

      if (error) throw error;

      setNewCommentContent(prev => ({ ...prev, [postId]: '' }));
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleDeletePost = async (postId: string) => {
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete) return;

    try {
      setDeletingPostId(postId);
      setErrorMsg(null);

      // 1. Delete images from storage if they exist
      if (postToDelete.image_urls && postToDelete.image_urls.length > 0) {
        const paths = postToDelete.image_urls.map(url => {
          if (!url) return null;
          const parts = url.split('post-images/');
          return parts.length > 1 ? parts[1] : null;
        }).filter(Boolean) as string[];

        if (paths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('post-images')
            .remove(paths);
          
          if (storageError) {
            console.error('Error deleting images from storage:', storageError);
          }
        }
      }

      // 2. Delete the post record
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error: any) {
      console.error('Error deleting post:', error);
      setErrorMsg(error.message || 'Failed to delete post.');
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleStartEdit = (post: Post) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const handleUpdatePost = async (postId: string) => {
    if (!editContent.trim()) return;

    try {
      setUpdatingPostId(postId);
      const { error } = await supabase
        .from('posts')
        .update({ content: editContent.trim() })
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editContent.trim() } : p));
      setEditingPostId(null);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post.');
    } finally {
      setUpdatingPostId(null);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.filter(c => c.id !== commentId)
          };
        }
        return p;
      }));
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      setErrorMsg(error.message || 'Failed to delete comment.');
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8 px-4 relative">
        {errorMsg && (
          <div className="fixed top-20 right-4 z-50 max-w-sm animate-in fade-in slide-in-from-top-4">
            <div className="bg-red-100 dark:bg-red-900/90 text-red-600 dark:text-red-100 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-red-200 dark:border-red-800 backdrop-blur-sm">
              <span className="text-sm font-medium">{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-8">Community Feed</h1>

        {/* Post Creator */}
        {profile?.role !== 'free' ? (
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-8">
            <form onSubmit={handleCreatePost}>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#7AB8E5] dark:bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile?.full_name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share your thoughts with the community..."
                    className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[80px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
                  />
                  
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                          <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 text-zinc-500 hover:text-[#7AB8E5] dark:hover:text-emerald-500 transition-colors"
                      >
                        <ImageIcon size={20} />
                        <span className="text-sm font-medium">Add Image</span>
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={(!newPostContent.trim() && selectedImages.length === 0) || uploadingImage}
                      className="flex items-center gap-2 px-4 py-2 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-8 text-center">
            <p className="text-zinc-500 text-sm mb-3">Posting is a Student feature. Join the community to share your journey!</p>
            <button className="px-6 py-2 bg-[#7AB8E5] dark:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform">Get Student Package</button>
          </div>
        )}

        {/* Feed List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-zinc-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No posts yet. Be the first to share!
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const hasLiked = post.likes.some(like => like.user_id === profile?.id);
              const isCommentsExpanded = expandedComments[post.id];

              return (
                <div key={post.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 md:p-6">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#7AB8E5] dark:bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                      {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        post.profiles?.full_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{post.profiles?.full_name || 'Unknown User'}</span>
                          {post.is_admin_post && (
                            <span className="px-2 py-0.5 bg-[#9CD5FF]/20 dark:bg-emerald-500/20 text-[#7AB8E5] dark:text-emerald-400 text-xs font-bold rounded">ADMIN</span>
                          )}
                        </div>
                        
                        {(profile?.id === post.user_id || profile?.role === 'admin') && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEdit(post)}
                              className="p-1.5 text-zinc-400 hover:text-[#7AB8E5] dark:hover:text-emerald-500 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              title="Edit Post"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              disabled={deletingPostId === post.id}
                              className={`p-1.5 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                                deletingPostId === post.id ? 'text-zinc-300' : 'text-zinc-400 hover:text-red-500'
                              }`}
                              title="Delete Post"
                            >
                              {deletingPostId === post.id ? (
                                <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Post Content */}
                  {editingPostId === post.id ? (
                    <div className="mb-4 space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 min-h-[100px] resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingPostId(null)}
                          className="px-4 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdatePost(post.id)}
                          disabled={updatingPostId === post.id || !editContent.trim()}
                          className="px-4 py-1.5 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50"
                        >
                          {updatingPostId === post.id ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap mb-4 text-zinc-800 dark:text-zinc-200">{post.content}</p>
                  )}
                  
                  <PostImageGrid images={post.image_urls} />

                  {/* Post Actions */}
                  <div className="flex items-center gap-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        if (profile?.role === 'free') {
                          setErrorMsg('Liking is a Student feature. Upgrade to join!');
                          return;
                        }
                        toggleLike(post.id, hasLiked);
                      }}
                      className={`flex items-center gap-2 transition-colors ${
                        hasLiked 
                          ? 'text-red-500' 
                          : 'text-zinc-500 hover:text-red-500'
                      }`}
                    >
                      <Heart size={20} className={hasLiked ? 'fill-current' : ''} />
                      <span className="font-medium">{post.likes.length}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        isCommentsExpanded 
                          ? 'text-[#7AB8E5] dark:text-emerald-500' 
                          : 'text-zinc-500 hover:text-[#7AB8E5] dark:hover:text-emerald-500'
                      }`}
                    >
                      <MessageCircle size={20} />
                      <span className="font-medium">{post.comments.length}</span>
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-200 ${isCommentsExpanded ? 'rotate-180' : ''}`} 
                      />
                    </button>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {isCommentsExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                          {/* Comment Input */}
                          {profile?.role !== 'free' ? (
                            <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-3 mb-6">
                              <div className="w-8 h-8 rounded-full bg-[#7AB8E5] dark:bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden text-sm">
                                {profile?.avatar_url ? (
                                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  profile?.full_name?.charAt(0) || 'U'
                                )}
                              </div>
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={newCommentContent[post.id] || ''}
                                  onChange={(e) => setNewCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  placeholder="Write a comment..."
                                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500"
                                />
                                <button
                                  type="submit"
                                  disabled={!newCommentContent[post.id]?.trim()}
                                  className="p-2 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                >
                                  <Send size={16} />
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3 mb-6 text-center">
                              <p className="text-zinc-500 text-xs">Commenting is a Student feature.</p>
                            </div>
                          )}

                          {/* Comments List */}
                          <div className="space-y-4">
                            {post.comments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#7AB8E5] dark:bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden text-sm">
                                  {comment.profiles?.avatar_url ? (
                                    <img src={comment.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    comment.profiles?.full_name?.charAt(0) || 'U'
                                  )}
                                </div>
                                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-3">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm">{comment.profiles?.full_name || 'Unknown User'}</span>
                                      {(profile?.id === comment.user_id || profile?.role === 'admin') && (
                                        <button
                                          onClick={() => handleDeleteComment(comment.id, post.id)}
                                          className="p-1 text-zinc-400 hover:text-red-500 transition-colors rounded"
                                          title="Delete Comment"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                    <span className="text-xs text-zinc-500">
                                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
