import { config } from 'dotenv';
import connectDB from "./db/connectDB.js"
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import upload from './multer.js';
import fs from 'fs';
import path from 'path'; 
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


config();

import {User} from './models/user.model.js';
import {TravelStory} from './models/travelStory.model.js';

import authenticateToken from './utilities.js';
import { error } from 'console';

connectDB();

const app=express();
app.use(express.json());
app.use(cors({origin: "*"}));

//create Account (Tested)
app.post("/create-account", async (req, res) => {
    const { fullName, email, password } = req.body;

    if(!fullName || !email || !password){
        return res
                .status(400)
                .json({
                    erro:true, 
                    message: "All feilds are required"
                });
    }

    const isUser = await User.findOne({email});
    if(isUser){
        return res
                .status(400)
                .json({
                    erro:true,
                    message: "User already exists" 
                })
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
        fullName,
        email,
        password:hashedPassword
    })

    await user.save();

    const accessToken = jwt.sign(
        {
            userId : user._id
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : "72h"
        }
    )

    return res.status(200).json({
        error : false,
        user : {
            fullName: user.fullName,
            email: user.email
        },
        accessToken,
        message : "Registration Successful"
    });
})

//Login (Tested)
app.post("/login", async (req, res) => {
    const {email, password } = req.body;

    if(!email || !password){
        return res
                .status(400)
                .json({
                    erro:true, 
                    message: "email and password are required"
                });
    }

    const user = await User.findOne({email});

    if(!user){
        return res
                .status(400)
                .json({
                    erro:true,
                    message: "User not found" 
                });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
        return res.status(400).json({
            message : "Password is invalid"
        })
    }

    const accessToken = jwt.sign(
        {
            userId : user._id
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : "72h"
        }
    );

    return res.status(200).json({
        error : false,
        message : "Login Successful",
        user : {
            fullName : user.fullName,
            email : user.email 
        },
        accessToken
    })
})

//Get User (Tested)
app.get("/get-user", authenticateToken, async (req, res) => {
    // Make sure req.user has the necessary information
    if (!req.user) {
        console.log("User not found in request, Unauthorized access.");
        return res.sendStatus(401); // Unauthorized
    }

    const { userId } = req.user;

    try {
        const isUser = await User.findOne({ _id: userId });

        if (!isUser) {
            console.log("User not found in database");
            return res.sendStatus(401); // Unauthorized
        }

        return res.status(200).json({
            user: isUser,
            message: "User fetched successfully",
        });
    } catch (error) {
        console.log("Error while fetching user:", error);
        return res.sendStatus(500); // Internal Server Error
    }
});

//Add Travel Story (Tested)
app.post("/add-travel-story", authenticateToken, async (req, res) => {
   const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
   const { userId } = req.user;

   if(!title || !story || !visitedLocation || !imageUrl || !visitedDate){
        return res.status(400).json({
            error: true,
            message: "All feilds are required"
        });
   }

   const parsedVisitedDate = new Date(parseInt(visitedDate));
   
   try {
        const travelStory = new TravelStory({
            title, 
            story, 
            visitedLocation, 
            imageUrl, 
            visitedDate: parsedVisitedDate,
            userId
        });

        await travelStory.save();

        res.status(201).json({
            story: travelStory,
            message : "Added successfully"
        })

   } catch (error) {
        res.status(401).json({
            error : true,
            message : error.message
        })
   }
});

//Get All Stories (Tested)
app.get("/get-all-stories", authenticateToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const travelStories = await TravelStory.find({userId : userId}).sort({
            isFavourite : -1
        })
        res.status(200).json({
            stories : travelStories
        })
    } catch (error) {
        res.status(500).json({
            error : true,
            message : error.message
        });
    }
});

