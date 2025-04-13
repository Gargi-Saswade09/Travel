import axiosInstance from "./axiosInstance";


const upoladImage = async(imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const res = await axiosInstance.post('/image-upload', formData, {
            headers : {
                'Content-Type' : 'multipart/form-data'
            }
        });
        return res.data;
    } catch (error) {
        console.error("Error in uploading the image", error);
        throw error;
    }
}

export default upoladImage;