/**
 * Feedback Card Component - CommunityPulse
 * Displays individual feedback item with voting and actions
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useVoting } from '../../hooks/useFeedback';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  ThumbsUp, MessageSquare, Calendar, User, 
  Eye, EyeOff, MoreVertical, CheckCircle, 
  Clock, AlertCircle, XCircle 
} from 'lucide-react';
import { formatDate, formatRelativeTime, SENTIMENT_STYLES, STATUS_STYLES } from '../../lib/utils';
import { cn } from '../../lib/utils';

export function FeedbackCard({ feedback, showActions = false }) {
  const { user, isAdmin } = useAuth();
  const { vote, removeVote, getUserVote, isVoting, isRemovingVote } = useVoting();
  const [userVote, setUserVote] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handleVote = async (type) => {
    try {
      if (userVote === type) {
        await removeVote(feedback.id);
        setUserVote(null);
      } else {
        await vote({ feedback_id: feedback.id, vote_type: type });
        setUserVote(type);
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const isLongMessage = feedback.message?.length > 200;
  const displayMessage = expanded || !isLongMessage 
    ? feedback.message 
    : feedback.message?.slice(0, 200) + '...';

  const statusIcons = {
    pending: <Clock className="w-4 h-4" />,
    in_progress: <AlertCircle className="w-4 h-4" />,
    resolved: <CheckCircle className="w-4 h-4" />,
    dismissed: <XCircle className="w-4 h-4" />
  };

  return (
    <Card className={cn(
      'border-l-4 transition-shadow hover:shadow-md',
      feedback.sentiment_label === 'Positive' && 'border-green-500',
      feedback.sentiment_label === 'Neutral' && 'border-yellow-500',
      feedback.sentiment_label === 'Negative' && 'border-red-500'
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            
            {/* Header: Category & Sentiment */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {feedback.category_name && (
                <span 
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: `${feedback.category_color}20`,
                    color: feedback.category_color 
                  }}
                >
                  {feedback.category_name}
                </span>
              )}
              
              <span className={cn(
                'text-xs font-medium px-2 py-1 rounded',
                SENTIMENT_STYLES[feedback.sentiment_label]
              )}>
                {feedback.sentiment_label === 'Positive' && '😊 '}
                {feedback.sentiment_label === 'Neutral' && '😐 '}
                {feedback.sentiment_label === 'Negative' && '😔 '}
                {feedback.sentiment_label}
              </span>

              {feedback.status && feedback.status !== 'pending' && (
                <span className={cn(
                  'text-xs font-medium px-2 py-1 rounded flex items-center gap-1',
                  STATUS_STYLES[feedback.status]
                )}>
                  {statusIcons[feedback.status]}
                  {feedback.status.replace('_', ' ')}
                </span>
              )}

              {feedback.is_anonymous ? (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  Anonymous
                </span>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {feedback.author_username || 'Member'}
                </span>
              )}
            </div>

            {/* Message */}
            <p className="text-gray-800 dark:text-gray-200 mb-3 leading-relaxed">
              {displayMessage}
            </p>

            {isLongMessage && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(feedback.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(feedback.created_at)}
              </span>
              {feedback.sentiment_score && (
                <span>
                  AI Confidence: {Math.round(feedback.sentiment_score * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Voting & Actions */}
          <div className="flex flex-col items-center gap-2">
            {/* Vote Button */}
            {!feedback.is_anonymous && user && user.id !== feedback.user_id && (
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleVote('up')}
                  disabled={isVoting || isRemovingVote}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    userVote === 'up' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  title="Upvote"
                >
                  <ThumbsUp className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {feedback.upvotes || 0}
                </span>
              </div>
            )}

            {/* Actions Menu (Admin/Owner) */}
            {showActions && (
              <div className="relative">
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreVertical className="w-4 h-4" />
                </Button>
                {/* TODO: Add dropdown menu for edit/delete/status */}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}