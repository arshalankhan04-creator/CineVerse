import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function Lists() {
  const { showToast } = useToast();
  const { user, loading: authLoading, setAuthModalOpen } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected list details view
  const [selectedList, setSelectedList] = useState(null);
  
  // Create / Edit modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [listName, setListName] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [listIsPublic, setListIsPublic] = useState(false);

  const loadLists = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.getLists();
      setLists(data);
      
      // Sync current active view details
      if (selectedList) {
        const active = data.find(l => l._id === selectedList._id);
        setSelectedList(active || null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load collections', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadLists();
    } else {
      setLists([]);
      setLoading(false);
    }
  }, [user]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setListName('');
    setListDesc('');
    setListIsPublic(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (list) => {
    setModalMode('edit');
    setListName(list.name);
    setListDesc(list.description);
    setListIsPublic(list.isPublic || false);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!listName.trim()) return;

    try {
      if (modalMode === 'create') {
        const created = await api.createList(listName.trim(), listDesc.trim() || 'Custom collection', listIsPublic);
        setLists(prev => [...prev, created]);
        showToast(`Created collection "${listName}"`, 'success');
      } else {
        await api.updateListDetails(selectedList._id, {
          name: listName.trim(),
          description: listDesc.trim() || 'Custom collection',
          isPublic: listIsPublic
        });
        showToast(`Updated collection "${listName}"`, 'success');
      }
      setIsModalOpen(false);
      loadLists();
    } catch (err) {
      showToast(err.message || 'Failed to save collection', 'error');
    }
  };

  const handleDeleteCollection = async (listId, name) => {
    if (window.confirm(`Are you sure you want to delete the collection "${name}"?`)) {
      try {
        await api.deleteList(listId);
        setLists(prev => prev.filter(l => l._id !== listId));
        setSelectedList(null);
        showToast(`Deleted collection "${name}"`, 'info');
      } catch (err) {
        showToast(err.message || 'Failed to delete collection', 'error');
      }
    }
  };

  const handleShareList = (list) => {
    const shareUrl = `${window.location.origin}/lists/shared/${list._id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        showToast('Share link copied to clipboard!', 'success');
      })
      .catch((err) => {
        showToast('Failed to copy link', 'error');
        console.error(err);
      });
  };

  const handleRemoveItem = async (listId, tmdbId, itemTitle) => {
    const list = lists.find(l => l._id === listId);
    if (!list) return;

    // Filter out the item
    const updatedItems = list.items
      .filter(item => (item.tmdbId || item.id) !== tmdbId)
      .map(item => ({
        tmdbId: item.tmdbId || item.id,
        mediaType: item.mediaType || item.media_type,
        title: item.title || item.name,
        posterPath: item.posterPath || item.poster_path,
      }));

    try {
      await api.updateListItems(listId, updatedItems);
      showToast(`Removed "${itemTitle}"`, 'info');
      loadLists();
    } catch (err) {
      showToast(err.message || 'Failed to remove item', 'error');
    }
  };

  // Helper to normalize item structure for MovieCard
  const normalizeItems = (items = []) => {
    return items.map(item => ({
      ...item,
      id: item.tmdbId || item.id,
      title: item.title || item.name,
      name: item.name || item.title,
      poster_path: item.posterPath || item.poster_path,
      vote_average: item.rating || item.vote_average,
      media_type: item.mediaType || item.media_type,
    }));
  };

  if (authLoading) {
    return (
      <div className="bg-level-0 min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-container/20 border-t-primary-container rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is logged out, show a beautiful sign-in prompt placeholder
  if (!user) {
    return (
      <div className="bg-level-0 min-h-screen pt-28 pb-16 page-transition text-left">
        <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center py-20 text-center">
          <div className="glass-panel rounded-3xl p-12 max-w-2xl mx-auto border border-white/5 flex flex-col items-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-container/10 rounded-full blur-[100px]"></div>
            
            <span className="material-symbols-outlined text-[72px] text-primary-container mb-6 drop-shadow-[0_0_20px_rgba(229,9,20,0.3)] animate-pulse">playlist_play</span>
            
            <h1 className="text-display-lg-mobile md:text-headline-lg font-black text-on-background tracking-tight mb-4">
              Your CineVerse Collections
            </h1>
            <p className="text-body-lg text-secondary max-w-md mb-8 leading-relaxed">
              Sign in to manage your custom movie and TV show collections, organize your favorites, and keep track of your watchlists.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-primary-container text-white px-8 py-3.5 rounded-full text-sm font-bold tracking-wide hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(229,9,20,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              Sign In / Register
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-level-0 min-h-screen pt-24 pb-stack-lg page-transition text-left">
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        
        {/* State 1: Individual Collection Detail View */}
        {selectedList ? (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Back to collections button */}
            <button
              onClick={() => setSelectedList(null)}
              className="flex items-center gap-1 text-secondary hover:text-white transition-colors text-xs font-bold w-fit cursor-pointer py-1"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Collections
            </button>

            {/* List Header Card */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/5 relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-container/10 rounded-full blur-[100px]"></div>

              <div>
                <h1 className="text-display-lg-mobile md:text-headline-lg font-black text-on-background tracking-tight">
                  {selectedList.name}
                </h1>
                <p className="text-body-md text-secondary mt-1 max-w-2xl leading-relaxed">
                  {selectedList.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-xs font-bold text-secondary bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                    {selectedList.items?.length || 0} {selectedList.items?.length === 1 ? 'Title' : 'Titles'}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                    selectedList.isPublic 
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
                      : 'bg-white/5 text-secondary border-white/10'
                  }`}>
                    <span className="material-symbols-outlined text-[12px]">{selectedList.isPublic ? 'public' : 'lock'}</span>
                    {selectedList.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Share, Edit, Delete */}
              <div className="flex gap-2.5 self-start md:self-center shrink-0">
                {selectedList.isPublic && (
                  <button
                    onClick={() => handleShareList(selectedList)}
                    className="glass-panel text-primary hover:bg-white/5 p-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer border border-white/10"
                    title="Copy public share link"
                  >
                    <span className="material-symbols-outlined text-[20px]">share</span>
                  </button>
                )}
                <button
                  onClick={() => handleOpenEdit(selectedList)}
                  className="glass-panel text-on-background hover:bg-white/5 p-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer border border-white/10"
                  title="Edit collection details"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button
                  onClick={() => handleDeleteCollection(selectedList._id, selectedList.name)}
                  className="glass-panel text-primary-container hover:bg-primary-container/10 p-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer border border-primary-container/20"
                  title="Delete collection"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>

            {/* Collection Grid items */}
            {(!selectedList.items || selectedList.items.length === 0) ? (
              <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <span className="material-symbols-outlined text-[54px] text-secondary/30">playlist_play</span>
                <h3 className="text-body-lg font-bold text-on-background mt-4">Collection is Empty</h3>
                <p className="text-secondary max-w-xs mt-2 text-xs leading-relaxed">
                  Browse movies or TV shows, open their detail page, and click the "+" icon to add titles to this collection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-gutter">
                {normalizeItems(selectedList.items).map((item, index) => (
                  <div key={item.id} className="relative group">
                    <MovieCard movie={item} showRating={true} index={index} />
                    
                    {/* Absolute close button to remove item */}
                    <button
                      onClick={() => handleRemoveItem(selectedList._id, item.id, item.title || item.name)}
                      className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/80 hover:bg-primary-container border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-30 shadow-lg scale-90 group-hover:scale-100"
                      title="Remove from playlist"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* State 2: Main Grid View of all Collections */
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h1 className="text-display-lg-mobile md:text-display-lg font-extrabold text-on-background tracking-tight">
                  Custom Collections
                </h1>
                <p className="text-body-md text-secondary mt-1">
                  Organize movies and shows into your own playlists and collections.
                </p>
              </div>
              
              <button
                onClick={handleOpenCreate}
                className="bg-primary-container text-white px-5 py-3 rounded-full text-xs font-bold flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(229,9,20,0.4)] cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Create List
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <div className="w-10 h-10 border-4 border-primary-container/20 border-t-primary-container rounded-full animate-spin"></div>
              </div>
            ) : lists.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                <span className="material-symbols-outlined text-[64px] text-secondary/40">playlist_add</span>
                <h2 className="text-headline-md font-bold text-on-background mt-4">No Custom Collections</h2>
                <p className="text-secondary max-w-sm mt-2 text-sm leading-relaxed">
                  Start organizing your library. Create collections like "Sci-Fi Favorites", "Classics", or "To Watch" and curate your catalog.
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="mt-6 px-6 py-2.5 rounded-full bg-primary-container text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Create Your First List
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {lists.map(list => {
                  const coverItem = list.items?.[0];
                  
                  return (
                    <div
                      key={list._id}
                      onClick={() => setSelectedList(list)}
                      className="glass-panel rounded-3xl p-5 border border-white/5 hover:border-primary-container/30 cursor-pointer group flex flex-col justify-between min-h-[200px] hover:shadow-[0_10px_35px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Gradient Backdrop Cover effect using first item */}
                      {coverItem && (coverItem.posterPath || coverItem.poster_path) && (
                        <div className="absolute inset-0 opacity-15 pointer-events-none group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
                          <img
                            src={`https://image.tmdb.org/t/p/w342${coverItem.posterPath || coverItem.poster_path}`}
                            alt="list cover background"
                            className="w-full h-full object-cover blur-[8px]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent"></div>
                        </div>
                      )}

                      <div className="relative z-10 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="material-symbols-outlined text-primary-container text-[28px] drop-shadow-md">folder_open</span>
                          <span className="material-symbols-outlined text-secondary/40 text-[18px]" title={list.isPublic ? 'Public collection' : 'Private collection'}>
                            {list.isPublic ? 'public' : 'lock'}
                          </span>
                        </div>
                        <h3 className="text-body-lg font-bold text-on-background truncate group-hover:text-primary-container transition-colors mt-2" title={list.name}>
                          {list.name}
                        </h3>
                        <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                          {list.description}
                        </p>
                      </div>

                      <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-3 mt-4 text-xs">
                        <span className="text-secondary font-semibold">
                          {list.items?.length || 0} {list.items?.length === 1 ? 'title' : 'titles'}
                        </span>
                        <span className="text-primary-container font-extrabold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                          Open List
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create / Edit Dialog Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
            onClick={() => setIsModalOpen(false)}
          >
            <form
              onSubmit={handleFormSubmit}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface-container-low border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
            >
              <h3 className="text-headline-sm font-bold text-on-background border-b border-white/5 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">
                  {modalMode === 'create' ? 'playlist_add' : 'edit'}
                </span>
                {modalMode === 'create' ? 'Create Collection' : 'Edit Collection'}
              </h3>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-secondary tracking-wider">List Name</label>
                <input
                  type="text"
                  placeholder="e.g. Oscar Winners, Halloween"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-background focus:outline-none focus:border-primary-container transition-colors"
                  required
                  maxLength={40}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-secondary tracking-wider">Description</label>
                <textarea
                  placeholder="What is this collection about..."
                  value={listDesc}
                  onChange={(e) => setListDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-background focus:outline-none focus:border-primary-container transition-colors resize-none"
                  maxLength={120}
                />
              </div>

              <div className="flex items-center gap-3 bg-surface-container/50 border border-white/5 p-3 rounded-xl cursor-pointer select-none" onClick={() => setListIsPublic(!listIsPublic)}>
                <input
                  type="checkbox"
                  checked={listIsPublic}
                  onChange={(e) => setListIsPublic(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-white/10 text-primary-container bg-surface-container focus:ring-primary-container accent-primary-container cursor-pointer"
                  id="is-public-toggle"
                />
                <div className="flex flex-col text-left">
                  <label htmlFor="is-public-toggle" className="text-xs font-bold text-on-background cursor-pointer flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-secondary">public</span>
                    Make Collection Public
                  </label>
                  <span className="text-[10px] text-secondary">
                    Anyone with the link will be able to view this list.
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-secondary hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary-container text-white hover:bg-primary-container/95 transition-colors cursor-pointer"
                >
                  {modalMode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
