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
import FreelancerDashboard from './pages/FreelancerPages/Dashboard.jsx';
import BrowseJobs from './pages/FreelancerPages/BrowseJobs.jsx';
import MyProfile from './pages/FreelancerPages/MyProfile.jsx';
import Setting from './pages/FreelancerPages/Setting.jsx';
import VerifySkillPage from './pages/FreelancerPages/VerifySkillPage.jsx';
import SbtMint from './pages/FreelancerPages/SbtMint.jsx';
import ClientProfile from './pages/ClientPages/ClientProfile.jsx';
import PostJobs from './pages/ClientPages/PostJobs.jsx';
import JobPage from './pages/jobs/jobPage.jsx';
import ClientDashboard from './pages/ClientPages/Dashboard.jsx';
import SideBar from './components/SideBar.jsx';

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
        {/* <Snowfall snowflakeCount={60} /> */}
        <Navbar />
        <App />
      </>
    )
  },
  {
    path: "/freelancer/dashboard",
    element: (
      <>
        {/* <Snowfall snowflakeCount={60} /> */}
        <Navbar />
        <FreelancerDashboard />
      </>
    )
  }, {
    path: "/browse-jobs",
    element: (
      <>
        {/* <Snowfall snowflakeCount={60} /> */}
        <Navbar />
        <BrowseJobs />
      </>
    )
  }, {
    path: "/freelancer/my-profile",
    element: (
      <>
        {/* <Snowfall snowflakeCount={60} /> */}
        <Navbar />
        <MyProfile />
      </>
    )
  },
  , {
    path: "/freelancer/settings",
    element: (
      <>
        {/* <Snowfall snowflakeCount={60} /> */}
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
  },
  {
    path: "/client/my-profile",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <ClientProfile />
      </>
    )
  },
  {
    path: "/post-job",
    element: (
      <>
        {/* <Snowfall snowflakeCount={60} /> */}
        <Navbar />
        <PostJobs />
      </>
    )
  }, {
    path: "/job/:jobId",
    element: (
      <>
        {/* <Snowfall snowflakeCount={60} /> */}
        <Navbar />
        <JobPage />
      </>
    )
  },
  {
    path:"/client/dashboard",
    element:(
      <>
      <Navbar />
      <ClientDashboard />
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
