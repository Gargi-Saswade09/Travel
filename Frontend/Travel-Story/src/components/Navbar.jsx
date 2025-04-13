import React from 'react'
import Logo from "../assets/images/Logo.jpg";
import ProfileInfo from "./Cards/ProfileInfo.jsx"
import { useNavigate } from 'react-router-dom';
import SearchBar from './Input/SearchBar.jsx';

function Navbar({ userInfo, searchQuery, setSearchQuery, onSearchNote, handleClearSearch }) {

  const isToken = localStorage.getItem("token");
  const navigate = useNavigate();

  const onLogout = () => {
   localStorage.clear(); 
   navigate("/login");
  }

  const handleSearch = () => {
    if(searchQuery){
      onSearchNote(searchQuery);
    }
  }

  const onClearSearch = () => {
    handleClearSearch();
    setSearchQuery("")
  }

  return (
    <div className='bg-white flex items-center justify-between px-6 py-2 drop-shadow sticky top-0 z-10'>
        <img src={Logo} alt="Travel-Story" className='h-14' />

        {
          isToken && (
            <>

              <SearchBar 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                handleSearch={handleSearch}
                onClearSearch={onClearSearch}
              />
              
              <ProfileInfo userInfo={userInfo} onLogout={onLogout} /> {" "}
            </>
          )
        }
    </div>
  )
}

export default Navbar