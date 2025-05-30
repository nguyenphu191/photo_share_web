import React from 'react';

const ReactionDisplay = ({ reactionStats = {}, onViewDetails }) => {
  const reactionTypes = {
    like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡'
  };

  const getTopReactions = () => {
    const topReactions = [];
    Object.entries(reactionStats).forEach(([type, count]) => {
      if (type !== 'total' && count > 0 && reactionTypes[type]) {
        topReactions.push({ type, count, emoji: reactionTypes[type] });
      }
    });
    return topReactions.sort((a, b) => b.count - a.count).slice(0, 3);
  };

  const topReactions = getTopReactions();
  const totalReactions = reactionStats.total || 0;

  if (totalReactions === 0) return null;

  return (
    <div className="reaction-display" onClick={() => onViewDetails && onViewDetails()}>
      <div className="reaction-emojis">
        {topReactions.map((reaction, index) => (
          <span key={reaction.type} className="reaction-emoji-item" style={{ zIndex: 3 - index }}>
            {reaction.emoji}
          </span>
        ))}
      </div>
      <span className="reaction-count">
        {totalReactions === 1 ? '1 người' : `${totalReactions} người`}
      </span>
    </div>
  );
};

export default ReactionDisplay;