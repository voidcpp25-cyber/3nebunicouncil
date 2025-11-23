import { useState } from 'react';
import JokeList from './components/JokeList';
import ELORanking from './components/ELORanking';
import DetailedRanking from './components/DetailedRanking';
import AddJoke from './components/AddJoke';
import PendingJokes from './components/PendingJokes';
import ImportJokes from './components/ImportJokes';
import UpdatesFeed from './components/UpdatesFeed';
import { 
  FaList, 
  FaTrophy, 
  FaStar, 
  FaPlus, 
  FaClock, 
  FaDownload,
  FaBell 
} from 'react-icons/fa';
import './App.css';

type Tab = 'list' | 'elo' | 'detailed' | 'add' | 'pending' | 'import' | 'updates';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('list');

  return (
    <div className="app">
      <header>
        <h1>Inside Jokes Ranking System</h1>
        <nav className="tabs">
          <button
            className={activeTab === 'list' ? 'active' : ''}
            onClick={() => setActiveTab('list')}
          >
            <FaList /> Jokes List
          </button>
          <button
            className={activeTab === 'elo' ? 'active' : ''}
            onClick={() => setActiveTab('elo')}
          >
            <FaTrophy /> ELO Ranking
          </button>
          <button
            className={activeTab === 'detailed' ? 'active' : ''}
            onClick={() => setActiveTab('detailed')}
          >
            <FaStar /> Detailed Ranking
          </button>
          <button
            className={activeTab === 'add' ? 'active' : ''}
            onClick={() => setActiveTab('add')}
          >
            <FaPlus /> Add Joke
          </button>
          <button
            className={activeTab === 'pending' ? 'active' : ''}
            onClick={() => setActiveTab('pending')}
          >
            <FaClock /> Pending Approvals
          </button>
          <button
            className={activeTab === 'import' ? 'active' : ''}
            onClick={() => setActiveTab('import')}
          >
            <FaDownload /> Import Jokes
          </button>
          <button
            className={activeTab === 'updates' ? 'active' : ''}
            onClick={() => setActiveTab('updates')}
          >
            <FaBell /> Updates
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'list' && <JokeList />}
        {activeTab === 'elo' && <ELORanking />}
        {activeTab === 'detailed' && <DetailedRanking />}
        {activeTab === 'add' && <AddJoke />}
        {activeTab === 'pending' && <PendingJokes />}
        {activeTab === 'import' && <ImportJokes />}
        {activeTab === 'updates' && <UpdatesFeed />}
      </main>
    </div>
  );
}

export default App;
