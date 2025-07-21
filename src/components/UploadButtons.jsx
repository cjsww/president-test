import React from 'react';

const UploadButtons = ({ onFileUpload, onCameraClick }) => (
  <div className="flex flex-col sm:flex-row gap-4 mb-4 w-full max-w-xs sm:max-w-md">
    <input
      type="file"
      accept="image/*"
      onChange={onFileUpload}
      className="hidden"
      id="file-upload"
    />
    <label
      htmlFor="file-upload"
      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg cursor-pointer text-lg shadow-md text-center"
    >
      사진 업로드
    </label>
    <button
      onClick={onCameraClick}
      className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md"
    >
      카메라 촬영
    </button>
  </div>
);

export default UploadButtons;
