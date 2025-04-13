import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar.jsx'
import { data, useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance.js';
import TravelStoryCard from '../../components/Cards/TravelStoryCard.jsx'
import { ToastContainer, toast } from 'react-toastify';
import { MdAdd } from 'react-icons/md';
import Modal from 'react-modal';
import AddEditTravelStory from './AddEditTravelStory.jsx';
import ViewTravelStory from './ViewTravelStory.jsx';
import EmptyCard from '../../components/Cards/EmptyCard.jsx';
import { DayPicker } from 'react-day-picker';
import moment from 'moment';
import 'react-day-picker/dist/style.css';
import FilterInfoTitle from '../../components/Cards/FilterInfoTitle.jsx'
import { getEmptyCardMessage } from '../../utils/helper.js'

function Home() {

  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [allStories, setAllStories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [dateRange, setDateRange] = useState({from : null, to : null});
  const [openAddEditModel, setOpenAddEditModel] = useState({
    isShown:false,
    type:"add",
    data:null
  });

  const [openViewModel, setOpenViewModel] = useState({
    isShown:false,
    data:null
  });

  const getUserInfo = async() => {
    try {
      const response = await axiosInstance.get("/get-user");
      if(response.data && response.data.user){
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if(error.response && error.response.status === 401){
        localStorage.clear();
        navigate("/login");
      }
    }
  }

  const getAllTravelStories = async() => {
    try {
      const response = await axiosInstance.get("/get-all-stories");
      if(response.data && response.data.stories){
        setAllStories(response.data.stories);
      }
    } catch (error) {
     console.log("An unexpected error ouccured. Please try again"); 
    }
  }

  const handleEdit = (data) => {
    console.log(data);
    setOpenAddEditModel({ isShown : true, type: "edit", data: data});
  } 

  const handleViewStory = (data) => {
    setOpenViewModel({ isShown: true, data});
  } 

  const updateIsFavourite = async(storyData) => {
    try {
      const storyId = storyData._id;
      const response = await axiosInstance.put("/update-is-favourite/" + storyId,
        {
          isFavourite : !storyData.isFavourite
        }
      );

      if(response.data && response.data.story){
        toast("Story Updated Successfully");
        if(filterType === "search" && searchQuery){
          onSearchStory(searchQuery);
        }
        else if(filterType === "date"){
          filterStoriesByDate(dateRange);
        }
        else{
          getAllTravelStories();
        }
      }
    } catch (error) {
      console.log("An unkown error occured. Please try again.");
      console.log(error);
    }
  } 

  const deleteTravelStory = async(data) => {
    const storyId = data._id;

    try {
      const response = await axiosInstance.delete("/delete-story/" + storyId);

      if(response.data && !response.data.error){
        toast.error("Story Deleted Successfully");
        setOpenViewModel((prevState) => ({...prevState, isShown: false}));
        getAllTravelStories();
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again");
    }
  }

  const onSearchStory = async(query) => {
    try {
      const response = await axiosInstance.get("search", {
        params : {
          query
        }
      });

      if(response.data && response.data.stories){
        setFilterType("search");
        setAllStories(response.data.stories);
      }

    } catch (error) {
      console.log("An unexpected error occurred. Please try again");
    }
  }

  const handleClearSearch = () => {
    setFilterType("");
    getAllTravelStories();
  }

  const filterStoriesByDate = async(day) => {
    try {
      const startDate = day.from ? moment(day.from).valueOf() : null;
      const endDate = day.to ? moment(day.to).valueOf() : null;

      if(startDate && endDate){
        const response = await axiosInstance.get("travel-stories/filter", {
          params : {startDate, endDate}
        });

        if(response.data && response.data.stories){
          setFilterType("date");
          setAllStories(response.data.stories);
        }
      }

    } catch (error) {
      console.log("An unexpected error occurred. Please try again");
    }
  }

  const handleDayClick = (day) => {
    setDateRange(day);
    filterStoriesByDate(day);
  }

  const resetFilter = () => {
    setDateRange({from : null, to : null});
    setFilterType("");
    getAllTravelStories();
  }

  useEffect(() => {
    getUserInfo();
    getAllTravelStories();
  }, []);

  return (
    <>
      <Navbar 
        userInfo={userInfo} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onSearchNote={onSearchStory}
        handleClearSearch={handleClearSearch}
      />

      <div className='container mx-auto py-10'>

        <FilterInfoTitle 
          filterType={filterType}
          filterDates={dateRange}
          onClear={() => resetFilter()}
        />

        <div className='flex gap-7'>
          <div className='flex-1'>
            {allStories.length > 0 ? (
              <div className='grid grid-cols-2 gap-4'>
                {allStories.map((item) => (
                  <TravelStoryCard 
                    key={item._id}
                    imageUrl={item.imageUrl}
                    title={item.title}
                    story={item.story}
                    date={item.visitedDate}
                    visitedLocation={item.visitedLocation}
                    isFavourite={item.isFavourite}
                    onEdit={() => handleEdit(item)}
                    onClick={() => handleViewStory(item)} 
                    onFavouriteClick={() => updateIsFavourite(item)}
                  />
                ))}
              </div>
            ) : (
              <EmptyCard 
                imgSrc='Frontend\Travel-Story\src\assets\images\EmptyImg.webp' 
                message={getEmptyCardMessage(filterType)} 
              />
            )}
          </div>

          <div className='w-[350px]'>
            <div className='bg-white border border-slate-200 shadow-lg shadow-slate-200/60 rounded-lg'>
              <div className='p-3'>
                <DayPicker
                  captionLayout="dropdown-buttons"
                  mode="range"
                  selected={dateRange} 
                  onSelect={handleDayClick}
                  pagedNavigation
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={openAddEditModel.isShown}
        onRequestClose={() => {}}
        style={{
          overlay:{
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            zIndex:999
          }
        }}
        appElement={document.getElementById("root")}
        className="model-box"
      >
        <AddEditTravelStory
          type={openAddEditModel.type}
          storyInfo={openAddEditModel.data} 
          onClose={() => {
            setOpenAddEditModel({ isShown : false, type: "add", data: null})
          }}
          getAllTravelStories={getAllTravelStories}
        />
      </Modal>

      <Modal
        isOpen={openViewModel.isShown}
        onRequestClose={() => {}}
        style={{
          overlay:{
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            zIndex:999
          }
        }}
        appElement={document.getElementById("root")}
        className="model-box"
      >
        <ViewTravelStory
          storyInfo={openViewModel.data || null} 
          onClose={() => {
            setOpenViewModel((prevState) => ({...prevState, isShown:false}));
          }}
          onEditClick={() => {
            setOpenViewModel((prevState) => ({...prevState, isShown:false}));
            handleEdit(openViewModel.data || null);
          }}
          onDeleteClick={() => {
            deleteTravelStory(openViewModel.data || null);
          }}
        />
      </Modal>

      <button
         className='w-16 h-16 flex items-center justify-center rounded-full bg-primary hover:bg-cyan-400 fixed right-10 bottom-10'
         onClick={() => 
          setOpenAddEditModel({isShown:true, type:"add", data:null})
         }
      >
        <MdAdd className='text-[32px] text-white' />
      </button>

      <ToastContainer />
    </>
  )
}

export default Home