import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Explore from './pages/Explore';
import MovieDetail from './pages/MovieDetail';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import TVShows from './pages/TVShows';
import TVDetail from './pages/TVDetail';
import PersonDetail from './pages/PersonDetail';
import Compare from './pages/Compare';
import Quiz from './pages/Quiz';
import Recommend from './pages/Recommend';
import Lists from './pages/Lists';
import SharedList from './pages/SharedList';
import Calendar from './pages/Calendar';
import Stats from './pages/Stats';
import People from './pages/People';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-white">
      {/* Reset scroll on navigation */}
      <ScrollToTop />

      {/* Sticky Navigation */}
      <Navbar />

      {/* Authentication Modal */}
      <AuthModal />

      {/* Main Pages Container */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shows" element={<TVShows />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/tv/:id" element={<TVDetail />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/person/:id" element={<PersonDetail />} />
          <Route path="/people" element={<People />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/lists/shared/:listId" element={<SharedList />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/profile/stats" element={<Stats />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
