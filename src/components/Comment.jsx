import React, { useEffect, useState } from 'react';
import axios from 'axios';



function Comment({comment}) {
    const [username, setUserName] = useState("");
    useEffect(() => {
        const fetchUserCom = async () => {
            try{
                console.log(comment.user_id);
                const res = await axios.get(`http://localhost:8000/api/user/${comment.user_id}`);
                setUserName(res.data.first_name);
            } catch(e){
                console.error(`error to fetch user with`)
            }
        };
        fetchUserCom();  
    }, []);
    return(
        <div className="comment">
            <p>{username}</p>
            <span>{comment.comment}</span>
            <p>{comment.date_time}</p>
        </div>
    )
}
export default Comment;