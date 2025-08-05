import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { EditModal } from './components/EditModal';
import { WikiProvider } from './context/WikiContext';

function App() {
  return (
    <WikiProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <Header />
        <div className="flex">
          <Sidebar />
          <MainContent />
        </div>
        <EditModal />
      </div>
    </WikiProvider>
  );
}

export default App;