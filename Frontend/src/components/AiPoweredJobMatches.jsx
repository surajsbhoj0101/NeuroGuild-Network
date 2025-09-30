import React from 'react'
import logoImg from "../assets/images/logo.png"

function AiPoweredJobMatches() {
    const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
    const robotoStyle = { fontFamily: 'Roboto, sans-serif' };
    const aiPoweredJobMatches = [
        {
            name: "SmartContract Auditor - DAO Governance with Solidity EVM",
            skills: ["Solidity", "Hardhat", "EVM", "Security Auditing"],
            amount: "$300-400 /hr"
        },
        {
            name: "AI-Enhanced UI/UX Designer for dApp",
            skills: ["Figma", "AI Design Tools", "User Research", "Web3 UI"],
            amount: "$70-120 /hr"
        },
        {
            name: "Machine Learning Engineer for DeFi Analytics",
            skills: ["Python", "TensorFlow", "SQL", "Financial Modeling"],
            amount: "$4,000-7,000 project"
        },
        {
            name: "Generative AI Artist for NFT Collection",
            skills: ["Midjourney", "Prompt Engineering", "Photoshop", "NFT Standards"],
            amount: "$1,500-3,000 project"
        },
        {
            name: "Full-Stack Web3 Developer with AI Integration",
            skills: ["React", "Node.js", "Ethers.js", "Python", "API Integration"],
            amount: "$8,000-12,000 project"
        },
        {
            name: "AI Chatbot Developer for Web3 Customer Support",
            skills: ["Dialogflow", "Python", "Node.js", "WebSockets"],
            amount: "$60-90 /hr"
        },
        {
            name: "Blockchain Data Analyst with AI-Powered Insights",
            skills: ["SQL", "Dune Analytics", "Python", "Power BI", "Machine Learning"],
            amount: "$80-140 /hr"
        },
        {
            name: "AI Ethics Consultant for Decentralized Systems",
            skills: ["AI Ethics", "Blockchain Governance", "Auditing", "Technical Writing"],
            amount: "$150-250 /hr"
        }
    ];
    return (
        <div className='w-[80%]'>
            <div className='px-3 left-section'>
                <div>
                    <p style={orbitronStyle} className='text-white text-2xl tracking-widest'>AI-POWERED JOB MATCHES</p>
                    <p style={robotoStyle} className='text-gray-200'>For You, Jane Doe</p>
                </div>

                <div style={robotoStyle} className='jobs-found py-4 space-y-3 px-1'>
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

                            <div className="flex items-center gap-4 relative z-10">
                                <img src={logoImg} className="w-12 h-12 rounded-md object-cover" alt="Role Logo" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-100 dark:text-white">
                                        {item.name}
                                    </h3>
                                </div>
                            </div>

                            <div className="relative z-10 space-x-4 flex items-center justify-between pt-2">
                                {/* Container for skill tags */}
                                <div className="flex items-center gap-2">
                                    {
                                        item.skills.map((skill, id) => (
                                            <span key={id} className="inline-block px-3 py-1 text-xs font-medium text-cyan-200 bg-cyan-900/50 rounded-full">
                                                {skill}
                                            </span>
                                        ))
                                    }
                                </div>

                                <span className="text-base font-semibold text-white">
                                    {item.amount}
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