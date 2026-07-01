import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', email: '' });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, email: user.email });
      setImagePreview(user.avatar);
    }
  }, [user]);

  // Helper function to get full image URL
  const getImageUrl = (avatarPath: string): string => {
    if (!avatarPath) return '';
    
    // If it's a data URL (preview), return as-is
    if (avatarPath.startsWith('data:')) {
      return avatarPath;
    }
    
    // If it already starts with http, return as-is
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    
    // If it starts with /, prepend backend URL
    if (avatarPath.startsWith('/')) {
      return `http://localhost:3002${avatarPath}`;
    }
    
    // Otherwise assume it's a relative path from backend
    return `http://localhost:3002/${avatarPath}`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setError('');
    setProfileImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    try {
      // Validate inputs
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }

      // Use the updateProfile function from AuthContext
      // It handles both File and Base64 formats
      if (profileImage) {
        // Upload file using the updateProfile function
        await updateProfile(formData.name, profileImage);
      } else {
        // Just update name
        await updateProfile(formData.name);
      }

      setSuccess('Profile updated successfully! 🎉');
      setProfileImage(null);

      // Show success message for 2 seconds, then reload to show updated image
      setTimeout(() => {
        setSuccess('');
        // Reload to ensure image displays with new URL
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Get proper image URL
  const displayImageUrl = getImageUrl(imagePreview || user.avatar);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and profile picture</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Success</p>
              <p className="text-green-700 text-sm mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Profile Picture Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                {/* Avatar Preview */}
                <div className="relative">
                  <img
                    src={displayImageUrl}
                    alt={user.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-purple-200"
                    onError={(e) => {
                      console.error('Image load error:', (e.target as HTMLImageElement).src);
                      // Fallback to gravatar if image fails
                      (e.target as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${user.email}`;
                    }}
                  />
                  <label
                    htmlFor="image-input"
                    className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 cursor-pointer transition-colors shadow-lg"
                    title="Change profile picture"
                  >
                    <Camera size={20} />
                  </label>
                </div>

                {/* Upload Info */}
                <div className="flex-1">
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading || isLoading}
                    className="hidden"
                  />
                  <p className="text-gray-600 text-sm mb-3">
                    Click the camera icon to upload a new profile picture.
                  </p>
                  <ul className="text-gray-500 text-xs space-y-1">
                    <li>✓ JPG, PNG, GIF, WebP supported</li>
                    <li>✓ Maximum file size: 5MB</li>
                    <li>✓ Recommended size: 400x400px</li>
                  </ul>
                  {profileImage && (
                    <p className="text-xs text-green-600 mt-3">
                      ✓ Image selected: {profileImage.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <hr className="my-8" />

            {/* Personal Information Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>

              {/* Full Name */}
              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={uploading || isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-gray-500 text-xs mt-2">Email cannot be changed</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={uploading || isLoading}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <X size={16} className="inline mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || isLoading}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                <Save size={16} />
                {uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}