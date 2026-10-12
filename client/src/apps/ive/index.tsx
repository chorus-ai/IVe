import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import Header from './Header';
import Footer from './Footer';
import Toast from './components/ui/Toast';

const IVeLayout: React.FC = () => {
  useEffect(() => {
    document.title = "CHoRUS | IVe";
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-300 font-sans">
      <Header />
      <Outlet />
      <Footer />
      <Toast />
    </div>
  );
};

export default IVeLayout;
