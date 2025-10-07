import React from 'react'
import logoImg from "../assets/images/logo.png"

function AiPoweredJobMatches() {
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

    return (
        <div className='w-[80%]'>
            <div className='px-3 left-section'>
                <div>
                    <p style={orbitronStyle} className='text-white text-3xl tracking-widest font-extrabold mb-1'>AI-POWERED JOB MATCHES</p>
                    <p style={robotoStyle} className='text-white text-lg font-medium mb-6'>For You, Jane Doe</p>
                </div>

                <div style={robotoStyle} className='jobs-found py-1 space-y-3 px-1'>
                    {aiPoweredJobMatches.map((item, idx) => (
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
                                    src={logoImg} 
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

                            {/* footer: price aligned right */}
                            <div className="flex justify-end pt-2">
                                <span
                                    className="text-lg font-extrabold text-white"
                                    style={orbitronStyle}
                                >
                                    {item.jobType === "Hourly" ? `$${item.budget}/hr` : `$${item.budget}`}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default AiPoweredJobMatches