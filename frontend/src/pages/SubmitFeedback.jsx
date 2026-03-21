/**
 * Submit Feedback Page - CommunityPulse
 * Feedback submission form with AI sentiment preview
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { useFeedback, useCategories } from '../hooks/useFeedback';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Textarea } from '../components/ui/Input';
import { 
  Send, MessageSquare, EyeOff, Eye, Smile, Frown, Meh, 
  AlertCircle, CheckCircle, Loader2, ArrowLeft 
} from 'lucide-react';
import { debounce } from '../lib/utils';
import { analyzeSentiment } from '../lib/api';
import { SENTIMENT_STYLES } from '../lib/utils';

// Form validation schema
const feedbackSchema = z.object({
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
  category_id: z.string().optional(),
  is_anonymous: z.boolean().default(true)
});

export function SubmitFeedback() {
  const [sentimentResult, setSentimentResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { submitFeedback, isSubmitting } = useFeedback();
  const {  categories, isLoading: categoriesLoading } = useCategories();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting: formSubmitting },
    reset,
    setValue
  } = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      message: '',
      category_id: '',
      is_anonymous: true
    }
  });

  const message = watch('message');
  const isAnonymous = watch('is_anonymous');

  // Character count
  const charCount = message?.length || 0;
  const minChars = 10;
  const maxChars = 2000;
  const isMessageValid = charCount >= minChars && charCount <= maxChars;

  // Analyze sentiment with debounce
  const analyzeSentimentDebounced = debounce(async (text) => {
    if (!text || text.length < minChars) {
      setSentimentResult(null);
      return;
    }

    setAnalyzing(true);
    try {
      const result = await analyzeSentiment(text);
      setSentimentResult(result);
    } catch (err) {
      console.error('Sentiment analysis failed:', err);
      setSentimentResult(null);
    } finally {
      setAnalyzing(false);
    }
  }, 800);

  useEffect(() => {
    if (message) {
      analyzeSentimentDebounced(message);
    } else {
      setSentimentResult(null);
    }
  }, [message]);

  const onSubmit = async (data) => {
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      await submitFeedback(data);
      setSubmitSuccess(true);
      
      // Show success message, then redirect
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { message: 'Feedback submitted successfully!' } 
        });
      }, 2000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit feedback. Please try again.');
    }
  };

  const getSentimentIcon = () => {
    if (!sentimentResult) return null;
    switch (sentimentResult.label) {
      case 'Positive':
        return <Smile className="w-8 h-8 text-green-500" />;
      case 'Negative':
        return <Frown className="w-8 h-8 text-red-500" />;
      default:
        return <Meh className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getSentimentColor = () => {
    if (!sentimentResult) return '';
    return SENTIMENT_STYLES[sentimentResult.label] || '';
  };

  // Loading state
  if (authLoading || categoriesLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading form...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl animate-slide-up">
          <CardContent className="p-8 text-center">
            <div className="bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Feedback Submitted!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for sharing your thoughts. Your feedback helps improve our community.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to dashboard...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* ===== PAGE HEADER ===== */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Submit Feedback
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Share your thoughts anonymously. Your voice matters.
          </p>
        </div>
      </div>

      {/* ===== ERROR ALERT ===== */}
      {submitError && (
        <Card className="border-l-4 border-red-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">Submission Failed</p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{submitError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== SUBMISSION FORM ===== */}
      <Card className="shadow-xl">
        <CardContent className="p-6 md:p-8">
          
          {/* AI Sentiment Preview */}
          {sentimentResult && (
            <div className={`mb-6 p-4 rounded-xl border-2 animate-fade-in ${getSentimentColor()}`}>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getSentimentIcon()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    AI Sentiment Analysis
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Detected: <span className="font-bold">{sentimentResult.label}</span> sentiment
                  </p>
                  {sentimentResult.confidence && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Confidence: {Math.round(sentimentResult.confidence * 100)}%
                    </p>
                  )}
                </div>
                {analyzing && (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category <span className="text-gray-400">(optional)</span>
              </label>
              <select
                {...register('category_id')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={categoriesLoading || isSubmitting || formSubmitting}
              >
                <option value="">Select a category...</option>
                {categories?.map(cat => (
                  <option 
                    key={cat.id} 
                    value={cat.id}
                    style={{ borderLeft: `4px solid ${cat.color}` }}
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose a category to help us route your feedback to the right team
              </p>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Message <span className="text-red-500">*</span>
              </label>
              <Textarea
                {...register('message')}
                placeholder="Share your thoughts, concerns, or suggestions..."
                rows={6}
                className={errors.message ? 'border-red-500' : ''}
                disabled={isSubmitting || formSubmitting}
              />
              
              {/* Character Count */}
              <div className="flex justify-between items-center mt-2">
                <p className={`text-xs ${
                  charCount < minChars 
                    ? 'text-red-500' 
                    : charCount > maxChars - 100 
                    ? 'text-yellow-500' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  Minimum {minChars} characters
                </p>
                <p className={`text-xs ${
                  charCount > maxChars ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  <span className={charCount >= minChars ? 'text-green-600 dark:text-green-400' : ''}>
                    {charCount}
                  </span>
                  /{maxChars}
                </p>
              </div>

              {/* Validation Message */}
              {errors.message && (
                <p className="text-sm text-red-500 mt-1">{errors.message.message}</p>
              )}

              {/* Writing Tips */}
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2">
                  💡 Tips for effective feedback:
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Be specific about the issue or suggestion</li>
                  <li>• Include context when relevant</li>
                  <li>• Suggest solutions if you have ideas</li>
                  <li>• Keep it respectful and constructive</li>
                </ul>
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <input
                {...register('is_anonymous')}
                type="checkbox"
                id="is_anonymous"
                className="w-5 h-5 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                disabled={isSubmitting || formSubmitting}
              />
              <label htmlFor="is_anonymous" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  {isAnonymous ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    Submit anonymously
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isAnonymous 
                    ? 'Your identity will be hidden from other users and admins. Recommended for sensitive feedback.' 
                    : 'Your username will be visible to admins. Choose this if you want follow-up contact.'}
                </p>
              </label>
            </div>

            {/* Privacy Notice */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    Your privacy matters
                  </p>
                  <p>
                    All feedback is encrypted and stored securely. AI analyzes sentiment only—no personal data is extracted from your message. 
                    {isAnonymous && ' Anonymous submissions cannot be traced back to you.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting || formSubmitting}
              disabled={isSubmitting || formSubmitting || !isMessageValid}
            >
              {isSubmitting || formSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing & Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>

            {/* Cancel Button */}
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/dashboard')}
              disabled={isSubmitting || formSubmitting}
            >
              Cancel
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ===== HELP SECTION ===== */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Need Help?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
                <MessageSquare className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">FAQs</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Find answers to common questions about submitting feedback
                </p>
                <Link to="/faq" className="text-sm text-primary-600 hover:underline dark:text-primary-400">
                  View FAQs →
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Guidelines</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Learn what makes effective feedback
                </p>
                <Link to="/guidelines" className="text-sm text-primary-600 hover:underline dark:text-primary-400">
                  Read Guidelines →
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}