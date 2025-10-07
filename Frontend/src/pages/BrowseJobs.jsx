import React from 'react'
import { useState, useEffect } from 'react'
import SideBar from '../components/SideBar'

import "../index.css"


function BrowseJobs() {
    const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
    const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

    const aiPoweredJobMatches = [
        {
            id: "proj-001",
            projectName: "SmartContract Auditor - DAO Governance with Solidity EVM",
            client: "Suraj Singh",
            jobType: "Fixed Price",
            budget: 7500,
            postedDate: "2025-09-28",
            skills: ["Solidity", "EVM", "Blockchain", "Smart Contracts", "DAO"],
            description: "Seeking an experienced Smart Contract auditor to review our new DAO governance module. Must have deep knowledge of Solidity and EVM security vulnerabilities."
        },
        {
            id: "proj-002",
            projectName: "React Frontend for E-commerce Dashboard",
            client: "Alice Johnson",
            jobType: "Hourly",
            budget: 55,
            postedDate: "2025-09-25",
            skills: ["React", "Redux", "TypeScript", "Tailwind CSS", "REST APIs"],
            description: "We need a skilled React developer to build a responsive and intuitive admin dashboard for our e-commerce platform. State management with Redux is a must."
        },
        {
            id: "proj-003",
            projectName: "UI/UX Design for a Mobile Fitness App",
            client: "FitLife Inc.",
            jobType: "Fixed Price",
            budget: 4800,
            postedDate: "2025-09-22",
            skills: ["Figma", "UI Design", "UX Research", "Prototyping", "Mobile Design"],
            description: "FitLife is looking for a creative UI/UX designer to craft a user-friendly and visually appealing interface for our upcoming mobile fitness application."
        },

    ];

    const [skills, setSkills] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [jobType, setJobType] = useState(""); // single select
    const [sortBy, setSortBy] = useState("");   // single select

    // results shown (applied filters)
    const [filteredJobs, setFilteredJobs] = useState(aiPoweredJobMatches);

    useEffect(() => {
        const skillSet = new Set();
        aiPoweredJobMatches.forEach(job => {
            job.skills.forEach(skill => skillSet.add(skill));
        });

        const sortedSkills = Array.from(skillSet).sort();

        setSkills(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(sortedSkills)) {
                return sortedSkills;
            }
            return prev;
        });

        // initialize results
        setFilteredJobs(aiPoweredJobMatches);
    }, []); // run once

    const toggleSkill = (skill) => {
        setSelectedSkills((prev) =>
            prev.includes(skill)
                ? prev.filter((s) => s !== skill)
                : [...prev, skill]
        );
    };

    const handleJobType = (type) => {
        setJobType(curr => curr === type ? "" : type);
    };

    const handleSortBy = (sort) => {
        setSortBy(curr => curr === sort ? "" : sort);
    };

    const applyFilters = () => {
        let results = [...aiPoweredJobMatches];

        if (selectedSkills.length > 0) {
            results = results.filter(job =>
                selectedSkills.every(s => job.skills.includes(s))
            );
        }

        if (jobType) {
            results = results.filter(job => job.jobType === jobType);
        }

        if (sortBy === "Date Posted") {
            results.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
        } else if (sortBy === "Budget") {
            results.sort((a, b) => b.budget - a.budget);
        }

        setFilteredJobs(results);
    };

    const resetFilters = () => {
        setSelectedSkills([]);
        setJobType("");
        setSortBy("");
        setFilteredJobs(aiPoweredJobMatches);
    };

    return (
        <div className='dark:bg-[#0f111d] pt-6 flex bg-[#161c32] w-full'>
            <SideBar />
            <div className='flex w-full flex-col lg:flex-row'>
                <div className='filters w-full lg:w-1/2 '>
                    <h1 style={orbitronStyle} className='text-3xl  text-white font-bold px-6 mb-4'>Filters</h1>
                    <div className='bg-[#161c32] dark:bg-[#0f111d]  border-1 border-white/20 m-4 rounded-lg shadow-lg py-1'>
                        <h1 style={robotoStyle} className='text-lg text-white font-bold mb-1  px-2'>Skill Tags</h1>
                        <div className='skills-filter flex flex-wrap  px-4 border-b border-gray-700 pb-4'>
                            {skills.map((skill, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => toggleSkill(skill)}
                                    className={`
                                        m-2 px-3 py-1.5 text-sm 
                                        rounded-full 
                                        shadow-md hover:shadow-lg  
                                        transition-all duration-300 
                                        focus:outline-none focus:ring-2 focus:ring-cyan-700 dark:focus:ring-blue-700 focus:ring-opacity-50
                                        ${selectedSkills.includes(skill) 
                                          ? 'bg-cyan-700 dark:bg-blue-800 text-white ring-2 dark:ring-blue-800 ring-cyan-700' 
                                          : 'bg-[#262f52] text-white dark:bg-gray-900 dark:hover:bg-blue-700 hover:bg-cyan-700'}
                                    `}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                        <div>
                            <h1 style={robotoStyle} className='text-lg text-white font-bold mb-1  px-2 mt-4'>Job Type</h1>
                            <div className='job-type-filter flex flex-wrap  px-4  pb-4'>
                                {["Fixed Price", "Hourly", "Milestone"].map((type, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleJobType(type)}
                                        className={`
                                            m-2 px-3 py-1.5 text-sm 
                                            rounded-full 
                                            shadow-md hover:shadow-lg  
                                            transition-all duration-300 
                                            focus:outline-none focus:ring-2 focus:ring-cyan-700 dark:focus:ring-blue-700 focus:ring-opacity-50
                                            ${jobType === type ?  'bg-cyan-700 dark:bg-blue-800 text-white ring-2 dark:ring-blue-800 ring-cyan-700' 
                                          : 'bg-[#262f52] text-white dark:bg-gray-900 dark:hover:bg-blue-700 hover:bg-cyan-700'}
                                        `}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>


                    </div>
                    <div className='bg-[#161c32] dark:bg-[#0f111d]  border-1 border-white/20 m-4 rounded-lg shadow-lg py-1'>
                        <h1 style={robotoStyle} className='text-lg text-white font-bold mb-1  px-2 mt-4'>Sort By</h1>
                        <div className='sort-by-filter flex flex-wrap px-4 pb-4'>
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
                                           ${sortBy === sort  ? 'bg-cyan-700 dark:bg-blue-800 text-white ring-2 dark:ring-blue-800 ring-cyan-700' 
                                          : 'bg-[#262f52] text-white dark:bg-gray-900 dark:hover:bg-blue-700 hover:bg-cyan-700'}
                                        `}
                                >
                                    {sort}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className='bg-[#161c32] flex justify-between items-center dark:bg-[#0f111d]  border-1 border-white/20 m-4 rounded-lg shadow-lg p-4'>
                        <div className='flex gap-3'>
                            <button
                                className='
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
                                '
                                onClick={applyFilters}
                            >
                                Apply Filters
                            </button>

                            <button
                                className='
                                    px-4 py-2 text-lg 
                                    bg-gray-700 text-white
                                    rounded-lg 
                                    shadow-md hover:shadow-lg  
                                    transition-all duration-300 
                                    hover:bg-gray-600 
                                    transform hover:scale-105  
                                    focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-opacity-50
                                '
                                onClick={resetFilters}
                            >
                                Reset
                            </button>
                        </div>

                        <div className='text-sm text-gray-300'>
                            Showing <span className='font-bold text-white'>{filteredJobs.length}</span> results
                        </div>
                    </div>
                </div>

                <div className='w-full lg:w-1/2 px-2'>
                    <h1 style={orbitronStyle} className='text-3xl  text-white font-bold px-6 mb-4'>Available Gigs</h1>
                    <div style={robotoStyle} className='jobs-found py-1 space-y-3 px-1'>
                        {filteredJobs.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">No jobs match your filters.</div>
                        ) : (
                            filteredJobs.map((item, idx) => (
                                <div key={idx} className="
                                max-w-lg 
                                rounded-xl 
                                relative 
                                overflow-hidden
                                dark:bg-[#0f121e] 
                                p-6 
                                shadow-lg 
                                cursor-pointer 
                                flex 
                                flex-col 
                                gap-4
                                transition-all 
                                duration-300 
                                hover:shadow-blue-500/40
                            ">
                                    {/* animated border */}
                                    <div className="absolute inset-0 rounded-xl pointer-events-none border-snake"></div>

                                    {/* header: image + title + meta */}
                                    <div className="flex items-start gap-4 relative z-10">
                                        <img
                                            src={`https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80`}
                                            className="w-20 h-24 rounded-md object-cover flex-shrink-0"
                                            alt="Role Visual"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3
                                                className="text-xl font-bold text-slate-100 dark:text-white mb-1"
                                                style={orbitronStyle}
                                            >
                                                {item.projectName}
                                            </h3>

                                            <div className="flex items-center gap-3 text-sm text-gray-400 truncate" style={robotoStyle}>
                                                <span className="text-base text-blue-200 font-medium">by <em className="not-italic">{item.client}</em></span>
                                                <span className="opacity-50">•</span>
                                                <span className="text-xs text-gray-400">Posted: <span className="font-semibold text-gray-200">{item.postedDate}</span></span>
                                                <span className="ml-auto text-xs px-2 py-0.5 border border-gray-700 rounded-full">{item.jobType}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* skills row */}
                                    <div className="flex flex-wrap gap-2 pt-1 z-10">
                                        {item.skills.map((skill, id) => (
                                            <span
                                                key={id}
                                                className="inline-block px-3 py-1 text-xs   bg-[#1e2642] text-white rounded-full tracking-wide"
                                                style={robotoStyle}
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
    )
}

export default BrowseJobs