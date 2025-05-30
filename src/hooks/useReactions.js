import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const useReactions = (photoId, currentUser) => {
  const [reactions, setReactions] = useState([]);
  const [reactionStats, setReactionStats] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch user's reaction for this photo
  const fetchUserReaction = useCallback(async () => {
    if (!photoId || !currentUser?._id) {
      setUserReaction(null);
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:8000/api/reaction/${photoId}/user/${currentUser._id}`,
        { timeout: 5000 }
      );

      if (response.data.hasReaction) {
        setUserReaction(response.data.reaction);
      } else {
        setUserReaction(null);
      }
    } catch (error) {
      console.error('Lỗi khi lấy reaction của user:', error);
      setUserReaction(null);
    }
  }, [photoId, currentUser]);

  // Cập nhật reactions từ props hoặc fetch mới
  const updateReactions = useCallback((newReactions, newStats) => {
    setReactions(newReactions || []);
    setReactionStats(newStats || {});
  }, []);

  // Xử lý khi reaction thay đổi
  const handleReactionChange = useCallback(({ action, reactionType, oldReactionType, stats }) => {
    // Cập nhật stats
    setReactionStats(stats);

    // Cập nhật user reaction
    if (action === 'removed') {
      setUserReaction(null);
    } else {
      setUserReaction({ type: reactionType, date_time: new Date() });
    }

    // Có thể emit event để các component khác update
    // hoặc callback để parent component biết để update data
  }, []);

  // Fetch user reaction khi component mount
  useEffect(() => {
    fetchUserReaction();
  }, [fetchUserReaction]);

  return {
    reactions,
    reactionStats,
    userReaction,
    loading,
    updateReactions,
    handleReactionChange,
    fetchUserReaction
  };
};

export default useReactions;