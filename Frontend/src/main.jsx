import { createRoot } from 'react-dom/client';
import './index.css';
import { StrictMode, useEffect, useState } from 'react';
import App from './App.jsx';
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Navbar from './components/Navbar.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import Snowfall from "react-snowfall";

import AppProviders from "./components/AppProviders.jsx";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/700.css';
import FreelancerDashboard from './pages/FreelancerPages/Dashboard.jsx';
import FreelancerManageJobs from './pages/FreelancerPages/ManageJobs.jsx';
import BrowseJobs from './pages/FreelancerPages/BrowseJobs.jsx';
import MyProfile from './pages/FreelancerPages/MyProfile.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import VerifySkillPage from './pages/FreelancerPages/VerifySkillPage.jsx';
import MintRules from './pages/FreelancerPages/MintRules.jsx';
import MintSkillSbtPage from './pages/FreelancerPages/MintSkillSbtPage.jsx';
import ClientProfile from './pages/ClientPages/ClientProfile.jsx';
import PostJobs from './pages/ClientPages/PostJobs.jsx';
import JobPage from './pages/jobs/jobPage.jsx';
import ClientDashboard from './pages/ClientPages/Dashboard.jsx';
import ClientManageJobs from './pages/ClientPages/ManageJobs.jsx';
import Governance from './pages/Governance.jsx';
import Messages from './pages/Messages.jsx';
import SideBar from './components/SideBar.jsx';
import { Snowflake } from 'lucide-react';
import ContractDetailsPage from './pages/ContractDetailsPage.jsx';
import { TokenBalanceProvider } from './contexts/TokenBalanceContext.jsx';
import Proposal from './pages/Proposal.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import NotFound from './pages/NotFound.jsx';

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
        <App />
      </>
    )
  },
  {
    path: "/freelancer/dashboard",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <FreelancerDashboard />
      </>
    )
  },
  {
    path: "/freelancer/manage-jobs",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <FreelancerManageJobs />
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
    path: "/freelancer/my-profile",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
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
        <SettingsPage />
      </>
    )
  }, {
    path: "/client/settings",
    element: (
      <>
        <Navbar />
        <SettingsPage />
      </>
    )
  }, {
    path: "/mint-rules",
    element: (
      <>
        <Navbar />
        <MintRules />
      </>
    )
  }, {
    path: "/verify-skill/:skill",
    element: (
      <>
        {/* <Navbar /> */}
        <VerifySkillPage /></>
    )
  }, {
    path: "/mint-sbt/:skill",
    element: (
      <>
        <Navbar />
        <MintSkillSbtPage />
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
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <PostJobs />
      </>
    )
  }, {
    path: "/job/:jobId",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <JobPage />
      </>
    )
  }, {
    path: "/contracts/:jobId",
    element: (
      <>
        <Navbar />
        <ContractDetailsPage />
      </>
    )
  },
  {
    path: "/client/dashboard",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <ClientDashboard />
      </>
    )
  },
  {
    path: "/client/manage-jobs",
    element: (
      <>
        <Navbar />
        <ClientManageJobs />
      </>
    )
  }, {
    path: "/governance",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Navbar />
        <Governance />
      </>
    )
  }, {
    path: "/messages/:recipientId",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Messages />
      </>
    )
  }, {
    path: "/messages",
    element: (
      <>
        <Snowfall snowflakeCount={60} />
        <Messages />
      </>
    )
  },{
    path: "/proposal/:id",
    element:(
      <>
        <Navbar />
        <Proposal />
      </>
    )
  },{
    path: "/profile/:userId",
    element:(
      <>
        {/* <Navbar /> */}
        <PublicProfile />
      </>
    )
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AppProviders>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <TokenBalanceProvider>
                <RouterProvider router={router} />
              </TokenBalanceProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </AppProviders>
    </ThemeProvider>
  </QueryClientProvider>
  // </StrictMode>
);
