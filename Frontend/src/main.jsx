import { createRoot } from 'react-dom/client';
import './index.css';
import { StrictMode } from 'react';
import App from './App.jsx';
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Navbar from './components/Navbar.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import Snowfall from "react-snowfall";

import AppProviders from "./components/AppProviders.jsx";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/700.css';
import Dashboard from './pages/Dashboard.jsx';
import BrowseJobs from './pages/BrowseJobs.jsx';
import MyProfile from './pages/MyProfile.jsx';
import Setting from './pages/Setting.jsx';
import VerifySkillPage from './pages/VerifySkillPage.jsx';
import SbtMint from './pages/SbtMint.jsx';

const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});


const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <App />
      </>
    )
  },
  {
    path: "/dashboard",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <Dashboard />
      </>
    )
  }, {
    path: "/browse-jobs",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <BrowseJobs />
      </>
    )
  }, {
    path: "/my-profile",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <MyProfile />
      </>
    )
  },
  , {
    path: "/settings",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <Setting />
      </>
    )
  }, {
    path: "/verify-skill/:skill",
    element: (
      <>
        <Navbar />
        <VerifySkillPage /></>
    )
  }, {
    path: "/mint-sbt/:skill",
    element: (
      <>
        <Navbar />
        <SbtMint />
      </>
    )
  }
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppProviders>
          <RouterProvider router={router} />
        </AppProviders>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
