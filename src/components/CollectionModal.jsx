import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function CollectionModal({ isOpen, onClose, media }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const LISTS_KEY = 'cineverse_custom_lists';

  const loadLists = async () => {
    if (!user) {
      const storedLists = JSON.parse(localStorage.getItem(LISTS_KEY) || '[]');
      setLists(storedLists);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getLists();
      setLists(data);
    } catch (err) {
      console.error('Failed to fetch collections:', err.message);
      showToast('Failed to load collections', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLists();
    }
  }, [isOpen, user]);

  if (!isOpen || !media) return null;

  const handleToggleList = async (listId) => {
    if (!user) {
      const updatedLists = lists.map(list => {
        if (list.id === listId) {
          const itemExists = list.items.some(item => item.id === media.id);
          let updatedItems;
          if (itemExists) {
            updatedItems = list.items.filter(item => item.id !== media.id);
            showToast(`Removed from "${list.name}"`, 'info');
          } else {
            updatedItems = [...list.items, media];
            showToast(`Added to "${list.name}"`, 'success');
          }
          return { ...list, items: updatedItems };
        }
        return list;
      });
      localStorage.setItem(LISTS_KEY, JSON.stringify(updatedLists));
      setLists(updatedLists);
      window.dispatchEvent(new Event('lists_updated'));
      return;
    }

    // Database Toggle
    const list = lists.find(l => l._id === listId);
    if (!list) return;

    const itemExists = list.items?.some(item => (item.tmdbId || item.id) === media.id);
    let updatedItems;
    if (itemExists) {
      updatedItems = list.items.filter(item => (item.tmdbId || item.id) !== media.id);
    } else {
      updatedItems = [...(list.items || []), {
        tmdbId: media.id,
        mediaType: media.mediaType || media.media_type || (media.title ? 'movie' : 'tv'),
        title: media.title || media.name,
        posterPath: media.poster_path || media.posterPath
      }];
    }

    const formattedItems = updatedItems.map(item => ({
      tmdbId: item.tmdbId || item.id,
      mediaType: item.mediaType || item.media_type || (item.title ? 'movie' : 'tv'),
      title: item.title || item.name,
      posterPath: item.posterPath || item.poster_path
    }));

    try {
      await api.updateListItems(listId, formattedItems);
      showToast(itemExists ? `Removed from "${list.name}"` : `Added to "${list.name}"`, itemExists ? 'info' : 'success');
      loadLists();
      window.dispatchEvent(new Event('lists_updated'));
    } catch (err) {
      showToast(err.message || 'Failed to update collection', 'error');
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    if (!user) {
      const newList = {
        id: Date.now().toString(),
        name: newListName.trim(),
        description: newListDesc.trim() || 'Custom collection',
        items: [media]
      };
      const updatedLists = [...lists, newList];
      localStorage.setItem(LISTS_KEY, JSON.stringify(updatedLists));
      setLists(updatedLists);
      showToast(`Created "${newListName}" & added item!`, 'success');
      window.dispatchEvent(new Event('lists_updated'));
    } else {
      // Database create
      try {
        const formattedItem = {
          tmdbId: media.id,
          mediaType: media.media_type || media.mediaType || (media.title ? 'movie' : 'tv'),
          title: media.title || media.name,
          posterPath: media.poster_path || media.posterPath
        };
        await api.createList(
          newListName.trim(), 
          newListDesc.trim() || 'Custom collection',
          [formattedItem]
        );
        showToast(`Created "${newListName}" & added item!`, 'success');
        loadLists();
        window.dispatchEvent(new Event('lists_updated'));
      } catch (err) {
        showToast(err.message || 'Failed to create collection', 'error');
      }
    }

    setNewListName('');
    setNewListDesc('');
    setShowCreateForm(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in text-left"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-surface-container-low border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-headline-sm font-bold text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">playlist_add</span>
            Add to Collection
          </h3>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Media Preview Info */}
        <div className="flex items-center gap-3 bg-surface-container-high/40 p-2.5 rounded-xl border border-white/5">
          <img 
            src={media.poster_path ? `https://image.tmdb.org/t/p/w92${media.poster_path}` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=92'} 
            alt={media.title || media.name} 
            className="w-12 rounded object-cover aspect-[2/3]"
          />
          <div className="overflow-hidden">
            <h4 className="text-body-md font-bold text-on-background truncate">{media.title || media.name}</h4>
            <p className="text-label-sm text-secondary truncate">
              {media.release_date || media.first_air_date ? new Date(media.release_date || media.first_air_date).getFullYear() : 'N/A'}
            </p>
          </div>
        </div>

        {/* List of Custom Collections */}
        <div className="flex-grow max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-thin">
          {loading ? (
            <p className="text-secondary text-sm text-center py-6">Loading collections...</p>
          ) : lists.length === 0 ? (
            <p className="text-secondary text-sm text-center py-6">No custom collections yet.</p>
          ) : (
            lists.map(list => {
              const hasItem = list.items?.some(item => (item.tmdbId || item.id) === media.id);
              const listId = list._id || list.id;
              return (
                <button
                  key={listId}
                  onClick={() => handleToggleList(listId)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container hover:bg-white/5 border border-white/5 transition-all text-left group"
                >
                  <div>
                    <p className="text-body-md font-bold text-on-background group-hover:text-primary-container transition-colors">
                      {list.name}
                    </p>
                    <p className="text-xs text-secondary truncate max-w-[280px]">
                      {list.items?.length || 0} {list.items?.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <span className={`material-symbols-outlined text-[22px] transition-colors ${
                    hasItem ? 'text-primary-container filled-icon' : 'text-secondary group-hover:text-white'
                  }`}>
                    {hasItem ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Create New List Section */}
        <div className="border-t border-white/5 pt-4">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-outline/40 text-secondary hover:text-white hover:border-white transition-all flex items-center justify-center gap-1.5 font-bold text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Create New Collection
            </button>
          ) : (
            <form onSubmit={handleCreateList} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Collection Name (e.g. My Favorites)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2 text-sm text-on-background focus:outline-none focus:border-primary-container transition-colors"
                required
                maxLength={40}
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (Optional)"
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2 text-sm text-on-background focus:outline-none focus:border-primary-container transition-colors"
                maxLength={100}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-secondary hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-primary-container text-white hover:bg-primary-container/95 transition-colors"
                >
                  Create & Add
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
