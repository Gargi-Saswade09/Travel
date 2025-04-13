import multer from "multer";
import path from 'path';

const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, "./uploads/");
        console.log("working1");
    },
    filename : (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
        console.log("working2");
    }
})

const fileFilter = (req, file, cb) => {
    if(file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only Images are allowed"), false);
}

const upload = multer({ storage, fileFilter});
export default upload;