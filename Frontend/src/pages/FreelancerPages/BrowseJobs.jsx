import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import SideBar from "../../components/SideBar";
import axios from "axios";
import { ArrowBigRight, ArrowBigLeft } from "lucide-react";
import JobCardSkeleton from "../../components/JobCardSkeleton";

import "../../index.css";

function BrowseJobs() {
  const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
  const robotoStyle = { fontFamily: "Roboto, sans-serif" };

  const { isConnected, address } = useAccount();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [isFetchingJobs, setIsFetchingJobs] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [jobType, setJobType] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [jobs, setJobs] = useState([]);

  const [filteredJobs, setFilteredJobs] = useState([]);

  async function fetchJobs(params) {
    if (!isConnected || !address) return;
    try {
      setIsFetchingJobs(true);
      const jobs = await axios.get("http://localhost:5000/api/jobs/fetch-jobs");
      setFilteredJobs(jobs.data.jobs);
      setJobs(jobs.data.jobs);
    } catch (error) {
      console.log(error);
      setRedNotice(true);
      setNotice("Unable to fetch the job");
    } finally {
      setIsFetchingJobs(false);
    }
  }

  useEffect(() => {
    fetchJobs();
    setSkills();
  }, [address, isConnected]);

  useEffect(() => {
    const skillSet = new Set();
    jobs.forEach((job) => {
      job.skills.forEach((skill) => skillSet.add(skill));
    });

    const sortedSkills = Array.from(skillSet).sort();

    setSkills(sortedSkills);

    // initialize results
    setFilteredJobs(jobs);
  }, [jobs]); // run once

  useEffect(() => {
    let timer;
    if (!isConnected) {
     
      timer = setTimeout(() => {
        if (!isConnected) {
          setRedNotice(true);
          setNotice("Wallet not connected — redirecting to home...");
          navigate("/");
        }
      }, 1200);
    } else {
      setNotice(null);
    }
    return () => clearTimeout(timer);
  }, [isConnected, navigate]);

  function toggleSkill(skill) {
    setSelectedSkills((prevSkills) => {
      if (prevSkills.includes(skill)) {
        return prevSkills.filter((s) => s !== skill);
      } else {
        return [...prevSkills, skill];
      }
    });
  }

  function nextJobs() {
    if (currentIndex + 3 < filteredJobs?.length) {
      setCurrentIndex(currentIndex + 3);
    }
  }

  function prevJobs() {
    if (currentIndex - 3 >= 0) {
      setCurrentIndex(currentIndex - 3);
    }
  }

  const handleJobType = (type) => {
    setJobType((curr) => (curr === type ? "" : type));
  };

  const handleSortBy = (sort) => {
    setSortBy((curr) => (curr === sort ? "" : sort));
  };

  const applyFilters = () => {
    let results = [...jobs];

    if (selectedSkills?.length > 0) {
      results = results.filter((job) =>
        selectedSkills.every((s) => job.skills.includes(s))
      );
    }

    if (jobType) {
      results = results.filter((job) => job.budgetType === jobType);
    }

    if (sortBy === "Date Posted") {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "Budget") {
      results.sort((a, b) => b.budget - a.budget);
    }

    setFilteredJobs(results);
  };

  const fetchJobPage = (jobId) => {
    navigate(`/job/${jobId}`);
  };

  const resetFilters = () => {
    setSelectedSkills([]);
    setJobType("");
    setSortBy("");
    setFilteredJobs(jobs);
  };

  const visibleItems = filteredJobs.slice(currentIndex, currentIndex + 3);

  return (
    <div className="dark:bg-[#0f111d] pt-6 flex bg-[#161c32] w-full">
      {/* floating notice */}
      {notice && (
        <div className="fixed top-4 right-4 z-50 animate-pulse">
          <div
            className={`flex items-center gap-3 bg-[#14a19f] text-white px-4 py-2 rounded shadow-lg border border-[#1ecac7]/30 ${
              redNotice
                ? "bg-red-600 border-red-700"
                : "bg-[#14a19f] border-[#1ecac7]/30"
            } `}
          >
            <div className="text-sm">{notice}</div>
            <button
              onClick={() => setNotice(null)}
              className="ml-2 text-xs text-white/90 px-2 py-1 rounded hover:opacity-90 transition-opacity"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
      <div className="pointer-events-none absolute left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>

      <SideBar />

      <div className="flex w-full flex-col lg:flex-row mb-4">
        <div className="filters w-full lg:w-1/2 ">
          <h1
            style={orbitronStyle}
            className="text-3xl  text-white font-bold px-6 mb-4"
          >
            Filters
          </h1>
          <div className="bg-[#161c32] dark:bg-[#0f111d]  border border-[#14a19f]/20 m-4 rounded-md shadow-lg px-1 py-1">
            <h1
              style={robotoStyle}
              className="text-lg text-white font-bold mb-1  px-2"
            >
              Skill Tags
            </h1>
            <div className="skills-filter flex flex-wrap  px-4 border-b border-gray-700 pb-4">
              {skills?.length > 0 &&
                skills.map((skill, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleSkill(skill)}
                    className={`
                                        m-2 px-3 py-1.5 text-sm 
                                        rounded-full 
                                        shadow-md hover:shadow-lg  
                                        transition-all duration-300 
                                        focus:outline-none focus:ring-2 focus:ring-cyan-700 dark:focus:ring-blue-700 focus:ring-opacity-50
                                        ${
                                          selectedSkills.includes(skill)
                                            ? "bg-cyan-700 dark:bg-blue-800 text-white ring-2 dark:ring-blue-800 ring-cyan-700"
                                            : "bg-[#262f52] text-white dark:bg-gray-900 dark:hover:bg-blue-700 hover:bg-cyan-700"
                                        }
                                    `}
                  >
                    {skill}
                  </button>
                ))}
            </div>
            <div className="py-1">
              <h1
                style={robotoStyle}
                className="text-lg text-white font-bold mb-1  px-1 mt-2"
              >
                Job Type
              </h1>
              <div className="job-type-filter flex flex-wrap  px-4  pb-4">
                {["fixed", "Hourly", "Milestone"].map((type, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleJobType(type)}
                    className={`
                                            m-2 px-3 py-1.5 text-sm 
                                            rounded-full 
                                            shadow-md hover:shadow-lg  
                                            transition-all duration-300 
                                            focus:outline-none focus:ring-2 focus:ring-cyan-700 dark:focus:ring-blue-700 focus:ring-opacity-50
                                            ${
                                              jobType === type
                                                ? "bg-cyan-700 dark:bg-blue-800 text-white ring-2 dark:ring-blue-800 ring-cyan-700"
                                                : "bg-[#262f52] text-white dark:bg-gray-900 dark:hover:bg-blue-700 hover:bg-cyan-700"
                                            }
                                        `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-[#161c32] dark:bg-[#0f111d]  border border-white/20 m-4 rounded-lg shadow-lg py-1">
            <h1
              style={robotoStyle}
              className="text-lg text-white font-bold mb-1  px-2 "
            >
              Sort By
            </h1>
            <div className="sort-by-filter flex flex-wrap px-4 pb-4">
              {["Relevance", "Date Posted", "Budget"].map((sort, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSortBy(sort)}
                  className={`
                                           m-2 px-3 py-1.5 text-sm 
                                           rounded-full 
                                           shadow-md hover:shadow-lg  
                                           transition-all duration-300 
                                           focus:outline-none focus:ring-2 focus:ring-cyan-700 dark:focus:ring-blue-700 focus:ring-opacity-50
                                           ${
                                             sortBy === sort
                                               ? "bg-cyan-700 dark:bg-blue-800 text-white ring-2 dark:ring-blue-800 ring-cyan-700"
                                               : "bg-[#262f52] text-white dark:bg-gray-900 dark:hover:bg-blue-700 hover:bg-cyan-700"
                                           }
                                        `}
                >
                  {sort}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#161c32] flex justify-between items-center dark:bg-[#0f111d]  border border-white/20 m-4 rounded-lg shadow-lg p-4">
            <div className="flex gap-3">
              <button
                className="
                                    px-4 py-2 text-lg 
                                    bg-[#14a19f] text-white
                                    rounded-lg 
                                    shadow-md hover:shadow-lg  
                                    transition-all duration-300 
                                    hover:bg-cyan-700 
                                    dark:bg-blue-700
                                    dark:hover:bg-blue-900
                                    transform hover:scale-105  
                                    focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-opacity-50
                                "
                onClick={applyFilters}
              >
                Apply Filters
              </button>

              <button
                className="
                                    px-4 py-2 text-lg 
                                    bg-gray-700 text-white
                                    rounded-lg 
                                    shadow-md hover:shadow-lg  
                                    transition-all duration-300 
                                    hover:bg-gray-600 
                                    transform hover:scale-105  
                                    focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-opacity-50
                                "
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>

            <div className="text-sm text-gray-300">
              Total{" "}
              <span className="font-bold text-white">
                {filteredJobs?.length}
              </span>{" "}
              results
            </div>
          </div>

          <div className="bg-[#161c32] dark:bg-[#0f111d] border border-white/20 m-4 rounded-lg shadow-lg py-2 flex justify-between items-center px-4">
            <button
              onClick={prevJobs}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition"
            >
              <ArrowBigLeft className="text-white" size={24} />
            </button>

            <button
              onClick={nextJobs}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition rotate-180"
            >
              <ArrowBigLeft className="text-white" size={24} />
            </button>
          </div>
        </div>

        <div
          style={robotoStyle}
          className="jobs-found w-1/2 py-1 space-y-3 px-1"
        >
          {isFetchingJobs ? (
            // Skeletons
            <div className="w-full">
              {Array.from({ length: 4 }).map((_, idx) => (
                <JobCardSkeleton key={idx} />
              ))}
            </div>
          ) : visibleItems?.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No jobs match your filters or No Jobs exists
            </div>
          ) : (
            <div className="w-full px-2">
              <h1
                style={orbitronStyle}
                className="text-3xl text-white font-bold px-6 mb-4"
              >
                Available Gigs
              </h1>

              <div className="jobs-found  space-y-3 px-1">
                {visibleItems.map((item, idx) => (
                  <div
                    onClick={() => fetchJobPage(item?.jobId)}
                    key={idx}
                    className="
                                                    w-full
                                                    rounded-md
                                                    relative
                                                    overflow-hidden
                                                    dark:bg-[#0f121e]
                                                    p-5
                                                    shadow-lg
                                                    cursor-pointer
                                                    flex
                                                    flex-col
                                                    gap-7
                                                    transition-all
                                                    duration-300
                                                    hover:shadow-blue-500/40
                                                "
                  >
                    <div className="absolute inset-0.5 rounded-md pointer-events-none border-snake"></div>

                    <div
                      className="
                                                    flex
                                                    flex-col
                                                    sm:flex-row
                                                    sm:items-start
                                                    gap-4
                                                    relative
                                                    z-10
                                                "
                    >
                      <img
                        src={
                          item?.clientDetails?.companyDetails?.logoUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${item?.clientAddress}`
                        }
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-md object-cover shrink-0 mx-auto sm:mx-0"
                        alt="Role Visual"
                      />

                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <h3
                          className="text-lg sm:text-xl font-bold text-slate-100 dark:text-white mb-1"
                          style={orbitronStyle}
                        >
                          {item.title}
                        </h3>

                        <div
                          className="
                                                            flex
                                                            flex-wrap
                                                            items-center
                                                            justify-center
                                                            sm:justify-start
                                                            gap-2
                                                            text-xs
                                                            sm:text-sm
                                                            text-gray-400
                                                            truncate
                                                        "
                          style={robotoStyle}
                        >
                          <span className="text-blue-200 font-medium">
                            by{" "}
                            <em className="not-italic">
                              {item?.clientDetails?.companyDetails?.companyName}
                            </em>
                          </span>

                          <span className="opacity-50">•</span>

                          <span className="">
                            Posted:{" "}
                            <span className="font-semibold text-gray-200">
                              {item.createdAt?.slice(0, 10)}
                            </span>
                          </span>

                          <span className="opacity-50">•</span>

                          <span className="">
                            Budget:{" "}
                            <span className="font-semibold text-gray-200">
                              ${item.budget}
                              {item.budgetType === "hourly" ? "/hr" : ""}
                            </span>
                          </span>

                          <span
                            className="
                                                    ml-auto sm:ml-2
                                                    text-xs
                                                    px-2 py-0.5
                                                    border
                                                    border-gray-700
                                                    rounded-full
                                                "
                          >
                            Fixed
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1 z-10 justify-center sm:justify-start">
                      {item.skills.map((skill, id) => (
                        <span
                          key={id}
                          className="
                                                    inline-block
                                                    px-3 py-1 text-xs
                                                    bg-[#1e2642]
                                                    text-white
                                                    rounded-full
                                                    tracking-wide
                                                "
                          style={robotoStyle}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BrowseJobs;
