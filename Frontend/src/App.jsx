import { useState } from 'react'
import SideBar from './components/SideBar'

import "./index.css"
import MyJobsTabs from './components/MyJobTabs'
import AiPoweredJobMatches from './components/AiPoweredJobMatches'


function App() {
  const [count, setCount] = useState(0)
  const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
  const robotoStyle = { fontFamily: 'Roboto, sans-serif' };



  return (
    <>
      <div className='dark:bg-[#0f111d] pt-6 flex bg-[#161c32] w-full'>
        <SideBar />

        <div className='flex w-full'>
          {/* AI-powered job matches section */}
          <AiPoweredJobMatches />

          {/* Center the MyJobsTabs component */}
          <div className='flex justify-center w-full'>
            <MyJobsTabs />
          </div>
        </div>
      </div>


    </>
  )
}

export default App