//Route to Handle Image Upload
app.post("/image-upload", upload.single("image"), async (req, res) => {
    try {
        if(!req.file){
            return res.status(400).json({
                error: true,
                message: "No image uploded"
            });
        }

        const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`

        res.status(200).json({ imageUrl });
    } catch (error) {
        res.status(500).json({
            error : true,
            message : error.message
        });
    }
});

//Delete an Image from Upload Folder
app.delete("/delete-image", async(req, res) => {
    const { imageUrl } = req.query;

    if(!imageUrl){
        return res.status(400).json({
            error: true,
            message: "image url parameter is required"
        });
    }

    try {
        const filename = path.basename(imageUrl);
        const filePath = path.join(__dirname, "uploads", filename);

        if(fs.existsSync(filePath)){
            fs.unlinkSync(filePath);
            res.status(200).json({
                message: "Image deleted successfully"
            });
        }
        else{
            res.status(200).json({
                error: true,
                message: "Image not found"
            })
        }
    } catch (error) {
        res.status(500).json({
            error : true,
            message : error.message
        });
    }
})

//Save Static Files From the Uploads and Assets Directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assests", express.static(path.join(__dirname, "assests")));


//Edit Travel Story (Tested)
app.put("/edit-story/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
    const { userId } = req.user;

   if(!title || !story || !visitedLocation || !visitedDate){
        return res.status(400).json({
            error: true,
            message: "All feilds are required"
        });
   }

   const parsedVisitedDate = new Date(parseInt(visitedDate));

   try {
        const travelStory = await TravelStory.findOne({
                _id: id, 
                userId: userId
            });

        if(!travelStory){
            res.status(404).json({
                error: true,
                message: "Travel Story Not Found"
            })
        }
       
        travelStory.title = title;
        travelStory.story = story;
        travelStory.visitedLocation = visitedLocation;
        travelStory.imageUrl = imageUrl;
        travelStory.visitedDate = parsedVisitedDate;

        await travelStory.save();
        res.status(200).json({
            story: travelStory,
            message: "Updated Successfully"
        })
   } catch (error) {
        res.status(500).json({
            error : true,
            message : error.message
        });
   }
});

//Delete travel Story (Tested)
app.delete("/delete-story/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;

    try {
        const travelStory = await TravelStory.findOne({
            _id: id, 
            userId: userId
        });

        if(!travelStory){
            res.status(404).json({
                error: true,
                message: "Travel Story Not Found"
            })
        }

        await travelStory.deleteOne({ _id: id, userId: userId });

        const imageUrl = travelStory.imageUrl;
        const filename = path.basename(imageUrl);

        const filePath = path.join(__dirname, 'uploads', filename);

        fs.unlink(filePath, (err) => {
            if(err) console.error("Failed to delete image file : ", err);
        });

        res.status(200).json({
            message : "Travel Story Deleted Successfully"
        })

    } catch (error) {
        res.status(500).json({
            error : true,
            message : error.message
        });
    }
});

//Update isFavourite (Tested)
app.put("/update-is-favourite/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { isFavourite } = req.body;
    const { userId } = req.user;

   try {
        const travelStory = await TravelStory.findOne({
                _id: id, 
                userId: userId
            });

        if(!travelStory){
            res.status(404).json({
                error: true,
                message: "Travel Story Not Found"
            })
        }
       
        travelStory.isFavourite = isFavourite;

        await travelStory.save();

        res.status(200).json({
            story: travelStory,
            message: "Updated Successfully"
        })
   } 
   catch (error) {
        res.status(500).json({
            error : true,
            message : error.message
        });
   }
});

//Search travel Stories (Tested)
app.get("/search", authenticateToken, async (req, res) => {
    const { query } = req.query;
    const { userId } = req.user;

    if(!query){
        res.status(404).json({
            error : true,
            message : "Query is Required"
        });
    }

    try {
        const searchResults = await TravelStory.find({
            userId : userId,
            $or : [
                { title: { $regex : query, $options : 'i'} },
                { story: { $regex : query, $options : 'i'} },
                { visitedLocation: { $regex : query, $options : 'i'} }
            ]
        }).sort({ isFavourite : -1 });

        res.status(200).json({
            stories : searchResults
        });
    } 
    catch (error) {
        res.status(500).json({
            error : true,
            message : error.message
        });
    }
});

//Filter Travel Stories by Date Range (Tested)
app.get("/travel-stories/filter", authenticateToken, async (req, res) => {
    const { startDate, endDate } = req.query;
    const { userId } = req.user;

    try {
        const start = new Date(parseInt(startDate));
        const end = new Date(parseInt(endDate));
        end.setHours(23, 59, 59, 999);  // Extend to end of day

        console.log("Start Date:", start);
        console.log("End Date:", end);

        const filteredStories = await TravelStory.find({
            userId: userId,
            visitedDate: { $gte: start, $lte: end }
        }).sort({ isFavourite: -1 });

        res.status(200).json({
            stories: filteredStories
        });
    } 
    catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});

app.listen(8000);


