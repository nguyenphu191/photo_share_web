import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Comment from './Comment';
import { v4 as uuidv4 } from 'uuid';

const UserPhotos = ({ userId }) => {
    const [user, setUser] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [newComments, setNewComments] = useState({});

    const userLogin = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/api/photo/photosOfUser/${userId}`);
                setPhotos(res.data);
            } catch (error) {
                console.error('Error fetching user and photos:', error);
            }
        };

        fetchPhotos();

        const fetchUser = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/api/user/${userId}`);
                setUser(res.data);
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };

        fetchUser();
    }, [userId]);

    const handleCommentChange = (event, photoId) => {
        const { value } = event.target;
        setNewComments(prevState => ({
            ...prevState,
            [photoId]: value,
        }));
    };

    const handleCommentPost = async (photoId) => {
        if (newComments[photoId] && userLogin) {
            const newComment = {
                _id: uuidv4(),
                userId: userLogin._id,
                comment: newComments[photoId],
                date_time: new Date().toISOString(),
                photo_id: photoId,
            };

            try {
                const res = await axios.post(`http://localhost:8000/api/photo/commentsOfPhoto/${photoId}`, newComment);
                
                // Update the photo's comments locally without refreshing the page
                setPhotos(prevPhotos => prevPhotos.map(photo => {
                    if (photo._id === photoId) {
                        return {
                            ...photo,
                            comments: [...(photo.comments || []), res.data],
                        };
                    }
                    return photo;
                }));

                // Clear the comment input
                setNewComments(prevState => ({
                    ...prevState,
                    [photoId]: '',
                }));
            } catch (error) {
                console.error('Error posting comment:', error);
            }
        }
    };

    return (
        <div className="userphoto">
            <div className="photoList">
                {photos.map(photo => (
                    <div className="photoinfor" key={photo._id}>
                        <div className="user2">
                            <img src={`/images/${user.last_name ? user.last_name.toLowerCase() : 'default'}.jpg`} alt="User Avatar" />
                            <div className="userDetails">
                                <span>{user.first_name}</span>
                            </div>
                        </div>
                        <img src={photo.file_name} alt="User Photo" />
                        <h5>{photo.date_time}</h5>
                        <h5>Comment:</h5>
                        <ul>
                            <div className='commentList'>
                                {photo.comments && photo.comments.map(comment => (
                                    <li key={comment._id}>
                                        <Comment comment={comment} /> 
                                    </li>
                                ))}
                            </div>
                        </ul>
                        <div className="addcomment">
                            <input
                                type="text"
                                name="comment"
                                placeholder="Add a comment"
                                onChange={(e) => handleCommentChange(e, photo._id)}
                                value={newComments[photo._id] || ''}
                            />
                            <button onClick={() => handleCommentPost(photo._id)}>Post</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserPhotos;
