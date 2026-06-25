import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

export default function CollectionModal({ isOpen, onClose, media }) {
  const { showToast } = useToast();
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const LISTS_KEY = 'cineverse_custom_lists';

  // Load lists from localStorage
  useEffect(() => {
    if (isOpen) {
      const storedLists = JSON.parse(localStorage.getItem(LISTS_KEY) || '[]');
      setLists(storedLists);
    }
  }, [isOpen]);

  if (!isOpen || !media) return null;

  const saveLists = (updatedLists) => {
    localStorage.setItem(LISTS_KEY, JSON.stringify(updatedLists));
    setLists(updatedLists);
    // Dispatch event to notify Lists page or other listeners
    window.dispatchEvent(new Event('lists_updated'));
  };

  const handleToggleList = (listId) => {
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
    saveLists(updatedLists);
  };

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const newList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      description: newListDesc.trim() || 'Custom collection',
      items: [media] // Automatically add current movie/show
    };

    const updatedLists = [...lists, newList];
    saveLists(updatedLists);
    showToast(`Created "${newListName}" & added item!`, 'success');
    
    // Reset form
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
          {lists.length === 0 ? (
            <p className="text-secondary text-sm text-center py-6">No custom collections yet.</p>
          ) : (
            lists.map(list => {
              const hasItem = list.items.some(item => item.id === media.id);
              return (
                <button
                  key={list.id}
                  onClick={() => handleToggleList(list.id)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container hover:bg-white/5 border border-white/5 transition-all text-left group"
                >
                  <div>
                    <p className="text-body-md font-bold text-on-background group-hover:text-primary-container transition-colors">
                      {list.name}
                    </p>
                    <p className="text-xs text-secondary truncate max-w-[280px]">
                      {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
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
                onChange={(e) => newListDesc(e.target.value)}
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
